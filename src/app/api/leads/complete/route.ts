import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { sendResultEmail } from '@/lib/email/send-result-email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const costSchema = z.object({
  model: z.string().min(1),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  costUsd: z.number().nonnegative(),
})

// Success path: completion of a pending/processing submission with the model output.
const successBodySchema = z.object({
  submissionId: z.string().uuid(),
  output: z.record(z.string(), z.unknown()),
  cost: costSchema.optional(),
  status: z.literal('completed').optional(),
  errorMessage: z.never().optional(),
  // When false, save the output but do NOT send the result email. Gated apps
  // (agentic-readiness, ai-overview-tracker) set this on the first/free
  // completion so only the later full (free + gated) completion emails.
  sendEmail: z.boolean().optional(),
})

// Failure path: explicit marker so pending rows don't sit forever when the
// downstream model call errors out. SYS-543 introduced this so we can wire
// SYS-545 email delivery off the `failed` status as well.
const failureBodySchema = z.object({
  submissionId: z.string().uuid(),
  status: z.literal('failed'),
  errorMessage: z.string().max(500).optional(),
  output: z.record(z.string(), z.unknown()).optional(),
  cost: costSchema.optional(),
})

const bodySchema = z.union([failureBodySchema, successBodySchema])

function errorResponse(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function POST(request: Request) {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return errorResponse('Invalid JSON', 400)
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return errorResponse('Invalid input', 400)
  }

  const supabase = getSupabaseServerClient()

  const { data: existing, error: lookupErr } = await supabase
    .from('submissions')
    .select('id, status')
    .eq('id', parsed.data.submissionId)
    .maybeSingle()

  if (lookupErr) {
    console.error('[leads/complete] lookup error', lookupErr)
    return errorResponse('Something went wrong', 500)
  }
  if (!existing) {
    return errorResponse('Submission not found', 400)
  }
  // Allow a SUCCESS completion to update an already-completed submission — the
  // gated apps complete twice (free, then free+gated), and the second pass needs
  // to merge in the full result. Block only failed re-completions / failure-over-success.
  const isSuccessPath = parsed.data.status !== 'failed'
  const canUpdate =
    existing.status === 'pending' ||
    existing.status === 'processing' ||
    (existing.status === 'completed' && isSuccessPath)
  if (!canUpdate) {
    return errorResponse('Submission already finalized', 400)
  }

  const update: Record<string, unknown> = {
    completed_at: new Date().toISOString(),
  }

  if (parsed.data.status === 'failed') {
    update.status = 'failed'
    if (parsed.data.errorMessage) update.error_message = parsed.data.errorMessage
    if (parsed.data.output) update.output = parsed.data.output
  } else {
    update.status = 'completed'
    update.output = parsed.data.output
  }

  const cost = parsed.data.cost
  if (cost) {
    update.model_used = cost.model
    update.input_tokens = cost.inputTokens
    update.output_tokens = cost.outputTokens
    update.cost_usd = cost.costUsd
  }

  const { error: updateErr } = await supabase
    .from('submissions')
    .update(update)
    .eq('id', parsed.data.submissionId)

  if (updateErr) {
    console.error('[leads/complete] update error', updateErr)
    return errorResponse('Something went wrong', 500)
  }

  // Fire-and-forget transactional result email on the success branch, unless the
  // caller opted out (sendEmail:false) — gated apps suppress it on the free pass
  // so only the full free+gated completion emails. Never await / block on it.
  const sendEmail = (parsed.data as { sendEmail?: boolean }).sendEmail
  if (update.status === 'completed' && sendEmail !== false) {
    const submissionId = parsed.data.submissionId
    sendResultEmail(submissionId).catch((err) => {
      console.error('[leads/complete] background email send failed', {
        submissionId,
        err: err instanceof Error ? err.message : String(err),
      })
    })
  }

  return NextResponse.json({ ok: true })
}

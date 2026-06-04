import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const costSchema = z.object({
  model: z.string().min(1),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  costUsd: z.number().nonnegative(),
})

const bodySchema = z.object({
  submissionId: z.string().uuid(),
  output: z.record(z.string(), z.unknown()),
  cost: costSchema.optional(),
})

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

  const { submissionId, output, cost } = parsed.data
  const supabase = getSupabaseServerClient()

  const { data: existing, error: lookupErr } = await supabase
    .from('submissions')
    .select('id, status')
    .eq('id', submissionId)
    .maybeSingle()

  if (lookupErr) {
    console.error('[leads/complete] lookup error', lookupErr)
    return errorResponse('Something went wrong', 500)
  }
  if (!existing) {
    return errorResponse('Submission not found', 400)
  }
  if (existing.status !== 'pending' && existing.status !== 'processing') {
    return errorResponse('Submission already finalized', 400)
  }

  const update: Record<string, unknown> = {
    output,
    status: 'completed',
    completed_at: new Date().toISOString(),
  }
  if (cost) {
    update.model_used = cost.model
    update.input_tokens = cost.inputTokens
    update.output_tokens = cost.outputTokens
    update.cost_usd = cost.costUsd
  }

  const { error: updateErr } = await supabase
    .from('submissions')
    .update(update)
    .eq('id', submissionId)

  if (updateErr) {
    console.error('[leads/complete] update error', updateErr)
    return errorResponse('Something went wrong', 500)
  }

  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { EMAIL_REGEX, isDisposableEmail, isFreeEmailProvider } from '@/lib/leads/disposable'
import { checkRateLimit, getClientIp } from '@/lib/leads/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const enrichmentSchema = z.record(z.string(), z.unknown()).optional()

const bodySchema = z.object({
  email: z.string().min(3).max(254),
  miniAppSlug: z.string().min(1).max(64),
  input: z.record(z.string(), z.unknown()),
  output: z.record(z.string(), z.unknown()).optional(),
  enrichment: enrichmentSchema,
  marketingConsent: z.boolean().optional(),
})

function errorResponse(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(ip)
  if (!rl.ok) {
    return errorResponse('Too many submissions. Try again later.', 429)
  }

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

  const email = parsed.data.email.trim().toLowerCase()
  const { miniAppSlug, input, output } = parsed.data
  const enrichment = parsed.data.enrichment ?? {}
  const marketingConsent = parsed.data.marketingConsent ?? false

  if (!EMAIL_REGEX.test(email)) {
    return errorResponse('Please enter a valid email', 400)
  }
  if (isDisposableEmail(email)) {
    return errorResponse('Please use a work email', 400)
  }
  if (isFreeEmailProvider(email)) {
    return errorResponse('Please use a work email. Personal addresses are not accepted.', 400)
  }

  const supabase = getSupabaseServerClient()

  const { data: miniApp, error: miniAppErr } = await supabase
    .from('mini_apps')
    .select('slug')
    .eq('slug', miniAppSlug)
    .maybeSingle()

  if (miniAppErr) {
    console.error('[leads/submit] mini_apps lookup error', miniAppErr)
    return errorResponse('Something went wrong', 500)
  }
  if (!miniApp) {
    return errorResponse('Unknown mini-app', 400)
  }

  const { data: existingLead, error: leadLookupErr } = await supabase
    .from('leads')
    .select('id, enrichment, marketing_consent, unsubscribed_at')
    .ilike('email', email)
    .maybeSingle()

  if (leadLookupErr) {
    console.error('[leads/submit] lead lookup error', leadLookupErr)
    return errorResponse('Something went wrong', 500)
  }

  let leadId: string
  const isReturningLead = Boolean(existingLead)

  if (existingLead) {
    const mergedEnrichment = {
      ...((existingLead.enrichment as Record<string, unknown> | null) ?? {}),
      ...enrichment,
    }
    const nowIso = new Date().toISOString()
    const existingConsent = Boolean(
      (existingLead as { marketing_consent?: boolean }).marketing_consent
    )
    const wasUnsubscribed = Boolean(
      (existingLead as { unsubscribed_at?: string | null }).unsubscribed_at
    )

    const updatePayload: Record<string, unknown> = {
      last_seen_at: nowIso,
      enrichment: mergedEnrichment,
    }

    // Never silently revoke consent. Only upgrade or resubscribe.
    if (marketingConsent === true) {
      if (wasUnsubscribed) {
        updatePayload.marketing_consent = true
        updatePayload.marketing_consent_at = nowIso
        updatePayload.marketing_consent_source = 'email_gate_v2_resubscribe'
        updatePayload.unsubscribed_at = null
      } else if (existingConsent === false) {
        updatePayload.marketing_consent = true
        updatePayload.marketing_consent_at = nowIso
        updatePayload.marketing_consent_source = 'email_gate_v2'
      }
      // else: already consented, no-op
    }
    // incoming false: NO-OP (never revoke silently)

    const { error: updateErr } = await supabase
      .from('leads')
      .update(updatePayload)
      .eq('id', existingLead.id)
    if (updateErr) {
      console.error('[leads/submit] lead update error', updateErr)
      return errorResponse('Something went wrong', 500)
    }
    leadId = existingLead.id as string
  } else {
    const nowIso = new Date().toISOString()
    const { data: inserted, error: insertErr } = await supabase
      .from('leads')
      .insert({
        email,
        first_source: miniAppSlug,
        enrichment,
        marketing_consent: marketingConsent,
        marketing_consent_at: marketingConsent ? nowIso : null,
        marketing_consent_source: marketingConsent ? 'email_gate_v2' : null,
      })
      .select('id')
      .single()
    if (insertErr || !inserted) {
      console.error('[leads/submit] lead insert error', insertErr)
      return errorResponse('Something went wrong', 500)
    }
    leadId = inserted.id as string
  }

  const completed = output !== undefined
  const { data: submission, error: submissionErr } = await supabase
    .from('submissions')
    .insert({
      lead_id: leadId,
      email,
      mini_app_slug: miniAppSlug,
      input,
      output: output ?? {},
      status: completed ? 'completed' : 'pending',
      completed_at: completed ? new Date().toISOString() : null,
    })
    .select('id')
    .single()

  if (submissionErr || !submission) {
    console.error('[leads/submit] submission insert error', submissionErr)
    return errorResponse('Something went wrong', 500)
  }

  return NextResponse.json({
    ok: true,
    leadId,
    submissionId: submission.id,
    isReturningLead,
  })
}

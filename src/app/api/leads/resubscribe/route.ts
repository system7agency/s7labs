import { NextResponse } from 'next/server'
import { z } from 'zod'

import { checkRateLimit, getClientIp } from '@/lib/leads/rateLimit'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  token: z.string().min(1).max(128),
})

function errorResponse(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(ip)
  if (!rl.ok) {
    return errorResponse('Too many requests. Try again later.', 429)
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

  const supabase = getSupabaseServerClient()

  const { data: lead, error: lookupErr } = await supabase
    .from('leads')
    .select('id, marketing_consent, unsubscribed_at')
    .eq('unsubscribe_token', parsed.data.token)
    .maybeSingle()

  if (lookupErr) {
    console.error('[leads/resubscribe] lookup error', lookupErr.message)
    return errorResponse('Something went wrong', 500)
  }
  if (!lead) {
    return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 404 })
  }

  const alreadySubscribed = lead.unsubscribed_at === null && lead.marketing_consent === true
  if (alreadySubscribed) {
    return NextResponse.json({ ok: true, alreadySubscribed: true })
  }

  const nowIso = new Date().toISOString()
  const { error: updateErr } = await supabase
    .from('leads')
    .update({
      unsubscribed_at: null,
      marketing_consent: true,
      marketing_consent_at: nowIso,
      marketing_consent_source: 'resubscribe_page',
    })
    .eq('id', lead.id)

  if (updateErr) {
    console.error('[leads/resubscribe] update error', updateErr.message)
    return errorResponse('Something went wrong', 500)
  }

  return NextResponse.json({ ok: true, alreadySubscribed: false })
}

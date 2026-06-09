/**
 * SYS-552: Transactional result-email dispatcher.
 *
 * Looks up a completed submission, builds the locked n8n webhook payload, and
 * posts it with bounded retries. Used in two places:
 *   1. Fire-and-forget from /api/leads/complete on the success branch.
 *   2. Synchronously from /api/results/resend for manual re-delivery.
 *
 * Logging policy: ALWAYS include submissionId. NEVER log the recipient email,
 * unsubscribe token, or webhook URL.
 */

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { buildUnsubscribeUrl } from '@/lib/leads/unsubscribe-link'

const BACKOFF_MS = [1000, 3000, 9000] as const

export type SendResultEmailResult = { ok: true } | { ok: false; error: string }

type MiniAppRow = { name: string | null }
type LeadRow = { unsubscribe_token: string | null }

type SubmissionJoined = {
  id: string
  email: string | null
  mini_app_slug: string | null
  status: string | null
  created_at: string | null
  mini_apps: MiniAppRow | MiniAppRow[] | null
  leads: LeadRow | LeadRow[] | null
}

function pickOne<T>(v: T | T[] | null | undefined): T | null {
  if (v === null || v === undefined) return null
  if (Array.isArray(v)) return v[0] ?? null
  return v
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function sanitize(message: string, email: string | null): string {
  // Defence in depth: even though we control these strings, scrub the email
  // before it ever reaches a log line.
  if (!email) return message
  return message.split(email).join('<redacted>')
}

export async function sendResultEmail(submissionId: string): Promise<SendResultEmailResult> {
  const webhookUrl = process.env.N8N_EMAIL_WEBHOOK_URL
  if (!webhookUrl) {
    const error = 'N8N_EMAIL_WEBHOOK_URL is not configured'
    console.error('[send-result-email] env missing', { submissionId })
    return { ok: false, error }
  }

  const supabase = getSupabaseServerClient()

  const { data, error: lookupErr } = await supabase
    .from('submissions')
    .select(
      'id, email, mini_app_slug, status, created_at, mini_apps(name), leads(unsubscribe_token)'
    )
    .eq('id', submissionId)
    .maybeSingle()

  if (lookupErr) {
    console.error('[send-result-email] lookup error', {
      submissionId,
      err: lookupErr.message,
    })
    return { ok: false, error: 'Submission lookup failed' }
  }

  const submission = data as SubmissionJoined | null
  if (!submission) {
    console.error('[send-result-email] submission not found', { submissionId })
    return { ok: false, error: 'Submission not found' }
  }

  if (submission.status !== 'completed') {
    console.error('[send-result-email] submission not completed', {
      submissionId,
      status: submission.status,
    })
    return {
      ok: false,
      error: `Submission status is ${submission.status ?? 'unknown'}, expected completed`,
    }
  }

  if (!submission.email) {
    console.error('[send-result-email] submission has no email', { submissionId })
    return { ok: false, error: 'Submission has no email' }
  }

  if (!submission.mini_app_slug) {
    console.error('[send-result-email] submission has no mini_app_slug', { submissionId })
    return { ok: false, error: 'Submission has no mini_app_slug' }
  }

  const lead = pickOne(submission.leads)
  if (!lead || !lead.unsubscribe_token) {
    console.error('[send-result-email] lead has no unsubscribe_token', {
      submissionId,
    })
    return { ok: false, error: 'Lead has no unsubscribe_token' }
  }

  const miniApp = pickOne(submission.mini_apps)
  const miniAppName = miniApp?.name ?? submission.mini_app_slug

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://s7labs.ai'
  const resultUrl = `${baseUrl}/results/${submission.id}`
  const unsubscribeUrl = buildUnsubscribeUrl(lead.unsubscribe_token)

  const payload = {
    submissionId: submission.id,
    email: submission.email,
    miniAppSlug: submission.mini_app_slug,
    miniAppName,
    resultUrl,
    unsubscribeUrl,
    createdAt: submission.created_at ?? new Date().toISOString(),
  }

  let lastError = 'Unknown error'

  for (let attempt = 0; attempt < BACKOFF_MS.length; attempt++) {
    if (attempt > 0) {
      const delay = BACKOFF_MS[attempt - 1] ?? 0
      await sleep(delay)
    }

    try {
      // NOTE: This is a transactional email. We always send regardless of marketing_consent or unsubscribed_at status. Users get their requested mini-app result.
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        // eslint-disable-next-line no-console -- SYS-552 spec calls for console.log on success so the line shows up in info-level logs separately from warn/error retry noise.
        console.log('[send-result-email] sent', {
          submissionId,
          attempt: attempt + 1,
        })
        return { ok: true }
      }

      lastError = `Webhook returned status ${res.status}`
      console.warn('[send-result-email] non-2xx response', {
        submissionId,
        attempt: attempt + 1,
        status: res.status,
      })
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
      console.warn('[send-result-email] fetch threw', {
        submissionId,
        attempt: attempt + 1,
        err: sanitize(lastError, submission.email),
      })
    }
  }

  console.error('[send-result-email] giving up after retries', {
    submissionId,
    err: sanitize(lastError, submission.email),
  })
  return { ok: false, error: sanitize(lastError, submission.email) }
}

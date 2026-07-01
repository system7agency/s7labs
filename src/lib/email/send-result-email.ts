/**
 * Transactional result-email dispatcher (Resend).
 *
 * Looks up a completed submission and emails the rendered result to the lead via
 * the Resend API (RESEND_API_KEY), with bounded retries. Used in two places:
 *   1. Fire-and-forget from /api/leads/complete on the success branch (i.e. the
 *      moment a mini-app produces and saves its result).
 *   2. Synchronously from /api/results/resend for manual re-delivery.
 *
 * Sends directly via Resend (an email key), NOT the n8n automation webhook — so
 * it is independent of the n8n kill-switch (which still gates lead / RevOps
 * sync). Set RESULT_EMAILS_ENABLED=false to hard-disable without removing the key.
 *
 * Logging policy: ALWAYS include submissionId. NEVER log the recipient email,
 * unsubscribe token, or API key.
 */

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { buildUnsubscribeUrl } from '@/lib/leads/unsubscribe-link'
import { launchPathForSlug } from '@/app/results/[submissionId]/_components/slug-map'
import { renderResultEmail } from './render-result-html'

const BACKOFF_MS = [1000, 3000, 9000] as const
const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const DEFAULT_FROM = 'no-reply@wsdv.store'

/** Hard off-switch, independent of the env key (default on). */
const RESULT_EMAILS_ENABLED = process.env.RESULT_EMAILS_ENABLED !== 'false'

/**
 * Slugs whose mini-app page restores a saved result from `?result=<id>`. Their
 * email links go to that page (native design). Everything else falls back to the
 * generic /results/<id> page. (DB slug values; a few differ from folder names.)
 * Excluded on purpose: bulk-email-finder, gtm-flywheel, roi-calculator — those
 * pages don't persist a restorable output, so they keep the /results fallback.
 */
const RESULT_PARAM_SLUGS = new Set<string>([
  'agentic-readiness',
  'ai-overview-tracker',
  'ai-visibility-score',
  'automation-blueprint',
  'campaign-ideation',
  'crm-field-sanity-check',
  'email-copy-optimizer',
  'email-finder',
  'find-people',
  'intent-signals',
  'job-posting-sales-brief',
  'linkedin-post-outbound-hook',
  'linkedin-profile-reviewer',
  'outbound-trigger-radar',
  'pricing-diagnostic',
  'proposal-engine',
  'share-of-voice',
  'tech-stack-finder',
  'tech-stack-recommender',
  'website-roast',
])

export type SendResultEmailResult = { ok: true } | { ok: false; error: string }

type MiniAppRow = { name: string | null }
type LeadRow = { unsubscribe_token: string | null }

type SubmissionJoined = {
  id: string
  email: string | null
  mini_app_slug: string | null
  status: string | null
  created_at: string | null
  output: Record<string, unknown> | null
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
  // Defence in depth: scrub the recipient address before it reaches a log line.
  if (!email) return message
  return message.split(email).join('<redacted>')
}

export async function sendResultEmail(submissionId: string): Promise<SendResultEmailResult> {
  if (!RESULT_EMAILS_ENABLED) {
    return { ok: false, error: 'Result emails are disabled' }
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[send-result-email] RESEND_API_KEY is not configured', { submissionId })
    return { ok: false, error: 'RESEND_API_KEY is not configured' }
  }
  const fromAddress = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM
  const from = fromAddress.includes('<') ? fromAddress : `S7 Labs <${fromAddress}>`

  const supabase = getSupabaseServerClient()

  const { data, error: lookupErr } = await supabase
    .from('submissions')
    .select(
      'id, email, mini_app_slug, status, created_at, output, mini_apps(name), leads(unsubscribe_token)'
    )
    .eq('id', submissionId)
    .maybeSingle()

  if (lookupErr) {
    console.error('[send-result-email] lookup error', { submissionId, err: lookupErr.message })
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
    console.error('[send-result-email] lead has no unsubscribe_token', { submissionId })
    return { ok: false, error: 'Lead has no unsubscribe_token' }
  }

  const miniApp = pickOne(submission.mini_apps)
  const miniAppName = miniApp?.name ?? submission.mini_app_slug

  const unsubscribeUrl = buildUnsubscribeUrl(lead.unsubscribe_token)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://s7labs.ai'
  // Migrated apps render the saved result on their own page via ?result=<id>
  // (the page's native design). Apps not yet migrated fall back to the generic
  // /results/<id> page. Add a slug here as each app gains ?result support.
  const resultUrl = RESULT_PARAM_SLUGS.has(submission.mini_app_slug)
    ? `${baseUrl}${launchPathForSlug(submission.mini_app_slug)}?result=${submission.id}`
    : `${baseUrl}/results/${submission.id}`

  // One generic S7-themed email for every app: heading, message, a "View full
  // result" button to the live report page, and footer. No result data inline.
  const { html, text } = renderResultEmail({
    appName: miniAppName,
    resultUrl,
    unsubscribeUrl,
  })

  // NOTE: transactional email — always sent regardless of marketing_consent.
  // The user requested their mini-app result.
  const emailPayload = {
    from,
    to: [submission.email],
    subject: `Your ${miniAppName} result is ready`,
    html,
    text,
    headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>` },
  }

  let lastError = 'Unknown error'

  for (let attempt = 0; attempt < BACKOFF_MS.length; attempt++) {
    if (attempt > 0) {
      const delay = BACKOFF_MS[attempt - 1] ?? 0
      await sleep(delay)
    }

    try {
      const res = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(emailPayload),
      })

      if (res.ok) {
        // eslint-disable-next-line no-console -- info-level success line, kept separate from warn/error retry noise.
        console.log('[send-result-email] sent', { submissionId, attempt: attempt + 1 })
        return { ok: true }
      }

      const detail = await res.text().catch(() => '')
      lastError = `Resend returned status ${res.status}`
      console.warn('[send-result-email] non-2xx response', {
        submissionId,
        attempt: attempt + 1,
        status: res.status,
        detail: sanitize(detail.slice(0, 200), submission.email),
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

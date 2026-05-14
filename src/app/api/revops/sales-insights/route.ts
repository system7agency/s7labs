import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const TIMEOUT_MS = 30_000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

type RejectReason = 'invalid_email_format' | 'free_email_domain' | string

type NormalizedResponse =
  | { ok: true; state: 'processing' | 'cached'; message: string }
  | { ok: false; state: 'rejected'; reason: RejectReason; message: string }
  | { ok: false; state: 'error'; message: string }

function friendlyReasonCopy(reason: RejectReason): string {
  if (reason === 'invalid_email_format') return 'Enter a valid email address.'
  if (reason === 'free_email_domain') return 'Please use your work email address.'
  return 'That email was rejected. Please try a different work email.'
}

function jsonResponse(body: NormalizedResponse, status: number) {
  return NextResponse.json(body, { status })
}

export async function POST(request: Request) {
  const webhookUrl = process.env.N8N_SALES_INSIGHTS_WEBHOOK_URL
  if (!webhookUrl) {
    return jsonResponse(
      { ok: false, state: 'error', message: 'Something went wrong. Please try again.' },
      502
    )
  }

  let payload: { email?: unknown; type?: unknown }
  try {
    payload = (await request.json()) as { email?: unknown; type?: unknown }
  } catch {
    return jsonResponse(
      {
        ok: false,
        state: 'rejected',
        reason: 'invalid_email_format',
        message: friendlyReasonCopy('invalid_email_format'),
      },
      422
    )
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : ''
  const type = typeof payload.type === 'string' && payload.type.length > 0 ? payload.type : 'sales'

  if (!email || !EMAIL_RE.test(email)) {
    return jsonResponse(
      {
        ok: false,
        state: 'rejected',
        reason: 'invalid_email_format',
        message: friendlyReasonCopy('invalid_email_format'),
      },
      422
    )
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let upstream: Response
  try {
    upstream = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type }),
      signal: controller.signal,
      cache: 'no-store',
    })
  } catch {
    clearTimeout(timer)
    return jsonResponse(
      { ok: false, state: 'error', message: 'Something went wrong. Please try again.' },
      502
    )
  }
  clearTimeout(timer)

  let body: {
    ok?: unknown
    status?: unknown
    cached?: unknown
    reason?: unknown
    message?: unknown
  }
  try {
    body = (await upstream.json()) as typeof body
  } catch {
    return jsonResponse(
      { ok: false, state: 'error', message: 'Something went wrong. Please try again.' },
      502
    )
  }

  if (body.ok === false) {
    const reason: RejectReason = typeof body.reason === 'string' ? body.reason : 'rejected'
    return jsonResponse(
      {
        ok: false,
        state: 'rejected',
        reason,
        message: friendlyReasonCopy(reason),
      },
      422
    )
  }

  if (body.ok === true) {
    const cached = body.cached === true
    const message =
      typeof body.message === 'string' && body.message.length > 0
        ? body.message
        : cached
          ? "We've already got this one on file — check your inbox."
          : "Got it. We're putting your report together now."
    return jsonResponse(
      {
        ok: true,
        state: cached ? 'cached' : 'processing',
        message,
      },
      200
    )
  }

  return jsonResponse(
    { ok: false, state: 'error', message: 'Something went wrong. Please try again.' },
    502
  )
}

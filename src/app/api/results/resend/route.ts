/**
 * SYS-552: Manual result-email resend endpoint.
 *
 * Synchronous wrapper around sendResultEmail() with an in-memory sliding
 * window rate limit: 3 sends per submissionId per hour. The window resets
 * on cold start, which is acceptable for the dev / small-traffic case the
 * ticket calls out; the n8n side is the durable record.
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendResultEmail } from '@/lib/email/send-result-email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_WINDOW = 3

const bodySchema = z.object({
  submissionId: z.string().uuid(),
})

const attempts = new Map<string, number[]>()

function checkRateLimit(
  submissionId: string
): { ok: true; remaining: number } | { ok: false; resetMs: number } {
  const now = Date.now()
  const cutoff = now - WINDOW_MS
  const existing = (attempts.get(submissionId) ?? []).filter((ts) => ts > cutoff)

  if (existing.length >= MAX_PER_WINDOW) {
    const oldest = existing[0] ?? now
    const resetMs = Math.max(0, oldest + WINDOW_MS - now)
    attempts.set(submissionId, existing)
    return { ok: false, resetMs }
  }

  existing.push(now)
  attempts.set(submissionId, existing)
  return { ok: true, remaining: MAX_PER_WINDOW - existing.length }
}

export async function POST(request: Request) {
  // sendResultEmail self-gates (RESULT_EMAILS_ENABLED + RESEND_API_KEY); a
  // disabled/misconfigured send returns ok:false below.
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid input' }, { status: 400 })
  }

  const { submissionId } = parsed.data

  const limit = checkRateLimit(submissionId)
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: 'Rate limit exceeded', resetMs: limit.resetMs },
      { status: 429 }
    )
  }

  const result = await sendResultEmail(submissionId)
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, remaining: limit.remaining })
}

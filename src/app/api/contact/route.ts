import { NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const TIMEOUT_MS = 10_000

// --- Rate limiting: max 5 contact submissions per IP per hour (in-memory) ---
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const submissionLog = new Map<string, number[]>()

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

function withinRateLimit(ip: string): boolean {
  const now = Date.now()
  const recent = (submissionLog.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  if (recent.length >= RATE_LIMIT_MAX) {
    submissionLog.set(ip, recent)
    return false
  }
  recent.push(now)
  submissionLog.set(ip, recent)
  return true
}

const ContactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Enter a valid email').max(200),
  company: z.string().trim().max(150).optional().default(''),
  message: z.string().trim().min(10, 'Tell us a little more').max(2000),
  // Honeypot — humans never fill this. Bots that do get a quiet "success".
  website: z.string().max(200).optional().default(''),
  source: z.string().trim().max(60).optional().default('unknown'),
  page: z.string().trim().max(200).optional().default(''),
})

export async function POST(request: Request) {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const parsed = ContactSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return NextResponse.json({ error: first?.message ?? 'Invalid request' }, { status: 400 })
  }
  const data = parsed.data

  // Honeypot tripped: pretend success, send nothing.
  if (data.website) {
    return NextResponse.json({ ok: true })
  }

  const ip = getClientIp(request)
  if (!withinRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many messages. Please try again in an hour.' },
      { status: 429 }
    )
  }

  const webhookUrl = process.env.N8N_CONTACT_WEBHOOK_URL
  if (!webhookUrl) {
    console.error('[contact] N8N_CONTACT_WEBHOOK_URL is not configured')
    return NextResponse.json(
      { error: 'Contact service is not available right now. Please email us directly.' },
      { status: 503 }
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        company: data.company,
        message: data.message,
        source: data.source,
        page: data.page,
        submittedAt: new Date().toISOString(),
      }),
      signal: controller.signal,
    })
    if (!res.ok) {
      console.error('[contact] webhook responded', res.status)
      return NextResponse.json(
        { error: 'Could not send your message. Please try again.' },
        { status: 502 }
      )
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contact] webhook error:', err)
    return NextResponse.json(
      { error: 'Could not send your message. Please try again.' },
      { status: 502 }
    )
  } finally {
    clearTimeout(timeout)
  }
}

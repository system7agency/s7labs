import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ELEVENLABS_OUTBOUND_URL = 'https://api.elevenlabs.io/v1/convai/twilio/outbound-call'
const TIMEOUT_MS = 20_000

// E.164: leading +, first digit 1-9, up to 14 more digits.
const E164_RE = /^\+[1-9]\d{6,14}$/

// --- Rate limiting: max 3 outbound calls per IP per hour (in-memory) ---
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const callLog = new Map<string, number[]>()

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

/** Returns true if the IP is within its hourly quota, recording the attempt. */
function withinRateLimit(ip: string): boolean {
  const now = Date.now()
  const recent = (callLog.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  if (recent.length >= RATE_LIMIT_MAX) {
    callLog.set(ip, recent)
    return false
  }
  recent.push(now)
  callLog.set(ip, recent)
  return true
}

export async function POST(request: Request) {
  let payload: { phoneNumber?: unknown }
  try {
    payload = (await request.json()) as { phoneNumber?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
  }

  const phoneNumber = typeof payload.phoneNumber === 'string' ? payload.phoneNumber.trim() : ''
  if (!phoneNumber || !E164_RE.test(phoneNumber)) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
  }

  // Rate limit before doing any upstream work.
  const ip = getClientIp(request)
  if (!withinRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many call requests. Try again in an hour.' },
      { status: 429 }
    )
  }

  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
  const agentPhoneNumberId = process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID
  const apiKey = process.env.ELEVENLABS_API_KEY

  const missing = [
    !agentId && 'NEXT_PUBLIC_ELEVENLABS_AGENT_ID',
    !agentPhoneNumberId && 'ELEVENLABS_AGENT_PHONE_NUMBER_ID',
    !apiKey && 'ELEVENLABS_API_KEY',
  ].filter(Boolean)

  if (missing.length > 0) {
    // Names only — never log the key's value.
    console.error('[outbound-call] Missing env var(s):', missing.join(', '))
    return NextResponse.json({ error: 'Service not configured' }, { status: 500 })
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const upstream = await fetch(ELEVENLABS_OUTBOUND_URL, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey as string,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: agentId,
        agent_phone_number_id: agentPhoneNumberId,
        to_number: phoneNumber,
      }),
      signal: controller.signal,
      cache: 'no-store',
    })

    const data = (await upstream.json().catch(() => ({}))) as {
      conversation_id?: string
      conversationId?: string
      detail?: unknown
      message?: unknown
      error?: unknown
    }

    if (!upstream.ok) {
      const errorMessage =
        extractMessage(data.detail) ||
        extractMessage(data.message) ||
        extractMessage(data.error) ||
        'Failed to place call'
      console.error('[outbound-call] ElevenLabs error', upstream.status, errorMessage)
      return NextResponse.json({ error: errorMessage }, { status: upstream.status })
    }

    return NextResponse.json(
      { success: true, conversationId: data.conversation_id ?? data.conversationId ?? null },
      { status: 200 }
    )
  } catch (err) {
    console.error('[outbound-call] Unexpected failure:', err)
    return NextResponse.json({ error: 'Could not place call. Please try again.' }, { status: 500 })
  } finally {
    clearTimeout(timer)
  }
}

/** ElevenLabs error bodies vary — detail can be a string or { message } object. */
function extractMessage(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (value && typeof value === 'object' && 'message' in value) {
    const m = (value as { message?: unknown }).message
    if (typeof m === 'string' && m.trim()) return m.trim()
  }
  return null
}

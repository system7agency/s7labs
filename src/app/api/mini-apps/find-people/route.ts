import { NextResponse } from 'next/server'

import { buildStubResponse } from './stub'
import type { ApiResponse } from './types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_PER_HOUR = 5
const RATE_WINDOW_MS = 60 * 60 * 1000

// ---------- rate limit ----------

const rateBuckets = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const bucket = rateBuckets.get(ip)
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (bucket.count >= MAX_PER_HOUR) return false
  bucket.count += 1
  return true
}

function getClientIp(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return headers.get('x-real-ip')?.trim() ?? 'unknown'
}

// ---------- input ----------

function isDomainInput(value: string): boolean {
  // Anything with a dot we treat as a domain. Stripped of protocol/path first.
  const bare =
    value
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0] ?? ''
  return bare.includes('.')
}

function normaliseCompany(value: string): { input: string; isDomain: boolean } {
  const trimmed = value.trim()
  if (isDomainInput(trimmed)) {
    const bare =
      trimmed
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0] ?? trimmed.toLowerCase()
    return { input: bare, isDomain: true }
  }
  return { input: trimmed, isDomain: false }
}

// ---------- handler ----------

function jsonResponse(body: ApiResponse, status: number, mode?: 'stub' | 'live') {
  const headers: Record<string, string> = {}
  if (mode) headers['X-Mode'] = mode
  return NextResponse.json(body, { status, headers })
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers)
  if (!checkRateLimit(ip)) {
    return jsonResponse({ ok: false, error: 'Too many lookups. Try again in an hour.' }, 429)
  }

  let payload: { company?: unknown }
  try {
    payload = (await request.json()) as { company?: unknown }
  } catch {
    return jsonResponse({ ok: false, error: 'Please enter a valid company name or domain' }, 400)
  }

  const rawCompany = typeof payload.company === 'string' ? payload.company.trim() : ''
  if (rawCompany.length < 2 || rawCompany.length > 200) {
    return jsonResponse({ ok: false, error: 'Please enter a valid company name or domain' }, 400)
  }

  const { input, isDomain } = normaliseCompany(rawCompany)

  const apiKey = process.env.APOLLO_API_KEY

  // No key → stub in dev, hard fail in production.
  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      const result = buildStubResponse(input, isDomain)
      return jsonResponse({ ok: true, result, mode: 'stub' }, 200, 'stub')
    }
    return jsonResponse({ ok: false, error: 'Service temporarily unavailable' }, 503)
  }

  // Key present → for now still return stub (Apollo integration pending).
  // TODO: Apollo integration. See SYS-521 docs.
  try {
    const result = buildStubResponse(input, isDomain)
    return jsonResponse({ ok: true, result, mode: 'stub' }, 200, 'stub')
  } catch (err) {
    console.error('[find-people] unexpected error', err)
    return jsonResponse({ ok: false, error: 'Service temporarily unavailable' }, 502)
  }
}

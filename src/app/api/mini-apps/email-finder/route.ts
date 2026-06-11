import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const TIMEOUT_MS = 25_000
const MAX_PER_HOUR = 5
const RATE_WINDOW_MS = 60 * 60 * 1000

// ---------- types ----------

export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW'

export type EmailFinderResult = {
  email: string | null
  confidence: Confidence | null
  fullName: string
  title: string | null
  linkedinUrl: string | null
  companyDomain: string
  companyName: string
  source: 'Apollo'
  verifiedAt: string
}

type SuccessResponse = { ok: true; result: EmailFinderResult | null }
type ErrorResponse = { ok: false; error: string }
export type ApiResponse = SuccessResponse | ErrorResponse

// ---------- rate limit (in-memory, per-IP) ----------

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

// ---------- input parsing ----------

const DOMAIN_RE = /^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i
const LINKEDIN_RE = /^https?:\/\/(?:www\.)?linkedin\.com\/(?:company|school)\/([a-z0-9-]+)\/?/i

function splitName(full: string): { first: string; last: string } {
  const trimmed = full.trim().replace(/\s+/g, ' ')
  const idx = trimmed.lastIndexOf(' ')
  if (idx === -1) return { first: trimmed, last: '' }
  return { first: trimmed.slice(0, idx), last: trimmed.slice(idx + 1) }
}

function parseCompany(input: string): { domain?: string; linkedinSlug?: string } {
  const value = input.trim()
  const lower = value.toLowerCase()
  const linkedin = lower.match(LINKEDIN_RE)
  if (linkedin) return { linkedinSlug: linkedin[1] }
  // strip protocol/path if user pasted a URL like https://stripe.com/about
  const bare =
    lower
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0] ?? ''
  if (DOMAIN_RE.test(bare)) return { domain: bare }
  return {}
}

function mapConfidence(emailStatus: string | null | undefined): Confidence | null {
  if (!emailStatus) return null
  const s = emailStatus.toLowerCase()
  if (s === 'verified') return 'HIGH'
  if (s.includes('likely')) return 'MEDIUM'
  if (s === 'guessed') return 'LOW'
  return null
}

// ---------- apollo client ----------

type ApolloPerson = {
  first_name?: string | null
  last_name?: string | null
  name?: string | null
  title?: string | null
  linkedin_url?: string | null
  email?: string | null
  email_status?: string | null
  organization?: {
    name?: string | null
    website_url?: string | null
    primary_domain?: string | null
  } | null
}

type ApolloMatchResponse = { person?: ApolloPerson | null }
type ApolloOrgResponse = {
  organization?: { primary_domain?: string | null; name?: string | null } | null
}

async function apolloOrgEnrich(
  apiKey: string,
  slug: string,
  signal: AbortSignal
): Promise<{ domain: string | null; name: string | null }> {
  const res = await fetch(
    `https://api.apollo.io/api/v1/organizations/enrich?domain=${encodeURIComponent(slug)}`,
    {
      method: 'GET',
      headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
      signal,
    }
  )
  if (!res.ok) return { domain: null, name: null }
  const data = (await res.json()) as ApolloOrgResponse
  return {
    domain: data.organization?.primary_domain ?? null,
    name: data.organization?.name ?? null,
  }
}

async function apolloPeopleMatch(
  apiKey: string,
  body: Record<string, unknown>,
  signal: AbortSignal
): Promise<{ status: number; data: ApolloMatchResponse | null }> {
  const res = await fetch('https://api.apollo.io/api/v1/people/match', {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok) {
    // Surface Apollo's actual rejection reason (e.g. plan/scope/param errors on
    // a 422) — it is otherwise swallowed, which makes the client-side 502 opaque.
    const detail = await res.text().catch(() => '')
    console.error(
      `[email-finder] Apollo /people/match ${res.status} — body=${JSON.stringify(body)} resp=${detail.slice(0, 400)}`
    )
    return { status: res.status, data: null }
  }
  const data = (await res.json()) as ApolloMatchResponse
  return { status: res.status, data }
}

// ---------- handler ----------

function jsonResponse(body: ApiResponse, status: number) {
  return NextResponse.json(body, { status })
}

export async function POST(request: Request) {
  const apiKey = process.env.APOLLO_API_KEY
  if (!apiKey) {
    return jsonResponse({ ok: false, error: 'Service temporarily unavailable' }, 502)
  }

  const ip = getClientIp(request.headers)
  if (!checkRateLimit(ip)) {
    return jsonResponse({ ok: false, error: 'Too many lookups. Try again in an hour.' }, 429)
  }

  let payload: { name?: unknown; company?: unknown }
  try {
    payload = (await request.json()) as { name?: unknown; company?: unknown }
  } catch {
    return jsonResponse({ ok: false, error: 'Please enter a valid name and company' }, 400)
  }

  const rawName = typeof payload.name === 'string' ? payload.name.trim() : ''
  const rawCompany = typeof payload.company === 'string' ? payload.company.trim() : ''

  if (rawName.length < 2 || rawName.length > 100) {
    return jsonResponse({ ok: false, error: 'Please enter a valid name and company' }, 400)
  }
  if (!rawCompany) {
    return jsonResponse({ ok: false, error: 'Please enter a valid name and company' }, 400)
  }

  const parsed = parseCompany(rawCompany)
  if (!parsed.domain && !parsed.linkedinSlug) {
    return jsonResponse(
      { ok: false, error: 'Company must be a domain (stripe.com) or LinkedIn company URL' },
      400
    )
  }

  const { first, last } = splitName(rawName)
  if (!first) {
    return jsonResponse({ ok: false, error: 'Please enter a valid name and company' }, 400)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    // Resolve LinkedIn slug → domain if needed
    let domain = parsed.domain ?? null
    if (!domain && parsed.linkedinSlug) {
      const org = await apolloOrgEnrich(apiKey, parsed.linkedinSlug, controller.signal)
      domain = org.domain
      if (!domain) {
        clearTimeout(timer)
        return jsonResponse({ ok: true, result: null }, 200)
      }
    }

    const matchBody: Record<string, unknown> = {
      first_name: first,
      last_name: last,
      reveal_personal_emails: false,
    }
    if (domain) matchBody.domain = domain

    const { status, data } = await apolloPeopleMatch(apiKey, matchBody, controller.signal)
    clearTimeout(timer)

    if (status === 429) {
      return jsonResponse({ ok: false, error: 'High demand right now, try again in a minute' }, 429)
    }
    if (status === 401 || status === 403) {
      console.error('[email-finder] Apollo auth failed', status)
      return jsonResponse({ ok: false, error: 'Service temporarily unavailable' }, 502)
    }
    if (status >= 500 || data == null) {
      console.error('[email-finder] Apollo upstream error', status)
      return jsonResponse({ ok: false, error: 'Service temporarily unavailable' }, 502)
    }

    const person = data.person ?? null
    if (!person || !person.email) {
      return jsonResponse({ ok: true, result: null }, 200)
    }

    const confidence = mapConfidence(person.email_status)
    if (!confidence) {
      // Email present but unusable / unavailable status
      return jsonResponse({ ok: true, result: null }, 200)
    }

    const resolvedDomain =
      person.organization?.primary_domain ??
      person.organization?.website_url?.replace(/^https?:\/\//, '').replace(/\/.*$/, '') ??
      domain ??
      ''
    const fullName =
      person.name ?? [person.first_name, person.last_name].filter(Boolean).join(' ') ?? rawName

    const result: EmailFinderResult = {
      email: person.email,
      confidence,
      fullName,
      title: person.title ?? null,
      linkedinUrl: person.linkedin_url ?? null,
      companyDomain: resolvedDomain,
      companyName: person.organization?.name ?? '',
      source: 'Apollo',
      verifiedAt: new Date().toISOString(),
    }

    return jsonResponse({ ok: true, result }, 200)
  } catch (err) {
    clearTimeout(timer)
    const isAbort = err instanceof Error && err.name === 'AbortError'
    if (!isAbort) console.error('[email-finder] unexpected error', err)
    return jsonResponse({ ok: false, error: 'Service temporarily unavailable' }, 502)
  }
}

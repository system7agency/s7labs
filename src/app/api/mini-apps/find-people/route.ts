import { NextResponse } from 'next/server'

import { buildStubResponse } from './stub'
import type { ApiResponse, Department, FindPeopleResult, Person, Seniority } from './types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_PER_HOUR = 5
const RATE_WINDOW_MS = 60 * 60 * 1000
const APOLLO_SEARCH_ENDPOINT = 'https://api.apollo.io/api/v1/mixed_people/search'
const PER_PAGE = 25

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

// ---------- Apollo ----------

type ApolloPerson = {
  name?: string | null
  title?: string | null
  seniority?: string | null
  departments?: string[] | null
  linkedin_url?: string | null
  photo_url?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  organization?: {
    name?: string | null
    primary_domain?: string | null
    estimated_num_employees?: number | null
  } | null
}

type ApolloSearchResponse = {
  people?: ApolloPerson[]
  pagination?: { total_entries?: number }
  error?: string
}

// Apollo seniority enum → our 5-bucket scale.
function mapSeniority(s?: string | null): Seniority | null {
  switch (s) {
    case 'owner':
    case 'founder':
    case 'c_suite':
      return 'C-suite'
    case 'partner':
    case 'vp':
      return 'VP'
    case 'head':
    case 'director':
      return 'Director'
    case 'manager':
      return 'Manager'
    case 'senior':
    case 'entry':
    case 'intern':
      return 'Individual'
    default:
      return null
  }
}

// Apollo departments[] → our 6-bucket scale.
function mapDepartment(depts?: string[] | null): Department | null {
  const d = (depts ?? [])[0]?.toLowerCase() ?? ''
  if (!d) return null
  if (d.includes('engineer')) return 'Engineering'
  if (d.includes('sales')) return 'Sales'
  if (d.includes('marketing')) return 'Marketing'
  if (d.includes('product')) return 'Product'
  if (d.includes('operation')) return 'Operations'
  return 'Other'
}

function mapApolloPeople(data: ApolloSearchResponse, fallbackDomain: string): FindPeopleResult {
  const people: Person[] = (data.people ?? [])
    .map((p) => ({
      fullName: (p.name ?? '').trim(),
      title: (p.title ?? '').trim(),
      department: mapDepartment(p.departments),
      seniority: mapSeniority(p.seniority),
      linkedinUrl: p.linkedin_url ?? null,
      photoUrl: p.photo_url ?? null,
      location: [p.city, p.state, p.country].filter(Boolean).join(', ') || null,
    }))
    .filter((p) => p.fullName)

  const org = (data.people ?? []).find((p) => p.organization)?.organization
  return {
    companyName: org?.name ?? fallbackDomain,
    companyDomain: org?.primary_domain ?? fallbackDomain,
    totalEmployees: org?.estimated_num_employees ?? data.pagination?.total_entries ?? people.length,
    people,
  }
}

// People at a company, by domain, via Apollo People Search. Returns the mapped
// result, or null + the Apollo error string (plan/credit issues surface here).
async function apolloPeopleSearch(
  apiKey: string,
  domain: string
): Promise<{ result: FindPeopleResult | null; error?: string }> {
  const res = await fetch(APOLLO_SEARCH_ENDPOINT, {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({
      q_organization_domains_list: [domain],
      page: 1,
      per_page: PER_PAGE,
    }),
  })

  // Apollo signals plan/credit problems either as a non-2xx OR a 200 with
  // an `error` field — handle both and bubble the reason up for logging.
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    return { result: null, error: `HTTP ${res.status} ${detail.slice(0, 300)}` }
  }
  const data = (await res.json()) as ApolloSearchResponse
  if (data.error) return { result: null, error: data.error }

  return { result: mapApolloPeople(data, domain) }
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
  const isDev = process.env.NODE_ENV !== 'production'

  const stub = (): NextResponse =>
    jsonResponse(
      { ok: true, result: buildStubResponse(input, isDomain), mode: 'stub' },
      200,
      'stub'
    )

  // No key → stub in dev, hard fail in production.
  if (!apiKey) {
    if (isDev) return stub()
    return jsonResponse({ ok: false, error: 'Service temporarily unavailable' }, 503)
  }

  try {
    // Apollo People Search keys off a company domain. (Name-only lookups would
    // need an org-resolve call first; not wired since it needs the same plan.)
    if (isDomain) {
      const { result, error } = await apolloPeopleSearch(apiKey, input)
      if (result && result.people.length > 0) {
        return jsonResponse({ ok: true, result, mode: 'live' }, 200, 'live')
      }
      if (error) {
        // Surface Apollo's real reason (plan not entitled to search / no
        // credits / etc.) instead of a silent fallback.
        console.error(`[find-people] Apollo people-search unavailable — ${error}`)
      }
    }

    // Apollo returned nothing usable (or a name-only input): degrade to sample
    // data in dev so the UI is still demonstrable; fail cleanly in production.
    if (isDev) return stub()
    return jsonResponse({ ok: false, error: 'No people found for that company right now.' }, 404)
  } catch (err) {
    console.error('[find-people] unexpected error', err)
    if (isDev) return stub()
    return jsonResponse({ ok: false, error: 'Service temporarily unavailable' }, 502)
  }
}

import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import {
  createBulkEmailJob,
  type BulkEmailJobResult,
  updateBulkEmailJob,
} from '@/lib/mini-apps/bulk-email-jobs'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const TIMEOUT_MS = 25_000
const MAX_ROWS = 50
const CONCURRENCY = 5
const MAX_PER_HOUR = 10
const RATE_WINDOW_MS = 60 * 60 * 1000

type Confidence = 'HIGH' | 'MEDIUM' | 'LOW'

const InputSchema = z.object({
  rows: z.array(
    z.object({
      firstName: z.string().trim().min(1).max(100),
      lastName: z.string().trim().max(100).optional().default(''),
      company: z.string().trim().min(1).max(255),
    })
  ),
})

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
  if (fwd) return fwd.split(',')[0]?.trim() ?? 'unknown'
  return headers.get('x-real-ip')?.trim() ?? 'unknown'
}

const DOMAIN_RE = /^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i
const LINKEDIN_RE = /^https?:\/\/(?:www\.)?linkedin\.com\/(?:company|school)\/([a-z0-9-]+)\/?/i

type NormalizedRow = {
  row: number
  firstName: string
  lastName: string
  company: string
}

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

function parseCompany(input: string): { domain?: string; linkedinSlug?: string } {
  const value = input.trim()
  const lower = value.toLowerCase()
  const linkedin = lower.match(LINKEDIN_RE)
  if (linkedin) return { linkedinSlug: linkedin[1] }

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
  if (!res.ok) return { status: res.status, data: null }
  const data = (await res.json()) as ApolloMatchResponse
  return { status: res.status, data }
}

function normalizeRows(rawRows: z.infer<typeof InputSchema>['rows']): NormalizedRow[] {
  const deduped = new Map<string, NormalizedRow>()
  for (const [idx, row] of rawRows.entries()) {
    const firstName = row.firstName.trim()
    const lastName = row.lastName.trim()
    const company = row.company.trim()
    if (!firstName || !company) continue
    const key = `${firstName.toLowerCase()}|${lastName.toLowerCase()}|${company.toLowerCase()}`
    if (deduped.has(key)) continue
    deduped.set(key, {
      row: idx + 1,
      firstName,
      lastName,
      company,
    })
    if (deduped.size >= MAX_ROWS) break
  }
  return [...deduped.values()]
}

async function lookupEmail(apiKey: string, row: NormalizedRow): Promise<BulkEmailJobResult> {
  const parsed = parseCompany(row.company)
  if (!parsed.domain && !parsed.linkedinSlug) {
    return {
      row: row.row,
      firstName: row.firstName,
      lastName: row.lastName,
      company: row.company,
      email: null,
      confidence: null,
      title: null,
      linkedinUrl: null,
      companyDomain: '',
      companyName: '',
      source: 'Apollo',
      verifiedAt: null,
      status: 'error',
      error: 'Company must be a domain or LinkedIn company URL',
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    let domain = parsed.domain ?? null
    if (!domain && parsed.linkedinSlug) {
      const org = await apolloOrgEnrich(apiKey, parsed.linkedinSlug, controller.signal)
      domain = org.domain
      if (!domain) {
        return {
          row: row.row,
          firstName: row.firstName,
          lastName: row.lastName,
          company: row.company,
          email: null,
          confidence: null,
          title: null,
          linkedinUrl: null,
          companyDomain: '',
          companyName: '',
          source: 'Apollo',
          verifiedAt: null,
          status: 'not_found',
        }
      }
    }

    const body: Record<string, unknown> = {
      first_name: row.firstName,
      last_name: row.lastName,
      reveal_personal_emails: false,
    }
    if (domain) body.domain = domain

    const { status, data } = await apolloPeopleMatch(apiKey, body, controller.signal)
    if (status === 429) {
      return {
        row: row.row,
        firstName: row.firstName,
        lastName: row.lastName,
        company: row.company,
        email: null,
        confidence: null,
        title: null,
        linkedinUrl: null,
        companyDomain: domain ?? '',
        companyName: '',
        source: 'Apollo',
        verifiedAt: null,
        status: 'error',
        error: 'Rate limited by provider',
      }
    }
    if (status === 401 || status === 403 || status >= 500 || data == null) {
      return {
        row: row.row,
        firstName: row.firstName,
        lastName: row.lastName,
        company: row.company,
        email: null,
        confidence: null,
        title: null,
        linkedinUrl: null,
        companyDomain: domain ?? '',
        companyName: '',
        source: 'Apollo',
        verifiedAt: null,
        status: 'error',
        error: 'Provider unavailable',
      }
    }

    const person = data.person ?? null
    if (!person?.email) {
      return {
        row: row.row,
        firstName: row.firstName,
        lastName: row.lastName,
        company: row.company,
        email: null,
        confidence: null,
        title: null,
        linkedinUrl: null,
        companyDomain: domain ?? '',
        companyName: person?.organization?.name ?? '',
        source: 'Apollo',
        verifiedAt: null,
        status: 'not_found',
      }
    }

    const confidence = mapConfidence(person.email_status)
    if (!confidence) {
      return {
        row: row.row,
        firstName: row.firstName,
        lastName: row.lastName,
        company: row.company,
        email: null,
        confidence: null,
        title: null,
        linkedinUrl: person.linkedin_url ?? null,
        companyDomain: domain ?? '',
        companyName: person.organization?.name ?? '',
        source: 'Apollo',
        verifiedAt: null,
        status: 'not_found',
      }
    }

    const resolvedDomain =
      person.organization?.primary_domain ??
      person.organization?.website_url?.replace(/^https?:\/\//, '').replace(/\/.*$/, '') ??
      domain ??
      ''

    return {
      row: row.row,
      firstName: row.firstName,
      lastName: row.lastName,
      company: row.company,
      email: person.email,
      confidence,
      title: person.title ?? null,
      linkedinUrl: person.linkedin_url ?? null,
      companyDomain: resolvedDomain,
      companyName: person.organization?.name ?? '',
      source: 'Apollo',
      verifiedAt: new Date().toISOString(),
      status: 'found',
    }
  } catch (error) {
    const isAbort = error instanceof Error && error.name === 'AbortError'
    return {
      row: row.row,
      firstName: row.firstName,
      lastName: row.lastName,
      company: row.company,
      email: null,
      confidence: null,
      title: null,
      linkedinUrl: null,
      companyDomain: '',
      companyName: '',
      source: 'Apollo',
      verifiedAt: null,
      status: 'error',
      error: isAbort ? 'Timed out' : 'Unexpected provider error',
    }
  } finally {
    clearTimeout(timer)
  }
}

async function processWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const out = new Array<R>(items.length)
  let cursor = 0

  async function runWorker() {
    while (cursor < items.length) {
      const idx = cursor
      cursor += 1
      out[idx] = await worker(items[idx] as T)
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker())
  await Promise.all(workers)
  return out
}

async function processBulkJob(jobId: string, rows: NormalizedRow[]): Promise<void> {
  const apiKey = process.env.APOLLO_API_KEY
  if (!apiKey) {
    await updateBulkEmailJob(jobId, { status: 'failed' })
    return
  }

  const results: BulkEmailJobResult[] = Array.from({ length: rows.length }, (_, idx) => ({
    row: rows[idx]?.row ?? idx + 1,
    firstName: rows[idx]?.firstName ?? '',
    lastName: rows[idx]?.lastName ?? '',
    company: rows[idx]?.company ?? '',
    email: null,
    confidence: null,
    title: null,
    linkedinUrl: null,
    companyDomain: '',
    companyName: '',
    source: 'Apollo',
    verifiedAt: null,
    status: 'not_found',
  }))

  let completed = 0

  await processWithConcurrency(rows, CONCURRENCY, async (row) => {
    const result = await lookupEmail(apiKey, row)
    const targetIndex = rows.findIndex(
      (candidate) =>
        candidate.row === row.row &&
        candidate.firstName === row.firstName &&
        candidate.lastName === row.lastName &&
        candidate.company === row.company
    )
    if (targetIndex >= 0) results[targetIndex] = result
    completed += 1
    await updateBulkEmailJob(jobId, { completed, results })
    return result
  })

  await updateBulkEmailJob(jobId, { status: 'completed', completed, results })
}

type PostResponse = { ok: true; jobId: string; total: number } | { ok: false; error: string }

function jsonResponse(body: PostResponse, status: number) {
  return NextResponse.json(body, { status })
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers)
  if (!checkRateLimit(ip)) {
    return jsonResponse({ ok: false, error: 'Too many jobs. Try again in an hour.' }, 429)
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid request body.' }, 400)
  }

  const parsed = InputSchema.safeParse(payload)
  if (!parsed.success) {
    return jsonResponse(
      { ok: false, error: 'Provide rows with firstName, lastName, and company.' },
      400
    )
  }

  const rows = normalizeRows(parsed.data.rows)
  if (rows.length === 0) {
    return jsonResponse({ ok: false, error: 'No valid rows to process.' }, 400)
  }

  const jobId = randomUUID()
  await createBulkEmailJob({ id: jobId, total: rows.length, completed: 0, status: 'processing' })

  void processBulkJob(jobId, rows).catch(async (error) => {
    console.error('[bulk-email-finder] job failed:', error)
    await updateBulkEmailJob(jobId, { status: 'failed' })
  })

  return jsonResponse({ ok: true, jobId, total: rows.length }, 200)
}

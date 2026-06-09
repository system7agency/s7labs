import { NextResponse } from 'next/server'

import { getTechDetectProvider, isQuotaError } from './_providers'
import {
  NORMALIZED_TECH_CATEGORIES,
  type NormalizedTechCategory,
  type TechnologyCategory,
  type TechStackFinderApiResponse,
} from '@/lib/mini-apps/tech-stack-types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 55

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const PROVIDER_TIMEOUT_MS = 50_000

type CacheEntry = {
  domain: string
  categories: TechnologyCategory[]
  totalTechnologies: number
  analyzedAt: string
  provider: string
  cachedAtMs: number
}

const cache = new Map<string, CacheEntry>()

const CATEGORY_ALIASES: Record<string, NormalizedTechCategory> = {
  analytics: 'Analytics',
  tracking: 'Analytics',
  advertising: 'Advertising',
  ads: 'Advertising',
  cms: 'CMS',
  'content management': 'CMS',
  frameworks: 'Frameworks',
  framework: 'Frameworks',
  frontend: 'Frameworks',
  'hosting/cdn': 'Hosting/CDN',
  hosting: 'Hosting/CDN',
  cdn: 'Hosting/CDN',
  'crm/sales': 'CRM/Sales',
  crm: 'CRM/Sales',
  sales: 'CRM/Sales',
  'email/marketing': 'Email/Marketing',
  email: 'Email/Marketing',
  marketing: 'Email/Marketing',
  ecommerce: 'Ecommerce',
  'e-commerce': 'Ecommerce',
  other: 'Other',
}

function jsonResponse(body: TechStackFinderApiResponse, status: number) {
  return NextResponse.json(body, { status })
}

function normalizeDomain(input: string): string | null {
  const trimmed = input.trim().toLowerCase()
  if (!trimmed) return null

  const withProtocol = trimmed.includes('://') ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(withProtocol)
    const host = url.hostname.replace(/^www\./, '')
    const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i

    if (!DOMAIN_RE.test(host)) return null
    return host
  } catch {
    return null
  }
}

function normalizeCategories(raw: TechnologyCategory[]): TechnologyCategory[] {
  const byCategory = new Map<
    NormalizedTechCategory,
    Map<string, { name: string; slug: string; confidence?: number }>
  >()

  for (const category of raw) {
    const incoming = CATEGORY_ALIASES[category.name.trim().toLowerCase()] ?? 'Other'
    if (!byCategory.has(incoming)) byCategory.set(incoming, new Map())
    const bucket = byCategory.get(incoming)
    if (!bucket) continue

    for (const tech of category.technologies) {
      const slug = tech.slug.trim().toLowerCase()
      if (!slug) continue
      bucket.set(slug, {
        name: tech.name.trim() || slug,
        slug,
        confidence: tech.confidence,
      })
    }
  }

  return NORMALIZED_TECH_CATEGORIES.map((name) => {
    const techs = [...(byCategory.get(name)?.values() ?? [])]
    return { name, technologies: techs }
  }).filter((category) => category.technologies.length > 0)
}

export async function POST(request: Request) {
  let payload: { domain?: unknown }
  try {
    payload = (await request.json()) as { domain?: unknown }
  } catch {
    return jsonResponse({ ok: false, message: 'Invalid request.' }, 422)
  }

  const rawDomain = typeof payload.domain === 'string' ? payload.domain : ''
  const domain = normalizeDomain(rawDomain)
  if (!domain) {
    return jsonResponse(
      { ok: false, message: 'Enter a valid domain like acme.com to continue.' },
      422
    )
  }

  const now = Date.now()
  const cached = cache.get(domain)
  if (cached && now - cached.cachedAtMs < CACHE_TTL_MS) {
    return jsonResponse(
      {
        ok: true,
        data: {
          domain: cached.domain,
          categories: cached.categories,
          totalTechnologies: cached.totalTechnologies,
          analyzedAt: cached.analyzedAt,
          provider: cached.provider,
          cached: true,
        },
      },
      200
    )
  }

  const provider = getTechDetectProvider()

  try {
    const detected = await Promise.race([
      provider.detectTechnologies(domain),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Provider timed out')), PROVIDER_TIMEOUT_MS)
      ),
    ])

    const categories = normalizeCategories(detected.categories)
    const totalTechnologies = categories.reduce(
      (sum, category) => sum + category.technologies.length,
      0
    )

    const entry: CacheEntry = {
      domain,
      categories,
      totalTechnologies,
      analyzedAt: new Date().toISOString(),
      provider: provider.name,
      cachedAtMs: Date.now(),
    }
    cache.set(domain, entry)

    return jsonResponse(
      {
        ok: true,
        data: {
          domain,
          categories,
          totalTechnologies,
          analyzedAt: entry.analyzedAt,
          provider: entry.provider,
          cached: false,
        },
      },
      200
    )
  } catch (error) {
    if (isQuotaError(error)) {
      return jsonResponse(
        { ok: false, message: 'Tech detector quota reached. Please try again a bit later.' },
        429
      )
    }
    return jsonResponse(
      { ok: false, message: 'We could not analyze that domain right now. Please try again.' },
      502
    )
  }
}

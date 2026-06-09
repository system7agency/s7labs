import Anthropic from '@anthropic-ai/sdk'
import { STYLE_SYSTEM_PROMPT } from '@/lib/llm/style'
import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { saveAioScan, type AioScanRecord } from '@/lib/mini-apps/aio-storage'
import type {
  KeywordAIO,
  KeywordStatus,
  ScanApiResponse,
  ScanFree,
  ScanGated,
} from '@/lib/mini-apps/aio-types'
import { isValidDomain, normalizeDomain } from '@/lib/mini-apps/normalize-domain'
import { calculateCost, usageFromAnthropic } from '@/lib/llm/cost'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 55

const TIMEOUT_MS = 55_000
const DATAFORSEO_ENDPOINT = 'https://api.dataforseo.com/v3/serp/google/organic/live/advanced'
const DATAFORSEO_LANGUAGE_CODE = 'en'
const DATAFORSEO_DEFAULT_LOCATION_CODE = 2840 // United States
const DATAFORSEO_DEVICE = 'mobile'
const DATAFORSEO_OS = 'android'
const DATAFORSEO_LOAD_ASYNC_AIO = true
const MAX_KEYWORDS = 5
const MAX_SOURCES_PER_KEYWORD = 10

type ClaudeAssessment = {
  one_liner: string
  verdict_label: string
  citation_leaders: { domain: string; appearances: number }[]
  recommendations: string[]
}

type DataforseoAiRef = { domain?: string; url?: string; title?: string; source?: string }
type DataforseoItem = {
  type?: string
  domain?: string
  url?: string
  title?: string
  items?: DataforseoItem[]
  references?: DataforseoAiRef[]
}

function jsonScan(body: ScanApiResponse, status: number) {
  return NextResponse.json(body, { status })
}

function parseClaudeJson(rawText: string): ClaudeAssessment {
  const stripped = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()
  const jsonMatch = stripped.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON')
  const parsed = JSON.parse(jsonMatch[0]) as ClaudeAssessment
  if (!parsed.one_liner || !parsed.verdict_label) throw new Error('Invalid payload')
  return parsed
}

function sanitizeKeywords(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of raw) {
    if (typeof item !== 'string') continue
    const k = item.trim()
    if (!k) continue
    const key = k.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(k)
    if (out.length >= MAX_KEYWORDS) break
  }
  return out
}

function locationNameToCode(location?: string): { name: string; code: number } {
  const map: Record<string, number> = {
    'United States': 2840,
    'United Kingdom': 2826,
    Canada: 2124,
    Australia: 2036,
    India: 2356,
  }
  if (!location) return { name: 'United States', code: DATAFORSEO_DEFAULT_LOCATION_CODE }
  return { name: location, code: map[location] ?? DATAFORSEO_DEFAULT_LOCATION_CODE }
}

function collectAioSources(
  item: DataforseoItem | undefined
): { domain: string; url: string; title: string }[] {
  if (!item) return []
  const out: { domain: string; url: string; title: string }[] = []
  const pushRef = (ref: DataforseoAiRef) => {
    const domain = (ref.domain ?? '').toLowerCase().replace(/^www\./, '')
    const url = ref.url ?? ''
    const title = ref.title ?? ref.source ?? domain
    if (!domain || !url) return
    if (out.some((s) => s.url === url)) return
    out.push({ domain, url, title })
  }

  for (const ref of item.references ?? []) pushRef(ref)
  for (const child of item.items ?? []) {
    for (const ref of child.references ?? []) pushRef(ref)
    if (child.type === 'ai_overview_reference') {
      pushRef({
        domain: child.domain,
        url: child.url,
        title: child.title,
      })
    }
  }

  return out.slice(0, MAX_SOURCES_PER_KEYWORD)
}

function toStatus(
  aiOver: boolean,
  brandCited: boolean,
  organic: boolean,
  errored: boolean
): KeywordStatus {
  if (errored) return 'error'
  if (!aiOver) return 'no_aio'
  if (brandCited) return 'cited'
  if (organic) return 'ghost'
  return 'blind_spot'
}

const CLAUDE_PROMPT = (domain: string, location: string, keywords: KeywordAIO[]) => `
You are an expert in Google AI Overviews and how brands earn citations inside them. You are given factual per-keyword data: whether each keyword triggers an AI Overview, which domains are cited, and whether the tracked brand is cited or ranks organically. Do not invent or change these facts — interpret them. Write a memorable, slightly pointed one_liner (especially sharp when the brand ranks organically but is not cited). Identify the rival domains cited most often across the keywords. Give 3 specific, actionable recommendations to start earning citations — concrete, not generic. Return ONLY valid JSON.

Tracked domain: ${domain}
Location: ${location}
Facts:
${JSON.stringify(keywords, null, 2)}

Return ONLY JSON:
{
  "one_liner": <string>,
  "verdict_label": <string>,
  "citation_leaders": [{ "domain": <string>, "appearances": <number> }],
  "recommendations": [<exactly 3 strings>]
}
`

async function runKeywordScan(
  login: string,
  password: string,
  keyword: string,
  locationCode: number,
  trackedDomain: string,
  signal: AbortSignal
): Promise<KeywordAIO> {
  const auth = Buffer.from(`${login}:${password}`).toString('base64')
  const res = await fetch(DATAFORSEO_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    cache: 'no-store',
    signal,
    body: JSON.stringify([
      {
        keyword,
        language_code: DATAFORSEO_LANGUAGE_CODE,
        location_code: locationCode,
        device: DATAFORSEO_DEVICE,
        os: DATAFORSEO_OS,
        load_async_ai_overview: DATAFORSEO_LOAD_ASYNC_AIO,
      },
    ]),
  })

  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const payload = (await res.json()) as {
    tasks?: Array<{
      status_code?: number
      result?: Array<{ items?: DataforseoItem[] }>
    }>
  }
  const task = payload.tasks?.[0]
  const items = task?.result?.[0]?.items ?? []
  const aio = items.find((i) => i.type === 'ai_overview')
  const ai_overview_present = Boolean(aio)
  const sources = collectAioSources(aio)
  const brand_cited = sources.some((s) => normalizeDomain(s.domain) === trackedDomain)
  const organic_present = items.some(
    (i) => i.type === 'organic' && normalizeDomain(i.domain ?? '') === trackedDomain
  )
  return {
    keyword,
    ai_overview_present,
    brand_cited,
    organic_present,
    status: toStatus(ai_overview_present, brand_cited, organic_present, false),
    sources,
  }
}

export async function POST(request: Request) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const dataforseoLogin = process.env.DATAFORSEO_LOGIN
  const dataforseoPassword = process.env.DATAFORSEO_PASSWORD

  if (!anthropicKey || !dataforseoLogin || !dataforseoPassword) {
    return jsonScan({ ok: false, message: 'Service not configured. Please try again later.' }, 502)
  }

  let payload: { domain?: unknown; keywords?: unknown; location?: unknown }
  try {
    payload = (await request.json()) as { domain?: unknown; keywords?: unknown; location?: unknown }
  } catch {
    return jsonScan({ ok: false, message: 'Invalid request.' }, 422)
  }

  const domainInput = typeof payload.domain === 'string' ? payload.domain : ''
  const domain = normalizeDomain(domainInput)
  const keywords = sanitizeKeywords(payload.keywords)
  if (!isValidDomain(domain) || keywords.length === 0) {
    return jsonScan({ ok: false, message: 'Enter a domain and at least one keyword.' }, 422)
  }

  const location = locationNameToCode(
    typeof payload.location === 'string' ? payload.location : undefined
  )
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const results = await Promise.allSettled(
      keywords.map((keyword) =>
        runKeywordScan(
          dataforseoLogin,
          dataforseoPassword,
          keyword,
          location.code,
          domain,
          controller.signal
        )
      )
    )

    const keywordRows: KeywordAIO[] = results.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : {
            keyword: keywords[i] ?? '',
            ai_overview_present: false,
            brand_cited: false,
            organic_present: false,
            status: 'error',
            sources: [],
          }
    )

    const okCount = keywordRows.filter((r) => r.status !== 'error').length
    if (okCount === 0) {
      clearTimeout(timer)
      return jsonScan(
        { ok: false, message: "Couldn't pull SERP data right now. Try again in a moment." },
        422
      )
    }

    const aioKeywords = keywordRows.filter((r) => r.ai_overview_present)
    const citedInAio = aioKeywords.filter((r) => r.brand_cited)
    const blindSpots = aioKeywords.filter((r) => !r.brand_cited)
    const ghosts = keywordRows.filter((r) => r.status === 'ghost')

    const sourceCount = new Map<string, number>()
    for (const row of keywordRows) {
      const unique = new Set(
        row.sources.map((s) => normalizeDomain(s.domain)).filter((d) => d && d !== domain)
      )
      for (const rival of unique) sourceCount.set(rival, (sourceCount.get(rival) ?? 0) + 1)
    }
    const leaders = [...sourceCount.entries()]
      .map(([rival, appearances]) => ({ domain: rival, appearances }))
      .sort((a, b) => b.appearances - a.appearances)

    const anthropic = new Anthropic({ apiKey: anthropicKey })
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      system: STYLE_SYSTEM_PROMPT,
      max_tokens: 2000,
      messages: [{ role: 'user', content: CLAUDE_PROMPT(domain, location.name, keywordRows) }],
    })
    clearTimeout(timer)

    const firstBlock = message.content[0]
    const rawText = firstBlock?.type === 'text' ? firstBlock.text : ''
    let assessment: ClaudeAssessment
    try {
      assessment = parseClaudeJson(rawText)
    } catch {
      return jsonScan({ ok: false, message: 'Visibility check failed. Please try again.' }, 500)
    }

    const aio_trigger_rate = Math.round((aioKeywords.length / okCount) * 100)
    const citation_rate =
      aioKeywords.length > 0 ? Math.round((citedInAio.length / aioKeywords.length) * 100) : 0
    const blind_spot_count = blindSpots.length
    const ghost_count = ghosts.length

    const free: ScanFree = {
      domain,
      location: location.name,
      keywords_scored: okCount,
      one_liner: assessment.one_liner,
      verdict_label: assessment.verdict_label,
      aio_trigger_rate,
      citation_rate,
      blind_spot_count,
      ghost_count,
      keyword_statuses: keywordRows.map((k) => ({
        keyword: k.keyword,
        ai_overview_present: k.ai_overview_present,
        brand_cited: k.brand_cited,
        status: k.status,
      })),
      top_cited_competitor: leaders[0] ?? null,
    }

    const gated: ScanGated = {
      keywords: keywordRows,
      citation_leaders: assessment.citation_leaders?.length ? assessment.citation_leaders : leaders,
      recommendations: (assessment.recommendations ?? []).slice(0, 3),
      tokens_in: message.usage.input_tokens,
      tokens_out: message.usage.output_tokens,
    }

    const scanId = randomUUID()
    const record: AioScanRecord = {
      domain,
      gated,
      lead_context: {
        domain,
        aio_trigger_rate: free.aio_trigger_rate,
        citation_rate: free.citation_rate,
        blind_spot_count: free.blind_spot_count,
      },
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }
    await saveAioScan(scanId, record)

    const cost = calculateCost(usageFromAnthropic(message))
    return jsonScan({ ok: true, scanId, free, cost }, 200)
  } catch {
    clearTimeout(timer)
    return jsonScan({ ok: false, message: 'Scan timed out. Please try again.' }, 504)
  }
}

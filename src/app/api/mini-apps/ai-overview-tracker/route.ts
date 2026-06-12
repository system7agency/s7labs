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
import { askPerplexityWithCitations } from '@/lib/mini-apps/avs-perplexity'
import { calculateCost, usageFromAnthropic } from '@/lib/llm/cost'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 55

const MAX_KEYWORDS = 5
const MAX_SOURCES_PER_KEYWORD = 10

type ClaudeAssessment = {
  one_liner: string
  verdict_label: string
  citation_leaders: { domain: string; appearances: number }[]
  recommendations: string[]
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

function resolveLocationName(location?: string): string {
  const trimmed = typeof location === 'string' ? location.trim() : ''
  return trimmed || 'United States'
}

function toStatus(
  aiAnswer: boolean,
  brandCited: boolean,
  organic: boolean,
  errored: boolean
): KeywordStatus {
  if (errored) return 'error'
  if (!aiAnswer) return 'no_aio'
  if (brandCited) return 'cited'
  if (organic) return 'ghost'
  return 'blind_spot'
}

const CLAUDE_PROMPT = (domain: string, location: string, keywords: KeywordAIO[]) => `
You are an expert in how AI answer engines (like Perplexity) decide which brands to cite as sources. You are given factual per-keyword data: for each buyer-intent keyword, the domains the AI answer cited and whether the tracked brand was among them. Do not invent or change these facts — interpret them. Write a memorable, slightly pointed one_liner (especially sharp when rival domains are cited but the tracked brand is not). Identify the rival domains cited most often across the keywords. Give 3 specific, actionable recommendations to start earning citations in AI answers — concrete, not generic. Return ONLY valid JSON.

Tracked domain: ${domain}
Market: ${location}
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

// One keyword → ask Perplexity (an AI answer engine with citations) and record
// which domains it cited and whether the tracked brand was among them.
async function runKeywordScan(keyword: string, trackedDomain: string): Promise<KeywordAIO> {
  const r = await askPerplexityWithCitations(keyword, trackedDomain)
  if (!r.ok) {
    return {
      keyword,
      ai_overview_present: false,
      brand_cited: false,
      organic_present: false,
      status: 'error',
      sources: [],
    }
  }
  const sources = r.cited_domains.slice(0, MAX_SOURCES_PER_KEYWORD).map((d) => {
    const dom = normalizeDomain(d)
    return { domain: dom, url: `https://${dom}`, title: dom }
  })
  return {
    keyword,
    // Perplexity returned a real AI answer for this keyword.
    ai_overview_present: true,
    brand_cited: r.brand_cited,
    organic_present: false,
    status: toStatus(true, r.brand_cited, false, false),
    sources,
  }
}

export async function POST(request: Request) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const perplexityKey = process.env.PERPLEXITY_API_KEY

  if (!anthropicKey || !perplexityKey) {
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

  const locationName = resolveLocationName(
    typeof payload.location === 'string' ? payload.location : undefined
  )

  try {
    const results = await Promise.allSettled(
      keywords.map((keyword) => runKeywordScan(keyword, domain))
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
      return jsonScan(
        {
          ok: false,
          message: "Couldn't reach the AI answer engine right now. Try again in a moment.",
        },
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
      messages: [{ role: 'user', content: CLAUDE_PROMPT(domain, locationName, keywordRows) }],
    })

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
      location: locationName,
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
    return jsonScan({ ok: false, message: "Couldn't complete the scan. Please try again." }, 500)
  }
}

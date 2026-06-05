import Anthropic from '@anthropic-ai/sdk'
import { STYLE_SYSTEM_PROMPT } from '@/lib/llm/style'
import { FirecrawlAppV1 as FirecrawlApp } from '@mendable/firecrawl-js'
import { NextResponse } from 'next/server'

import { calculateCost, type CostBreakdown, usageFromAnthropic } from '@/lib/llm/cost'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const TIMEOUT_MS = 55_000

export type RoastCategory = {
  name: string
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  roast: string
  quick_fix: string
}

export type RoastResult = {
  url: string
  site_name: string
  overall_score: number
  overall_grade: 'A' | 'B' | 'C' | 'D' | 'F'
  one_liner: string
  categories: RoastCategory[]
  top_3_fixes: string[]
  lighthouse: {
    performance: number | null
    seo: number | null
    accessibility: number | null
    best_practices: number | null
  }
  tokens_in: number
  tokens_out: number
}

type SuccessResponse = { ok: true; data: RoastResult; cost?: CostBreakdown }
type ErrorResponse = { ok: false; message: string }
export type ApiResponse = SuccessResponse | ErrorResponse

type LighthouseScores = RoastResult['lighthouse']

const CLAUDE_PROMPT = (url: string, scrapedContent: string, lighthouse: LighthouseScores) => `
You are a brutally honest but constructive website reviewer. Be specific and direct — no corporate fluff. The one_liner should be memorable and slightly savage but fair. Every quick_fix must be a specific action, not a generic suggestion.

WEBSITE URL: ${url}

SCRAPED PAGE CONTENT (markdown):
${scrapedContent.slice(0, 12000)}

GOOGLE LIGHTHOUSE SCORES (mobile, 0–100, null if unavailable):
- Performance: ${lighthouse.performance ?? 'unavailable'}
- SEO: ${lighthouse.seo ?? 'unavailable'}
- Accessibility: ${lighthouse.accessibility ?? 'unavailable'}
- Best Practices: ${lighthouse.best_practices ?? 'unavailable'}

Return ONLY valid JSON in this exact shape — no markdown, no explanation:
{
  "url": "${url}",
  "site_name": <site or company name inferred from content>,
  "overall_score": <integer 0-100>,
  "overall_grade": <"A" | "B" | "C" | "D" | "F">,
  "one_liner": <savage 1-sentence summary, e.g. "A 2019 SaaS site that forgot it's 2025">,
  "categories": [
    {
      "name": <one of: "Copy Quality", "CTA Clarity", "SEO Basics", "Mobile UX", "Performance", "Trust Signals">,
      "score": <integer 0-10>,
      "grade": <"A" | "B" | "C" | "D" | "F">,
      "roast": <2-3 sentence brutal honest take>,
      "quick_fix": <one specific actionable improvement>
    }
  ],
  "top_3_fixes": [<3 highest-impact fixes, specific not generic>],
  "lighthouse": {
    "performance": ${lighthouse.performance ?? 'null'},
    "seo": ${lighthouse.seo ?? 'null'},
    "accessibility": ${lighthouse.accessibility ?? 'null'},
    "best_practices": ${lighthouse.best_practices ?? 'null'}
  }
}

Rules:
- categories must contain exactly 6 items, one for each category listed above, in that order.
- Use Lighthouse performance score to inform the Performance category when available.
- Grade mapping: A = 9-10 or 90-100, B = 7-8 or 80-89, C = 5-6 or 60-79, D = 3-4 or 40-59, F = 0-2 or below 40.
- top_3_fixes must be distinct from quick_fix text but can reference the same issues.
`

function jsonResponse(body: ApiResponse, status: number) {
  return NextResponse.json(body, { status })
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fallbackFetchContent(url: string, signal: AbortSignal): Promise<string> {
  try {
    const res = await fetch(url, {
      signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; S7LabsWebsiteRoast/1.0; +https://s7labs.ai)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    })
    if (!res.ok) return ''
    const html = await res.text()
    const text = htmlToText(html)
    return text.length >= 200 ? text.slice(0, 10000) : ''
  } catch {
    return ''
  }
}

function scrapeFailureMessage(scrapeResult: PromiseSettledResult<unknown>): string {
  if (scrapeResult.status === 'rejected') {
    const reason = scrapeResult.reason as { statusCode?: number; message?: string } | undefined
    if (reason?.statusCode === 401 || reason?.statusCode === 403) {
      return 'Scrape service authentication failed. Check FIRECRAWL_API_KEY in environment variables.'
    }
    return "Couldn't fetch that URL. Check it's public and try again."
  }
  const value = scrapeResult.value as { success?: boolean; error?: string } | undefined
  if (value?.error) return `Couldn't fetch that URL: ${value.error}`
  return "Couldn't fetch that URL. Check it's public and try again."
}

function extractLighthouseScore(data: unknown, category: string): number | null {
  if (!data || typeof data !== 'object') return null
  const root = data as Record<string, unknown>
  const lhr = root.lighthouseResult
  if (!lhr || typeof lhr !== 'object') return null
  const categories = (lhr as Record<string, unknown>).categories
  if (!categories || typeof categories !== 'object') return null
  const cat = (categories as Record<string, unknown>)[category]
  if (!cat || typeof cat !== 'object') return null
  const score = (cat as Record<string, unknown>).score
  if (typeof score !== 'number') return null
  return Math.round(score * 100)
}

async function fetchPageSpeed(
  url: string,
  signal: AbortSignal,
  apiKey?: string
): Promise<LighthouseScores> {
  const nullScores: LighthouseScores = {
    performance: null,
    seo: null,
    accessibility: null,
    best_practices: null,
  }

  try {
    const params = new URLSearchParams({
      url,
      strategy: 'mobile',
    })
    if (apiKey) params.set('key', apiKey)
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`
    const res = await fetch(apiUrl, { signal })
    if (!res.ok) return nullScores
    const data = (await res.json()) as unknown
    return {
      performance: extractLighthouseScore(data, 'performance'),
      seo: extractLighthouseScore(data, 'seo'),
      accessibility: extractLighthouseScore(data, 'accessibility'),
      best_practices: extractLighthouseScore(data, 'best-practices'),
    }
  } catch {
    return nullScores
  }
}

export async function POST(request: Request) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const firecrawlKey = process.env.FIRECRAWL_API_KEY
  const pagespeedKey = process.env.PAGESPEED_API_KEY

  if (!anthropicKey || !firecrawlKey) {
    return jsonResponse(
      { ok: false, message: 'Service not configured. Please try again later.' },
      502
    )
  }

  let payload: { url?: unknown }
  try {
    payload = (await request.json()) as { url?: unknown }
  } catch {
    return jsonResponse({ ok: false, message: 'Invalid request.' }, 422)
  }

  const url = typeof payload.url === 'string' ? payload.url.trim() : ''

  if (!url || !/^https:\/\/.+/i.test(url)) {
    return jsonResponse({ ok: false, message: 'Enter a valid URL starting with https://' }, 422)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const firecrawl = new FirecrawlApp({ apiKey: firecrawlKey })

    const [scrapeResult, lighthouseResult] = await Promise.allSettled([
      firecrawl.scrapeUrl(url, { formats: ['markdown'] }),
      fetchPageSpeed(url, controller.signal, pagespeedKey),
    ])

    let scrapedContent = ''
    if (scrapeResult.status === 'fulfilled') {
      const scrape = scrapeResult.value
      if (scrape.success && scrape.markdown) {
        scrapedContent = scrape.markdown.slice(0, 10000)
      }
    }

    if (!scrapedContent) {
      scrapedContent = await fallbackFetchContent(url, controller.signal)
    }

    if (!scrapedContent) {
      clearTimeout(timer)
      return jsonResponse({ ok: false, message: scrapeFailureMessage(scrapeResult) }, 422)
    }

    const lighthouse: LighthouseScores =
      lighthouseResult.status === 'fulfilled'
        ? lighthouseResult.value
        : {
            performance: null,
            seo: null,
            accessibility: null,
            best_practices: null,
          }

    const anthropic = new Anthropic({ apiKey: anthropicKey })
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      system: STYLE_SYSTEM_PROMPT,
      max_tokens: 2000,
      messages: [{ role: 'user', content: CLAUDE_PROMPT(url, scrapedContent, lighthouse) }],
    })

    clearTimeout(timer)

    const firstBlock = message.content[0]
    const rawText = firstBlock?.type === 'text' ? firstBlock.text : ''

    let parsed: RoastResult
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found')
      parsed = JSON.parse(jsonMatch[0]) as RoastResult
      parsed.url = url
      parsed.lighthouse = lighthouse
      parsed.tokens_in = message.usage.input_tokens
      parsed.tokens_out = message.usage.output_tokens
    } catch {
      return jsonResponse({ ok: false, message: 'Roast failed. Please try again.' }, 502)
    }

    const cost = calculateCost(usageFromAnthropic(message))
    return jsonResponse({ ok: true, data: parsed, cost }, 200)
  } catch (err) {
    clearTimeout(timer)
    const isAbort = err instanceof Error && err.name === 'AbortError'
    return jsonResponse(
      {
        ok: false,
        message: isAbort
          ? 'Analysis timed out. Try again with a simpler page.'
          : 'Something went wrong. Please try again.',
      },
      502
    )
  }
}

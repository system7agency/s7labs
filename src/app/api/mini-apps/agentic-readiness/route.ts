import Anthropic from '@anthropic-ai/sdk'
import { FirecrawlAppV1 as FirecrawlApp } from '@mendable/firecrawl-js'
import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { buildAgenticSignals, type AgenticSignals } from '@/lib/mini-apps/agentic-signals'
import { saveAgenticScan, type AgenticScanRecord } from '@/lib/mini-apps/agentic-storage'
import {
  CHECK_NAMES,
  type CheckStatus,
  type Grade,
  type ReadinessCheck,
  type ScanApiResponse,
  type ScanFree,
  type ScanGated,
} from '@/lib/mini-apps/agentic-types'
import { normalizeSiteUrl } from '@/lib/mini-apps/normalize-url'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 55

export type {
  ReadinessCheck,
  ScanApiResponse,
  ScanFree,
  ScanGated,
  UnlockApiResponse,
} from '@/lib/mini-apps/agentic-types'

const TIMEOUT_MS = 55_000

type ClaudeAssessment = {
  site_name: string
  overall_score: number
  overall_grade: Grade
  one_liner: string
  readiness_label: string
  free_blockers: { name: string; finding: string }[]
  checks: ReadinessCheck[]
  prioritised_plan: ScanGated['prioritised_plan']
  quick_wins: string[]
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
  if (!Array.isArray(parsed.checks) || parsed.checks.length !== CHECK_NAMES.length) {
    throw new Error('Invalid checks')
  }
  for (let i = 0; i < CHECK_NAMES.length; i++) {
    if (parsed.checks[i]?.name !== CHECK_NAMES[i]) {
      throw new Error('Check order mismatch')
    }
  }
  return parsed
}

const CLAUDE_PROMPT = (url: string, markdown: string, signals: AgenticSignals) => `
You are an expert in how AI agents and LLM crawlers read websites — structured data, server rendering, robots directives, and machine-readable actions. Assess how ready this site is for an AI agent to read it and act on it. Be specific to what was actually found in the provided signals and content — no generic advice. Pick the 1-2 most damaging blockers as the free teaser (free_blockers). For the full list, every fix must be a concrete action and every item must be ranked by impact. The one_liner should be memorable and a little pointed but fair. Return ONLY valid JSON.

URL: ${url}

DETERMINISTIC SIGNALS (trust these as ground truth):
${JSON.stringify(signals, null, 2)}

PAGE CONTENT (markdown excerpt):
${markdown.slice(0, 10000)}

Return ONLY valid JSON:
{
  "site_name": <site or brand name>,
  "overall_score": <integer 0-100>,
  "overall_grade": <"A"|"B"|"C"|"D"|"F">,
  "one_liner": <memorable pointed summary>,
  "readiness_label": <short verdict e.g. "Not agent-ready">,
  "free_blockers": [
    { "name": <check name>, "finding": <1-2 sentences specific to this site> }
  ],
  "checks": [
    {
      "name": <exactly one of: "Structured Data", "Content Clarity", "Crawl & Access", "Render Dependency", "Action Readiness", "Identity & Trust" — all 6 in this order>,
      "score": <0-10>,
      "grade": <"A"|"B"|"C"|"D"|"F">,
      "status": <"pass"|"warn"|"fail">,
      "finding": <specific finding>,
      "fix": <specific fix>,
      "priority": <"high"|"medium"|"low">
    }
  ],
  "prioritised_plan": [
    { "rank": <1-based>, "action": <string>, "impact": <string>, "effort": <"low"|"medium"|"high"> }
  ],
  "quick_wins": [<2-3 strings fixable today>]
}

Rules:
- free_blockers must contain 1-2 items from the highest-impact warn/fail checks.
- Grade mapping: A = 9-10, B = 7-8, C = 5-6, D = 3-4, F = 0-2 for per-check scores; overall_grade should align with overall_score.
`

function scrapeFailureMessage(scrapeResult: PromiseSettledResult<unknown>): string {
  if (scrapeResult.status === 'rejected') {
    const reason = scrapeResult.reason as { statusCode?: number } | undefined
    if (reason?.statusCode === 401 || reason?.statusCode === 403) {
      return 'Scrape service authentication failed. Check FIRECRAWL_API_KEY in environment variables.'
    }
    return "Couldn't fetch that URL. Check it's public and try again."
  }
  const value = scrapeResult.value as { success?: boolean; error?: string } | undefined
  if (value?.error) return `Couldn't fetch that URL: ${value.error}`
  return "Couldn't fetch that URL. Check it's public and try again."
}

function toScanFree(url: string, assessment: ClaudeAssessment): ScanFree {
  const checks_summary = assessment.checks.map((c) => ({
    name: c.name,
    status: c.status as CheckStatus,
  }))
  const total_issues = checks_summary.filter((c) => c.status !== 'pass').length

  return {
    url,
    site_name: assessment.site_name,
    overall_score: Math.min(100, Math.max(0, Math.round(assessment.overall_score))),
    overall_grade: assessment.overall_grade,
    one_liner: assessment.one_liner,
    readiness_label: assessment.readiness_label,
    free_blockers: assessment.free_blockers.slice(0, 2),
    checks_summary,
    total_issues,
  }
}

export async function POST(request: Request) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const firecrawlKey = process.env.FIRECRAWL_API_KEY

  if (!anthropicKey || !firecrawlKey) {
    return jsonScan({ ok: false, message: 'Service not configured. Please try again later.' }, 502)
  }

  let payload: { url?: unknown }
  try {
    payload = (await request.json()) as { url?: unknown }
  } catch {
    return jsonScan({ ok: false, message: 'Invalid request.' }, 422)
  }

  const rawUrl = typeof payload.url === 'string' ? payload.url : ''
  const url = normalizeSiteUrl(rawUrl)

  if (!url) {
    return jsonScan({ ok: false, message: 'Enter a valid URL.' }, 422)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const origin = new URL(url).origin

  try {
    const firecrawl = new FirecrawlApp({ apiKey: firecrawlKey })

    const [scrapeResult, robotsResult] = await Promise.allSettled([
      firecrawl.scrapeUrl(url, { formats: ['markdown', 'html'] }),
      fetch(`${origin}/robots.txt`, { signal: controller.signal, cache: 'no-store' }),
    ])

    let markdown = ''
    let html = ''
    if (scrapeResult.status === 'fulfilled') {
      const scrape = scrapeResult.value as {
        success?: boolean
        markdown?: string
        html?: string
      }
      if (scrape.success) {
        markdown = scrape.markdown?.slice(0, 12000) ?? ''
        html = scrape.html?.slice(0, 200000) ?? ''
      }
    }

    if (!markdown && !html) {
      clearTimeout(timer)
      return jsonScan({ ok: false, message: scrapeFailureMessage(scrapeResult) }, 422)
    }

    if (!html && markdown) {
      html = `<body>${markdown}</body>`
    }

    let robotsText: string | null = null
    if (robotsResult.status === 'fulfilled' && robotsResult.value.ok) {
      robotsText = await robotsResult.value.text()
    }

    const signals = buildAgenticSignals(html, markdown, robotsText)

    const anthropic = new Anthropic({ apiKey: anthropicKey })
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2500,
      messages: [{ role: 'user', content: CLAUDE_PROMPT(url, markdown, signals) }],
    })

    clearTimeout(timer)

    const firstBlock = message.content[0]
    const rawText = firstBlock?.type === 'text' ? firstBlock.text : ''

    let assessment: ClaudeAssessment
    try {
      assessment = parseClaudeJson(rawText)
    } catch {
      return jsonScan({ ok: false, message: 'Readiness check failed. Please try again.' }, 500)
    }

    const free = toScanFree(url, assessment)
    const gated: ScanGated = {
      checks: assessment.checks,
      prioritised_plan: assessment.prioritised_plan ?? [],
      quick_wins: assessment.quick_wins?.slice(0, 3) ?? [],
      tokens_in: message.usage.input_tokens,
      tokens_out: message.usage.output_tokens,
    }

    const scanId = randomUUID()
    const record: AgenticScanRecord = {
      gated,
      lead_context: {
        url,
        site_name: free.site_name,
        overall_score: free.overall_score,
        overall_grade: free.overall_grade,
      },
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }

    await saveAgenticScan(scanId, record)

    return jsonScan({ ok: true, scanId, free }, 200)
  } catch (err) {
    clearTimeout(timer)
    const isAbort = err instanceof Error && err.name === 'AbortError'
    return jsonScan(
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

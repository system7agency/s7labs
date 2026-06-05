import Anthropic from '@anthropic-ai/sdk'
import { STYLE_SYSTEM_PROMPT } from '@/lib/llm/style'
import { FirecrawlAppV1 as FirecrawlApp } from '@mendable/firecrawl-js'
import { NextResponse } from 'next/server'

import { calculateCost, type CostBreakdown, usageFromAnthropic } from '@/lib/llm/cost'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const TIMEOUT_MS = 55_000

const DOMAIN_RE = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}/i

export type Signal = {
  type: 'hiring' | 'funding' | 'expansion' | 'tech' | 'news' | 'leadership'
  label: string
  detail: string
  strength: 'strong' | 'moderate' | 'weak'
}

export type RadarResult = {
  company: string
  domain: string
  intent_score: number
  urgency: 'high' | 'medium' | 'low'
  summary: string
  signals: Signal[]
  outreach_angle: string
  best_persona: string
  tokens_in: number
  tokens_out: number
}

type SuccessResponse = { ok: true; data: RadarResult; cost?: CostBreakdown }
type ErrorResponse = { ok: false; message: string }
export type ApiResponse = SuccessResponse | ErrorResponse

function normaliseDomain(input: string): string {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
  return s
}

const CLAUDE_PROMPT = (scrapedContent: string, company: string, domain: string) => `
You are a senior B2B sales intelligence analyst. Analyse the following content scraped from "${domain}" and return a structured buying-signal radar for "${company}".

SCRAPED CONTENT:
${scrapedContent.slice(0, 14000)}

Return ONLY valid JSON in this exact shape — no markdown, no explanation:
{
  "company": "${company}",
  "domain": "${domain}",
  "intent_score": <integer 1-10, where 10 = extremely high purchase intent right now>,
  "urgency": <"high" | "medium" | "low">,
  "summary": <2-3 sentence executive summary of why this account is (or isn't) worth reaching out to right now>,
  "signals": [
    {
      "type": <"hiring" | "funding" | "expansion" | "tech" | "news" | "leadership">,
      "label": <short signal label, e.g. "Hiring 3 RevOps roles">,
      "detail": <1 sentence explaining the signal and why it matters>,
      "strength": <"strong" | "moderate" | "weak">
    }
  ],
  "outreach_angle": <1-2 sentence concrete suggested opening for an outbound message — what specific pain or opportunity to lead with>,
  "best_persona": <job title of the ideal first contact at this company based on the signals>
}

Rules:
- Include 3-6 signals. Only include signals that are clearly supported by the content.
- If you can't find enough signal data, return fewer signals and lower the intent_score accordingly.
- The outreach_angle must be specific to this company — no generic templates.
`

function jsonResponse(body: ApiResponse, status: number) {
  return NextResponse.json(body, { status })
}

export async function POST(request: Request) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const firecrawlKey = process.env.FIRECRAWL_API_KEY

  if (!anthropicKey || !firecrawlKey) {
    return jsonResponse(
      { ok: false, message: 'Service not configured. Please try again later.' },
      502
    )
  }

  let payload: { company?: unknown; domain?: unknown }
  try {
    payload = (await request.json()) as { company?: unknown; domain?: unknown }
  } catch {
    return jsonResponse({ ok: false, message: 'Invalid request.' }, 422)
  }

  const company = typeof payload.company === 'string' ? payload.company.trim() : ''
  const rawDomain = typeof payload.domain === 'string' ? payload.domain.trim() : ''

  if (!company) {
    return jsonResponse({ ok: false, message: 'Company name is required.' }, 422)
  }
  if (!rawDomain || !DOMAIN_RE.test(rawDomain)) {
    return jsonResponse({ ok: false, message: 'Please enter a valid domain (e.g. acme.com).' }, 422)
  }

  const domain = normaliseDomain(rawDomain)
  const siteUrl = `https://${domain}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const firecrawl = new FirecrawlApp({ apiKey: firecrawlKey })

    // Scrape homepage + /about + /careers in parallel
    const [homeResult, aboutResult, careersResult] = await Promise.allSettled([
      firecrawl.scrapeUrl(siteUrl, { formats: ['markdown'] }),
      firecrawl.scrapeUrl(`${siteUrl}/about`, { formats: ['markdown'] }),
      firecrawl.scrapeUrl(`${siteUrl}/careers`, { formats: ['markdown'] }),
    ])

    const sections: string[] = []

    if (
      homeResult.status === 'fulfilled' &&
      homeResult.value.success &&
      homeResult.value.markdown
    ) {
      sections.push(`## Homepage\n${homeResult.value.markdown.slice(0, 5000)}`)
    }
    if (
      aboutResult.status === 'fulfilled' &&
      aboutResult.value.success &&
      aboutResult.value.markdown
    ) {
      sections.push(`## About\n${aboutResult.value.markdown.slice(0, 4000)}`)
    }
    if (
      careersResult.status === 'fulfilled' &&
      careersResult.value.success &&
      careersResult.value.markdown
    ) {
      sections.push(`## Careers / Hiring\n${careersResult.value.markdown.slice(0, 4000)}`)
    }

    if (sections.length === 0) {
      clearTimeout(timer)
      return jsonResponse(
        { ok: false, message: "Couldn't fetch that domain. Check the URL and try again." },
        422
      )
    }

    const combinedContent = sections.join('\n\n---\n\n')

    const anthropic = new Anthropic({ apiKey: anthropicKey })

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      system: STYLE_SYSTEM_PROMPT,
      max_tokens: 1500,
      messages: [{ role: 'user', content: CLAUDE_PROMPT(combinedContent, company, domain) }],
    })

    clearTimeout(timer)

    const firstBlock = message.content[0]
    const rawText = firstBlock?.type === 'text' ? firstBlock.text : ''

    let parsed: RadarResult
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found')
      parsed = JSON.parse(jsonMatch[0]) as RadarResult
      parsed.tokens_in = message.usage.input_tokens
      parsed.tokens_out = message.usage.output_tokens
    } catch {
      return jsonResponse({ ok: false, message: 'Analysis failed. Please try again.' }, 502)
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
          ? 'Analysis timed out. Try again or use a simpler domain.'
          : 'Something went wrong. Please try again.',
      },
      502
    )
  }
}

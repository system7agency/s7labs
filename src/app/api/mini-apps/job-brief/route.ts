import Anthropic from '@anthropic-ai/sdk'
import { FirecrawlAppV1 as FirecrawlApp } from '@mendable/firecrawl-js'
import { NextResponse } from 'next/server'

import { calculateCost, type CostBreakdown, usageFromAnthropic } from '@/lib/llm/cost'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const TIMEOUT_MS = 55_000

export type Signal = {
  label: string
  detail: string
  category: 'priority' | 'pain' | 'tech' | 'budget' | 'team' | 'timing'
}

export type BriefResult = {
  company: string
  role: string
  department: string
  seniority: 'ic' | 'lead' | 'manager' | 'director' | 'vp' | 'c-suite'
  summary: string
  signals: Signal[]
  tech_stack: string[]
  pain_points: string[]
  budget_indicators: string[]
  best_angle: string
  ideal_contact: string
  urgency: 'high' | 'medium' | 'low'
  tokens_in: number
  tokens_out: number
}

type SuccessResponse = { ok: true; data: BriefResult; cost?: CostBreakdown }
type ErrorResponse = { ok: false; message: string }
export type ApiResponse = SuccessResponse | ErrorResponse

const CLAUDE_PROMPT = (content: string) => `
You are a senior B2B sales strategist. Analyse the following job posting content and generate a structured sales brief that helps a rep understand how to sell into this company right now.

JOB POSTING CONTENT:
${content.slice(0, 10000)}

Return ONLY valid JSON in this exact shape — no markdown, no explanation:
{
  "company": <company name>,
  "role": <job title being hired for>,
  "department": <department, e.g. "Engineering", "Revenue Operations", "Marketing">,
  "seniority": <"ic" | "lead" | "manager" | "director" | "vp" | "c-suite">,
  "summary": <2-3 sentence executive summary — what this hire tells you about where the company is headed and why now is a good time to reach out>,
  "signals": [
    {
      "label": <short signal label>,
      "detail": <1 sentence explaining the signal and its sales relevance>,
      "category": <"priority" | "pain" | "tech" | "budget" | "team" | "timing">
    }
  ],
  "tech_stack": <array of specific tools, platforms, or technologies mentioned>,
  "pain_points": <array of 2-4 implied or explicit pain points this hire suggests>,
  "budget_indicators": <array of 1-3 signals that suggest budget availability or constraints>,
  "best_angle": <1-2 sentence concrete sales angle — what specific problem or opportunity to lead with when reaching out>,
  "ideal_contact": <job title of the best person to reach out to based on this posting — not necessarily the hiring manager>,
  "urgency": <"high" | "medium" | "low">
}

Rules:
- Extract 3-6 signals. Only include what is clearly supported by the posting.
- tech_stack must list specific named tools (e.g. "Salesforce", "dbt", "React") — not generic terms.
- pain_points should be inferred from the responsibilities and requirements, not copied verbatim.
- best_angle must be specific to this company and role — no generic templates.
- If the company name is not in the posting, infer it from context or use "Unknown".
`

function jsonResponse(body: ApiResponse, status: number) {
  return NextResponse.json(body, { status })
}

export async function POST(request: Request) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const firecrawlKey = process.env.FIRECRAWL_API_KEY

  if (!anthropicKey) {
    return jsonResponse(
      { ok: false, message: 'Service not configured. Please try again later.' },
      502
    )
  }

  let payload: { url?: unknown; text?: unknown }
  try {
    payload = (await request.json()) as { url?: unknown; text?: unknown }
  } catch {
    return jsonResponse({ ok: false, message: 'Invalid request.' }, 422)
  }

  const url = typeof payload.url === 'string' ? payload.url.trim() : ''
  const text = typeof payload.text === 'string' ? payload.text.trim() : ''

  if (!url && !text) {
    return jsonResponse({ ok: false, message: 'Provide a job posting URL or paste the text.' }, 422)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    let content = text

    if (url && firecrawlKey) {
      const firecrawl = new FirecrawlApp({ apiKey: firecrawlKey })
      const scraped = await firecrawl.scrapeUrl(url, { formats: ['markdown'] })
      if (scraped.success && scraped.markdown) {
        content = scraped.markdown
      } else if (!text) {
        clearTimeout(timer)
        return jsonResponse(
          {
            ok: false,
            message: "Couldn't fetch that URL. Try pasting the job description instead.",
          },
          422
        )
      }
    } else if (url && !firecrawlKey) {
      if (!text) {
        clearTimeout(timer)
        return jsonResponse(
          { ok: false, message: 'Service not configured. Please try again later.' },
          502
        )
      }
    }

    if (!content || content.length < 50) {
      clearTimeout(timer)
      return jsonResponse(
        { ok: false, message: 'Not enough content to analyse. Paste the full job description.' },
        422
      )
    }

    const anthropic = new Anthropic({ apiKey: anthropicKey })
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1800,
      messages: [{ role: 'user', content: CLAUDE_PROMPT(content) }],
    })

    clearTimeout(timer)

    const firstBlock = message.content[0]
    const rawText = firstBlock?.type === 'text' ? firstBlock.text : ''

    let parsed: BriefResult
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found')
      parsed = JSON.parse(jsonMatch[0]) as BriefResult
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
          ? 'Analysis timed out. Try pasting the job description directly.'
          : 'Something went wrong. Please try again.',
      },
      502
    )
  }
}

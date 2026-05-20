import Anthropic from '@anthropic-ai/sdk'
import { FirecrawlAppV1 as FirecrawlApp } from '@mendable/firecrawl-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const TIMEOUT_MS = 45_000

const URL_RE = /^https?:\/\/.+\..+/

export type Improvement = {
  rank: number
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
}

export type DiagnosticResult = {
  url: string
  friction_score: number
  clarity_grade: string
  plan_legibility: string
  buyer_inference: string
  flags: string[]
  improvements: Improvement[]
  tokens_in: number
  tokens_out: number
}

type SuccessResponse = { ok: true; data: DiagnosticResult }
type ErrorResponse = { ok: false; message: string }
export type ApiResponse = SuccessResponse | ErrorResponse

const CLAUDE_PROMPT = (content: string, url: string) => `
You are a senior SaaS pricing strategist. Analyse the following pricing page content and return a structured JSON diagnostic.

URL: ${url}

PAGE CONTENT:
${content.slice(0, 12000)}

Return ONLY valid JSON in this exact shape — no markdown, no explanation:
{
  "friction_score": <integer 1-10, where 10 = maximum friction/confusion>,
  "clarity_grade": <letter grade: A, A-, B+, B, B-, C+, C, C-, D, F>,
  "plan_legibility": <one of: "Excellent", "Good", "Fair", "Poor">,
  "buyer_inference": <1-2 sentence read of who this page is actually targeting based on copy, pricing levels, and plan names>,
  "flags": [<array of 2-5 short problem strings, e.g. "No visible CTA above fold", "Hidden enterprise pricing", "Unclear billing cycle">],
  "improvements": [
    {
      "rank": 1,
      "title": <concise improvement title>,
      "description": <1-2 sentence concrete recommendation>,
      "impact": <"high" | "medium" | "low">
    },
    {
      "rank": 2,
      "title": <concise improvement title>,
      "description": <1-2 sentence concrete recommendation>,
      "impact": <"high" | "medium" | "low">
    },
    {
      "rank": 3,
      "title": <concise improvement title>,
      "description": <1-2 sentence concrete recommendation>,
      "impact": <"high" | "medium" | "low">
    }
  ]
}
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

  let payload: { url?: unknown }
  try {
    payload = (await request.json()) as { url?: unknown }
  } catch {
    return jsonResponse({ ok: false, message: 'Invalid request.' }, 422)
  }

  const rawUrl = typeof payload.url === 'string' ? payload.url.trim() : ''
  if (!rawUrl || !URL_RE.test(rawUrl)) {
    return jsonResponse(
      { ok: false, message: 'Please enter a valid URL starting with http:// or https://' },
      422
    )
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const firecrawl = new FirecrawlApp({ apiKey: firecrawlKey })

    const scrapeResult = await firecrawl.scrapeUrl(rawUrl, {
      formats: ['markdown'],
    })

    if (!scrapeResult.success || !scrapeResult.markdown) {
      clearTimeout(timer)
      return jsonResponse(
        { ok: false, message: "Couldn't fetch that page. Check the URL and try again." },
        422
      )
    }

    const anthropic = new Anthropic({ apiKey: anthropicKey })

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: CLAUDE_PROMPT(scrapeResult.markdown, rawUrl),
        },
      ],
    })

    clearTimeout(timer)

    const firstBlock = message.content[0]
    const rawText = firstBlock?.type === 'text' ? firstBlock.text : ''

    let parsed: DiagnosticResult
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found')
      parsed = JSON.parse(jsonMatch[0]) as DiagnosticResult
      parsed.url = rawUrl
      parsed.tokens_in = message.usage.input_tokens
      parsed.tokens_out = message.usage.output_tokens
    } catch {
      return jsonResponse({ ok: false, message: 'Analysis failed. Please try again.' }, 502)
    }

    return jsonResponse({ ok: true, data: parsed }, 200)
  } catch (err) {
    clearTimeout(timer)
    const isAbort = err instanceof Error && err.name === 'AbortError'
    return jsonResponse(
      {
        ok: false,
        message: isAbort
          ? 'Analysis timed out. Try a simpler page or try again.'
          : 'Something went wrong. Please try again.',
      },
      502
    )
  }
}

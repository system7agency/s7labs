import Anthropic from '@anthropic-ai/sdk'
import { FirecrawlAppV1 as FirecrawlApp } from '@mendable/firecrawl-js'
import { NextResponse } from 'next/server'

import { calculateCost, type CostBreakdown, usageFromAnthropic } from '@/lib/llm/cost'
import { STYLE_SYSTEM_PROMPT } from '@/lib/llm/style'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 55

const LINKEDIN_HOSTS = new Set(['linkedin.com', 'www.linkedin.com'])
const SECTION_NAMES = [
  'Headline',
  'About',
  'Experience',
  'Skills',
  'Recommendations',
  'Photo & Banner',
] as const
const SCRAPE_MIN_CHARS = 400

type InputMode = 'url' | 'paste'
type SectionName = (typeof SECTION_NAMES)[number]
type Impact = 'high' | 'medium' | 'low'

export type ProfileSectionReview = {
  name: SectionName
  score: number
  verdict: string
  feedback: string
}

export type TopAction = {
  rank: 1 | 2 | 3 | 4 | 5
  action: string
  impact: Impact
  rationale: string
}

export type ProfileReviewResult = {
  mode: InputMode
  sourceUrl: string | null
  score: number
  summary: string
  sections: ProfileSectionReview[]
  topActions: TopAction[]
  tokens_in: number
  tokens_out: number
}

type ErrorCode = 'INVALID_INPUT' | 'SCRAPE_BLOCKED' | 'ANALYSIS_FAILED'
type SuccessResponse = { ok: true; data: ProfileReviewResult; cost?: CostBreakdown }
type ErrorResponse = { ok: false; code?: ErrorCode; message: string }
export type ApiResponse = SuccessResponse | ErrorResponse

function jsonResponse(body: ApiResponse, status: number) {
  return NextResponse.json(body, { status })
}

function extractJsonObject(text: string): string | null {
  const match = text.match(/\{[\s\S]*\}/)
  return match?.[0] ?? null
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object'
}

function parseScore(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const rounded = Math.round(value)
  if (rounded < 0 || rounded > 100) return null
  return rounded
}

function parseImpact(value: unknown): Impact | null {
  if (value === 'high' || value === 'medium' || value === 'low') return value
  return null
}

function parseLinkedInProfileUrl(input: string): string | null {
  try {
    const parsed = new URL(input)
    if (!['http:', 'https:'].includes(parsed.protocol)) return null
    if (!LINKEDIN_HOSTS.has(parsed.hostname.toLowerCase())) return null
    const path = parsed.pathname.replace(/\/+$/, '')
    if (!path.startsWith('/in/')) return null
    if (path.length <= '/in/'.length) return null
    return `https://${parsed.hostname.toLowerCase()}${path}`
  } catch {
    return null
  }
}

function cleanScrapedContent(markdown: string): string {
  return markdown
    .replace(/\[[^\]]+\]\([^)]+\)/g, '$1')
    .replace(/[#>*_`~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildPrompt(mode: InputMode, source: string, content: string): string {
  return `You are an elite LinkedIn profile reviewer for founders and revenue leaders.

INPUT MODE: ${mode}
SOURCE: ${source}

PROFILE CONTENT:
${content.slice(0, 12000)}

Return ONLY valid JSON in this exact shape:
{
  "score": <integer 0-100>,
  "summary": <1-2 sentence executive summary>,
  "sections": [
    {
      "name": "Headline",
      "score": <integer 0-100>,
      "verdict": <short verdict>,
      "feedback": <specific feedback with what to improve>
    },
    {
      "name": "About",
      "score": <integer 0-100>,
      "verdict": <short verdict>,
      "feedback": <specific feedback with what to improve>
    },
    {
      "name": "Experience",
      "score": <integer 0-100>,
      "verdict": <short verdict>,
      "feedback": <specific feedback with what to improve>
    },
    {
      "name": "Skills",
      "score": <integer 0-100>,
      "verdict": <short verdict>,
      "feedback": <specific feedback with what to improve>
    },
    {
      "name": "Recommendations",
      "score": <integer 0-100>,
      "verdict": <short verdict>,
      "feedback": <specific feedback with what to improve>
    },
    {
      "name": "Photo & Banner",
      "score": <integer 0-100>,
      "verdict": <short verdict>,
      "feedback": <specific feedback with what to improve>
    }
  ],
  "topActions": [
    {
      "rank": 1,
      "action": <specific action>,
      "impact": <"high" | "medium" | "low">,
      "rationale": <why this should be done now>
    },
    {
      "rank": 2,
      "action": <specific action>,
      "impact": <"high" | "medium" | "low">,
      "rationale": <why this should be done now>
    },
    {
      "rank": 3,
      "action": <specific action>,
      "impact": <"high" | "medium" | "low">,
      "rationale": <why this should be done now>
    },
    {
      "rank": 4,
      "action": <specific action>,
      "impact": <"high" | "medium" | "low">,
      "rationale": <why this should be done now>
    },
    {
      "rank": 5,
      "action": <specific action>,
      "impact": <"high" | "medium" | "low">,
      "rationale": <why this should be done now>
    }
  ]
}

Rules:
- sections must be exactly 6 items, in this exact order and names exactly as listed.
- topActions must be exactly 5 items with ranks 1 through 5 in order.
- Keep feedback practical and specific.
- No markdown, no explanation, no extra keys.`
}

function validateParsedJson(
  payload: unknown
): Omit<ProfileReviewResult, 'mode' | 'sourceUrl' | 'tokens_in' | 'tokens_out'> | null {
  if (!isObject(payload)) return null

  const score = parseScore(payload.score)
  if (score === null) return null

  if (typeof payload.summary !== 'string' || !payload.summary.trim()) return null

  if (!Array.isArray(payload.sections) || payload.sections.length !== 6) return null
  const parsedSections: ProfileSectionReview[] = []
  for (let i = 0; i < SECTION_NAMES.length; i += 1) {
    const expected = SECTION_NAMES[i]
    if (!expected) return null
    const item = payload.sections[i]
    if (!isObject(item)) return null
    if (item.name !== expected) return null
    const sectionScore = parseScore(item.score)
    if (sectionScore === null) return null
    if (typeof item.verdict !== 'string' || !item.verdict.trim()) return null
    if (typeof item.feedback !== 'string' || !item.feedback.trim()) return null
    parsedSections.push({
      name: expected,
      score: sectionScore,
      verdict: item.verdict.trim(),
      feedback: item.feedback.trim(),
    })
  }

  if (!Array.isArray(payload.topActions) || payload.topActions.length !== 5) return null
  const parsedActions: TopAction[] = []
  for (let i = 0; i < 5; i += 1) {
    const item = payload.topActions[i]
    if (!isObject(item)) return null
    const rank = i + 1
    if (item.rank !== rank) return null
    const impact = parseImpact(item.impact)
    if (!impact) return null
    if (typeof item.action !== 'string' || !item.action.trim()) return null
    if (typeof item.rationale !== 'string' || !item.rationale.trim()) return null
    parsedActions.push({
      rank: rank as 1 | 2 | 3 | 4 | 5,
      action: item.action.trim(),
      impact,
      rationale: item.rationale.trim(),
    })
  }

  return {
    score,
    summary: payload.summary.trim(),
    sections: parsedSections,
    topActions: parsedActions,
  }
}

async function runClaudeReview(
  anthropic: Anthropic,
  prompt: string
): Promise<{
  parsed: Omit<ProfileReviewResult, 'mode' | 'sourceUrl' | 'tokens_in' | 'tokens_out'>
  usage: { model: string; input: number; output: number }
} | null> {
  let followUpInstruction = ''
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      system: STYLE_SYSTEM_PROMPT,
      max_tokens: 1800,
      messages: [
        {
          role: 'user',
          content: `${prompt}${followUpInstruction}`,
        },
      ],
    })

    const firstBlock = message.content[0]
    const raw = firstBlock?.type === 'text' ? firstBlock.text : ''
    const jsonText = extractJsonObject(raw)
    if (!jsonText) {
      followUpInstruction =
        '\n\nYour previous output was not valid JSON. Return only strict JSON with no commentary.'
      continue
    }

    try {
      const candidate = JSON.parse(jsonText) as unknown
      const parsed = validateParsedJson(candidate)
      if (!parsed) {
        followUpInstruction =
          '\n\nYour previous output did not match schema exactly. Return strict JSON with exact section names/order and exactly 5 ranked topActions.'
        continue
      }

      return {
        parsed,
        usage: {
          model: message.model,
          input: message.usage.input_tokens,
          output: message.usage.output_tokens,
        },
      }
    } catch {
      followUpInstruction =
        '\n\nYour previous output was invalid JSON. Return strict JSON only, no markdown fences.'
    }
  }

  return null
}

export async function POST(request: Request) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const firecrawlKey = process.env.FIRECRAWL_API_KEY

  if (!anthropicKey || !firecrawlKey) {
    return jsonResponse(
      { ok: false, message: 'Service not configured. Please try again shortly.' },
      502
    )
  }

  let payload: { mode?: unknown; url?: unknown; profileText?: unknown }
  try {
    payload = (await request.json()) as { mode?: unknown; url?: unknown; profileText?: unknown }
  } catch {
    return jsonResponse({ ok: false, code: 'INVALID_INPUT', message: 'Invalid request body.' }, 422)
  }

  const mode = payload.mode === 'url' || payload.mode === 'paste' ? payload.mode : null
  if (!mode) {
    return jsonResponse(
      { ok: false, code: 'INVALID_INPUT', message: 'Choose URL or paste mode.' },
      422
    )
  }

  let sourceUrl: string | null = null
  let reviewContent = ''

  if (mode === 'url') {
    const rawUrl = typeof payload.url === 'string' ? payload.url.trim() : ''
    const parsedUrl = parseLinkedInProfileUrl(rawUrl)
    if (!parsedUrl) {
      return jsonResponse(
        {
          ok: false,
          code: 'INVALID_INPUT',
          message: 'Enter a valid LinkedIn profile URL like https://www.linkedin.com/in/username.',
        },
        422
      )
    }

    sourceUrl = parsedUrl
    try {
      const firecrawl = new FirecrawlApp({ apiKey: firecrawlKey })
      const scrape = await firecrawl.scrapeUrl(parsedUrl, { formats: ['markdown'] })
      const markdown = scrape.success && scrape.markdown ? scrape.markdown : ''
      reviewContent = cleanScrapedContent(markdown)
    } catch {
      reviewContent = ''
    }

    if (reviewContent.length < SCRAPE_MIN_CHARS) {
      return jsonResponse(
        {
          ok: false,
          code: 'SCRAPE_BLOCKED',
          message:
            "We couldn't read enough profile content from LinkedIn. Switch to Paste mode and paste the profile text directly.",
        },
        422
      )
    }
  } else {
    const profileText = typeof payload.profileText === 'string' ? payload.profileText.trim() : ''
    if (profileText.length < 100 || profileText.length > 8000) {
      return jsonResponse(
        {
          ok: false,
          code: 'INVALID_INPUT',
          message: 'Paste between 100 and 8000 characters of profile content.',
        },
        422
      )
    }
    reviewContent = profileText
  }

  try {
    const anthropic = new Anthropic({ apiKey: anthropicKey })
    const sourceLabel = sourceUrl ?? 'pasted profile text'
    const prompt = buildPrompt(mode, sourceLabel, reviewContent)
    const reviewed = await runClaudeReview(anthropic, prompt)
    if (!reviewed) {
      return jsonResponse(
        {
          ok: false,
          code: 'ANALYSIS_FAILED',
          message: 'We could not format the review this time. Please try again.',
        },
        502
      )
    }

    const data: ProfileReviewResult = {
      mode,
      sourceUrl,
      score: reviewed.parsed.score,
      summary: reviewed.parsed.summary,
      sections: reviewed.parsed.sections,
      topActions: reviewed.parsed.topActions,
      tokens_in: reviewed.usage.input,
      tokens_out: reviewed.usage.output,
    }

    const cost = calculateCost(
      usageFromAnthropic({
        model: reviewed.usage.model,
        usage: {
          input_tokens: reviewed.usage.input,
          output_tokens: reviewed.usage.output,
        },
      })
    )

    return jsonResponse({ ok: true, data, cost }, 200)
  } catch {
    return jsonResponse(
      {
        ok: false,
        message: 'Something went wrong while reviewing the profile. Please try again.',
      },
      500
    )
  }
}

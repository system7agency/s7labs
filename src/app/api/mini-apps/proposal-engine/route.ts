import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const TIMEOUT_MS = 55_000

export type Phase = {
  number: number
  name: string
  deliverables: string[]
  duration: string
}

export type TechItem = {
  name: string
  reason: string
  category: 'frontend' | 'backend' | 'infrastructure' | 'ai' | 'integrations' | 'other'
}

export type ProposalSection = {
  title: string
  content: string
  bullets?: string[]
}

export type ProposalResult = {
  client_summary: string
  scope: ProposalSection
  phases: Phase[]
  tech_stack: TechItem[]
  timeline_weeks: number
  timeline_note: string
  why_s7: ProposalSection
  tone: string
  tokens_in: number
  tokens_out: number
}

type SuccessResponse = { ok: true; data: ProposalResult }
type ErrorResponse = { ok: false; message: string }
export type ApiResponse = SuccessResponse | ErrorResponse

const S7_POSITIONING =
  'System7 (S7) is a product and technology studio that designs, builds, and ships digital products fast. We specialise in AI-powered web and mobile applications, custom SaaS platforms, RevOps tooling, and data-driven products. Our edge: we move faster than traditional agencies by using AI across the entire build process — from scoping to delivery. We work with startups, scale-ups, and enterprise teams who need a technical partner that ships, not just consults. Past work includes AI agents, CRM integrations, voice interfaces, marketplace platforms, and internal operations tools.'

const TONE_INSTRUCTIONS: Record<'formal' | 'conversational' | 'technical', string> = {
  formal:
    'Use structured corporate language — polished, professional, and suitable for enterprise RFP responses.',
  conversational:
    'Use direct, friendly language — clear and approachable without being casual or sloppy.',
  technical:
    'Use detailed language with specs and rationale — explain technology choices and architectural decisions.',
}

const CLAUDE_PROMPT = (brief: string, tone: 'formal' | 'conversational' | 'technical') => `
You are a senior solutions architect and proposal writer at System7 (S7 Labs). Read the client brief below and generate a structured project proposal.

CLIENT BRIEF:
${brief.slice(0, 12000)}

TONE: ${tone}
${TONE_INSTRUCTIONS[tone]}

For the "why_s7" section, draw on this S7 positioning (adapt it naturally to the brief — do not copy verbatim):
${S7_POSITIONING}

Return ONLY valid JSON in this exact shape — no markdown, no explanation:
{
  "client_summary": <1-2 sentence summary of what the client needs and the engagement context>,
  "scope": {
    "title": "Project Scope",
    "content": <2-4 sentences describing the overall scope>,
    "bullets": <optional array of 3-6 key scope items>
  },
  "phases": [
    {
      "number": <1-based phase number>,
      "name": <phase name>,
      "deliverables": <array of 2-5 concrete deliverables>,
      "duration": <e.g. "1–2 weeks", "3–4 weeks">
    }
  ],
  "tech_stack": [
    {
      "name": <technology or tool name>,
      "reason": <1 sentence why it fits this project>,
      "category": <"frontend" | "backend" | "infrastructure" | "ai" | "integrations" | "other">
    }
  ],
  "timeline_weeks": <total estimated weeks as a number>,
  "timeline_note": <1-2 sentences explaining timeline assumptions or dependencies>,
  "why_s7": {
    "title": "Why System7",
    "content": <2-4 sentences tailored to this client explaining why S7 is the right partner>,
    "bullets": <optional array of 2-4 differentiators>
  },
  "tone": "${tone}"
}

Rules:
- Include 3-5 phases that cover discovery through delivery.
- tech_stack must include 5-10 items across multiple categories, each with a specific reason tied to the brief.
- timeline_weeks should be realistic for the described scope.
- All content must be specific to this brief — no generic filler.
- scope.bullets and why_s7.bullets are optional but recommended when they add clarity.
`

function jsonResponse(body: ApiResponse, status: number) {
  return NextResponse.json(body, { status })
}

export async function POST(request: Request) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  if (!anthropicKey) {
    return jsonResponse(
      { ok: false, message: 'Service not configured. Please try again later.' },
      502
    )
  }

  let payload: { brief_text?: unknown; tone?: unknown }
  try {
    payload = (await request.json()) as { brief_text?: unknown; tone?: unknown }
  } catch {
    return jsonResponse({ ok: false, message: 'Invalid request.' }, 422)
  }

  const brief_text = typeof payload.brief_text === 'string' ? payload.brief_text.trim() : ''
  const toneRaw = payload.tone
  const tone: 'formal' | 'conversational' | 'technical' =
    toneRaw === 'formal' || toneRaw === 'conversational' || toneRaw === 'technical'
      ? toneRaw
      : 'formal'

  if (!brief_text || brief_text.length < 50) {
    return jsonResponse(
      { ok: false, message: 'Paste the full client brief (at least 50 characters).' },
      422
    )
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const anthropic = new Anthropic({ apiKey: anthropicKey })
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: CLAUDE_PROMPT(brief_text, tone) }],
    })

    clearTimeout(timer)

    const firstBlock = message.content[0]
    const rawText = firstBlock?.type === 'text' ? firstBlock.text : ''

    let parsed: ProposalResult
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found')
      parsed = JSON.parse(jsonMatch[0]) as ProposalResult
      parsed.tokens_in = message.usage.input_tokens
      parsed.tokens_out = message.usage.output_tokens
      parsed.tone = tone
    } catch {
      return jsonResponse(
        { ok: false, message: 'Proposal generation failed. Please try again.' },
        502
      )
    }

    return jsonResponse({ ok: true, data: parsed }, 200)
  } catch (err) {
    clearTimeout(timer)
    const isAbort = err instanceof Error && err.name === 'AbortError'
    return jsonResponse(
      {
        ok: false,
        message: isAbort
          ? 'Generation timed out. Try a shorter brief or try again.'
          : 'Something went wrong. Please try again.',
      },
      502
    )
  }
}

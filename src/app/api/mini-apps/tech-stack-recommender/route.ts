import Anthropic from '@anthropic-ai/sdk'
import { STYLE_SYSTEM_PROMPT } from '@/lib/llm/style'
import { NextResponse } from 'next/server'

import { calculateCost, type CostBreakdown, usageFromAnthropic } from '@/lib/llm/cost'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 55

const MIN_BRIEF_CHARS = 25

const LAYER_ORDER = ['Frontend', 'Backend', 'Database', 'Hosting', 'Auth', 'Payments'] as const

export type StackLayer = (typeof LAYER_ORDER)[number]

export type StackChoice = {
  layer: StackLayer
  pick: string
  why: string
  alternatives: string[]
  monthly_cost: string
}

export type StackResult = {
  project_name: string
  project_type: string
  one_liner: string
  complexity: 'Simple' | 'Moderate' | 'Complex' | 'Ambitious'
  complexity_score: number
  build_estimate: string
  monthly_cost_estimate: string
  layers: StackChoice[]
  key_services: { name: string; purpose: string }[]
  considerations: string[]
  tokens_in: number
  tokens_out: number
}

type SuccessResponse = { ok: true; data: StackResult; cost?: CostBreakdown }
type ErrorResponse = { ok: false; message: string }
export type ApiResponse = SuccessResponse | ErrorResponse

const CLAUDE_PROMPT = (brief: string) => `
You are a pragmatic senior software architect who actually ships products. Recommend a modern tech stack for the described project across frontend, backend, database, hosting, auth, and payments, plus any key third-party services. Justify every choice against THIS project's needs — no hype, no resume-driven development. Give honest small-scale cost ranges and flag where the hard parts are (real-time, payments, scale, compliance). The one_liner should be memorable and a little opinionated but fair. Return ONLY valid JSON.

PROJECT BRIEF:
${brief.slice(0, 8000)}

Return ONLY valid JSON in this exact shape — no markdown, no explanation:
{
  "project_name": <short name for the project>,
  "project_type": <e.g. "Two-sided marketplace">,
  "one_liner": <memorable summary of the stack call>,
  "complexity": <"Simple" | "Moderate" | "Complex" | "Ambitious">,
  "complexity_score": <integer 1-10>,
  "build_estimate": <realistic e.g. "6-10 weeks for an MVP">,
  "monthly_cost_estimate": <total range at small scale e.g. "$50-200/mo">,
  "layers": [
    {
      "layer": <"Frontend" | "Backend" | "Database" | "Hosting" | "Auth" | "Payments">,
      "pick": <recommended tech>,
      "why": <2-3 sentences specific to THIS project>,
      "alternatives": [<1-2 credible alternatives>],
      "monthly_cost": <small-scale estimate e.g. "$0-25">
    }
  ],
  "key_services": [
    { "name": <service name>, "purpose": <short purpose specific to brief> }
  ],
  "considerations": [<exactly 3 specific things to watch before building>]
}

Stack guidance:
- Pick proven, modern tools. Be boring where it counts (auth, payments, data) and only reach for novel tools when the project clearly needs them.
- Every "why" must reference something in the brief, not generic praise.
- monthly_cost figures are for small / MVP scale, stated as ranges.
- key_services captures anything the 6 core layers don't cover (e.g. real-time tracking, maps, transactional email, search, file storage, AI/LLM).
- complexity_score and build_estimate must be realistic for a small team.
- layers must contain exactly 6 entries in this order: Frontend, Backend, Database, Hosting, Auth, Payments.
`

function jsonResponse(body: ApiResponse, status: number) {
  return NextResponse.json(body, { status })
}

function parseClaudeJson(rawText: string): StackResult {
  const stripped = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()
  const jsonMatch = stripped.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found')
  const parsed = JSON.parse(jsonMatch[0]) as StackResult
  if (!Array.isArray(parsed.layers) || parsed.layers.length !== LAYER_ORDER.length) {
    throw new Error('Invalid layers')
  }
  for (let i = 0; i < LAYER_ORDER.length; i++) {
    if (parsed.layers[i]?.layer !== LAYER_ORDER[i]) {
      throw new Error('Layer order mismatch')
    }
  }
  return parsed
}

export async function POST(request: Request) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  if (!anthropicKey) {
    return jsonResponse(
      { ok: false, message: 'Service not configured. Please try again later.' },
      502
    )
  }

  let payload: { brief?: unknown }
  try {
    payload = (await request.json()) as { brief?: unknown }
  } catch {
    return jsonResponse({ ok: false, message: 'Invalid request.' }, 422)
  }

  const brief = typeof payload.brief === 'string' ? payload.brief.trim() : ''

  if (!brief || brief.length < MIN_BRIEF_CHARS) {
    return jsonResponse(
      { ok: false, message: 'Tell us a bit more about what you want to build.' },
      422
    )
  }

  try {
    const anthropic = new Anthropic({ apiKey: anthropicKey })
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      system: STYLE_SYSTEM_PROMPT,
      max_tokens: 3000,
      messages: [{ role: 'user', content: CLAUDE_PROMPT(brief) }],
    })

    const firstBlock = message.content[0]
    const rawText = firstBlock?.type === 'text' ? firstBlock.text : ''

    let parsed: StackResult
    try {
      parsed = parseClaudeJson(rawText)
      parsed.tokens_in = message.usage.input_tokens
      parsed.tokens_out = message.usage.output_tokens
    } catch {
      return jsonResponse(
        { ok: false, message: 'Stack recommendation failed. Please try again.' },
        500
      )
    }

    const cost = calculateCost(usageFromAnthropic(message))
    return jsonResponse({ ok: true, data: parsed, cost }, 200)
  } catch {
    return jsonResponse({ ok: false, message: 'Something went wrong. Please try again.' }, 502)
  }
}

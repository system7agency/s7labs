import Anthropic from '@anthropic-ai/sdk'
import { STYLE_SYSTEM_PROMPT } from '@/lib/llm/style'
import { NextResponse } from 'next/server'

import { calculateCost, type CostBreakdown, sumUsage } from '@/lib/llm/cost'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 55

const MIN_REQUIRED = 20
const MAX_REQUIRED = 1500
const MAX_OPTIONAL = 800


const CAMPAIGN_MODEL = 'claude-opus-4-5'

const ALLOWED_EFFORT = new Set(['low', 'medium', 'high'])

export type CampaignIdea = {
  name: string
  hook: string
  channels: string[]
  format: string
  firstStep: string
  expectedOutcome: string
  effort: 'low' | 'medium' | 'high'
}

export type CampaignIdeationResult = {
  summary: {
    positioning: string
  }
  ideas: CampaignIdea[]
  tokens_in: number
  tokens_out: number
}

type SuccessResponse = { ok: true; data: CampaignIdeationResult; cost?: CostBreakdown }
type ErrorResponse = { ok: false; message: string }
export type ApiResponse = SuccessResponse | ErrorResponse



function costFromPass(tokensIn: number, tokensOut: number): CostBreakdown {
  return calculateCost({
    model: CAMPAIGN_MODEL,
    inputTokens: tokensIn,
    outputTokens: tokensOut,
  })
}
function jsonResponse(body: ApiResponse, status: number) {
  return NextResponse.json(body, { status })
}

function readField(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const cleaned = value.trim()
  if (!cleaned) return undefined
  return cleaned
}

function parseClaudeJson(rawText: string): CampaignIdeationResult {
  const stripped = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()
  const jsonMatch = stripped.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found')

  const parsed = JSON.parse(jsonMatch[0]) as CampaignIdeationResult
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !parsed.summary ||
    typeof parsed.summary.positioning !== 'string' ||
    !Array.isArray(parsed.ideas) ||
    parsed.ideas.length !== 7
  ) {
    throw new Error('Invalid top-level shape')
  }

  for (const idea of parsed.ideas) {
    if (
      !idea ||
      typeof idea.name !== 'string' ||
      typeof idea.hook !== 'string' ||
      !Array.isArray(idea.channels) ||
      idea.channels.length < 1 ||
      typeof idea.format !== 'string' ||
      typeof idea.firstStep !== 'string' ||
      typeof idea.expectedOutcome !== 'string' ||
      typeof idea.effort !== 'string'
    ) {
      throw new Error('Invalid idea shape')
    }
    if (!ALLOWED_EFFORT.has(idea.effort.toLowerCase())) {
      throw new Error('Invalid effort')
    }
  }

  return {
    summary: {
      positioning: parsed.summary.positioning.trim(),
    },
    ideas: parsed.ideas.map((idea) => ({
      name: idea.name.trim(),
      hook: idea.hook.trim(),
      channels: idea.channels.map((c) => String(c).trim()).filter(Boolean),
      format: idea.format.trim(),
      firstStep: idea.firstStep.trim(),
      expectedOutcome: idea.expectedOutcome.trim(),
      effort: idea.effort.toLowerCase() as 'low' | 'medium' | 'high',
    })),
    tokens_in: 0,
    tokens_out: 0,
  }
}

function buildPrompt(input: {
  product: string
  audience: string
  currentMotion?: string
  goal?: string
}) {
  return `
You are a senior demand-generation strategist helping B2B teams design campaign concepts that can be executed this quarter.

PRODUCT / OFFER:
${input.product}

TARGET AUDIENCE:
${input.audience}

CURRENT MOTION (optional):
${input.currentMotion ?? 'Not provided'}

PRIMARY GOAL (optional):
${input.goal ?? 'Not provided'}

Return ONLY valid JSON in this exact shape:
{
  "summary": {
    "positioning": "<2-3 sentence strategic positioning statement specific to this product + audience>"
  },
  "ideas": [
    {
      "name": "<campaign name>",
      "hook": "<core insight / message angle>",
      "channels": ["<channel 1>", "<channel 2>"],
      "format": "<primary asset or execution format>",
      "firstStep": "<first concrete action to launch this idea>",
      "expectedOutcome": "<practical expected outcome in 1 sentence>",
      "effort": "<low | medium | high>"
    }
  ]
}

Rules:
- Exactly 7 ideas.
- Across the full set, include at least 4 distinct channels in total.
- Mix effort levels across the set (include low, medium, and high at least once each).
- Keep ideas execution-ready and non-generic.
- Be specific to the provided product, audience, and optional context.
- Keep each field concise and practical.
- Do not include markdown, comments, or extra keys.
`
}

async function runClaude(
  anthropic: Anthropic,
  prompt: string
): Promise<{ parsed: CampaignIdeationResult; tokensIn: number; tokensOut: number }> {
  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    system: STYLE_SYSTEM_PROMPT,
    max_tokens: 2200,
    messages: [{ role: 'user', content: prompt }],
  })

  const firstBlock = message.content[0]
  const rawText = firstBlock?.type === 'text' ? firstBlock.text : ''
  const parsed = parseClaudeJson(rawText)
  return {
    parsed,
    tokensIn: message.usage.input_tokens,
    tokensOut: message.usage.output_tokens,
  }
}

export async function POST(request: Request) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    return jsonResponse(
      { ok: false, message: 'Service not configured. Please try again later.' },
      502
    )
  }

  let payload: {
    product?: unknown
    audience?: unknown
    currentMotion?: unknown
    goal?: unknown
  }
  try {
    payload = (await request.json()) as {
      product?: unknown
      audience?: unknown
      currentMotion?: unknown
      goal?: unknown
    }
  } catch {
    return jsonResponse({ ok: false, message: 'Invalid request.' }, 422)
  }

  const product = readField(payload.product)
  const audience = readField(payload.audience)
  const currentMotion = readField(payload.currentMotion)
  const goal = readField(payload.goal)

  if (!product || product.length < MIN_REQUIRED || product.length > MAX_REQUIRED) {
    return jsonResponse(
      {
        ok: false,
        message: 'Product must be between 20 and 1500 characters.',
      },
      422
    )
  }

  if (!audience || audience.length < MIN_REQUIRED || audience.length > MAX_REQUIRED) {
    return jsonResponse(
      {
        ok: false,
        message: 'Audience must be between 20 and 1500 characters.',
      },
      422
    )
  }

  const prompt = buildPrompt({
    product,
    audience,
    currentMotion: currentMotion?.slice(0, MAX_OPTIONAL),
    goal: goal?.slice(0, MAX_OPTIONAL),
  })
  const anthropic = new Anthropic({ apiKey: anthropicKey })

  try {
    const firstPass = await runClaude(anthropic, prompt)
    firstPass.parsed.tokens_in = firstPass.tokensIn
    firstPass.parsed.tokens_out = firstPass.tokensOut
    return jsonResponse({ ok: true, data: firstPass.parsed, cost: costFromPass(firstPass.tokensIn, firstPass.tokensOut) }, 200)
  } catch (firstErr) {
    try {
      const retryPrompt = `${prompt}

Your previous response did not pass strict JSON validation.
Return corrected JSON only, still following the exact schema and rules.
`
      const retry = await runClaude(anthropic, retryPrompt)
      retry.parsed.tokens_in = retry.tokensIn
      retry.parsed.tokens_out = retry.tokensOut
      const usage = sumUsage([
        { model: CAMPAIGN_MODEL, inputTokens: firstPass.tokensIn, outputTokens: firstPass.tokensOut },
        { model: CAMPAIGN_MODEL, inputTokens: retry.tokensIn, outputTokens: retry.tokensOut },
      ])
      const cost = calculateCost(usage)
      return jsonResponse({ ok: true, data: retry.parsed, cost }, 200)
    } catch {
      const message =
        firstErr instanceof Error && /JSON|shape|effort/i.test(firstErr.message)
          ? 'We had trouble structuring the ideas. Please try again.'
          : 'Something went wrong while generating ideas. Please try again.'
      return jsonResponse({ ok: false, message }, 500)
    }
  }
}

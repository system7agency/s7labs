import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { calculateCost, type CostBreakdown, usageFromAnthropic } from '@/lib/llm/cost'
import { STYLE_SYSTEM_PROMPT } from '@/lib/llm/style'

import {
  collectHiringSignals,
  collectNewsSignals,
  collectTechSignals,
  type CollectorSignal,
  type CollectorSignalStrength,
} from './_collectors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 55

const CACHE_TTL_MS = 6 * 60 * 60 * 1000

const requestSchema = z.object({
  domain: z.string().min(1),
})

const resultSignalSchema = z.object({
  type: z.enum(['hiring', 'news', 'tech']),
  strength: z.enum(['strong', 'moderate', 'weak']),
  headline: z.string().min(1),
  detail: z.string().min(1),
  source: z.string().min(1),
  sourceUrl: z.string().url(),
  observedAt: z.string().min(1),
})

const resultSchema = z.object({
  domain: z.string().min(1),
  intentScore: z.number().int().min(0).max(100),
  summary: z.string().min(1),
  signals: z.array(resultSignalSchema),
  outreachAngle: z.string().min(1),
})

export type IntentSignal = z.infer<typeof resultSignalSchema>
export type IntentSignalsResult = z.infer<typeof resultSchema> & {
  cached?: boolean
  tokensIn: number
  tokensOut: number
}

type SuccessResponse = { ok: true; data: IntentSignalsResult; cost?: CostBreakdown }
type ErrorResponse = { ok: false; message: string }
export type ApiResponse = SuccessResponse | ErrorResponse

type CacheEntry = {
  expiresAt: number
  value: IntentSignalsResult
  cost?: CostBreakdown
}

const resultCache = new Map<string, CacheEntry>()

function jsonResponse(body: ApiResponse, status: number) {
  return NextResponse.json(body, { status })
}

function normalizeDomainHost(input: string): string {
  const trimmed = input.trim().toLowerCase()
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  const url = new URL(withProtocol)
  return url.hostname.replace(/^www\./, '')
}

function sortSignals(signals: CollectorSignal[]): CollectorSignal[] {
  return [...signals].sort((a, b) => {
    const timeA = Date.parse(a.observedAt) || 0
    const timeB = Date.parse(b.observedAt) || 0
    return timeB - timeA
  })
}

function defaultQuietResult(domain: string): IntentSignalsResult {
  return {
    domain,
    intentScore: 8,
    summary:
      'No strong public intent signals were detected from hiring, recent-news, or tech-surface checks. This account may still be valid, but timing signals look quiet right now.',
    signals: [],
    outreachAngle:
      'Lead with a low-friction diagnostic or benchmark offer instead of a hard pitch. Treat this as a nurture target until clearer triggers appear.',
    tokensIn: 0,
    tokensOut: 0,
  }
}

const CLAUDE_PROMPT = (domain: string, signals: CollectorSignal[]) => `
You are an expert RevOps analyst.

You are given collected intent signals for domain "${domain}".
You MUST NOT invent new signals, sources, dates, or facts.
Use only the signals provided below.

COLLECTED_SIGNALS_JSON:
${JSON.stringify(signals, null, 2).slice(0, 14000)}

Return ONLY valid JSON in this exact shape:
{
  "domain": "${domain}",
  "intentScore": <integer 0-100>,
  "summary": <2 concise sentences about overall buying intent>,
  "signals": [
    {
      "type": <"hiring" | "news" | "tech">,
      "strength": <"strong" | "moderate" | "weak">,
      "headline": <headline copied or lightly normalized from input signal>,
      "detail": <detail grounded in provided signal>,
      "source": <source string from provided signal>,
      "sourceUrl": <source URL from provided signal>,
      "observedAt": <timestamp from provided signal>
    }
  ],
  "outreachAngle": <1-2 sentences specific outreach angle grounded in provided signals>
}

Rules:
- Keep "signals" ranked strongest to weakest.
- Every returned signal must map to an input signal by type + headline + sourceUrl.
- If confidence is low, lower intentScore and say so clearly.
- Do not include markdown or any text outside JSON.
`

function normalizeStrengths(signals: IntentSignal[]): IntentSignal[] {
  const fallbackStrength = (idx: number): CollectorSignalStrength => {
    if (idx === 0) return 'strong'
    if (idx < 3) return 'moderate'
    return 'weak'
  }
  return signals.map((signal, idx) => ({
    ...signal,
    strength: signal.strength ?? fallbackStrength(idx),
  }))
}

export async function POST(request: Request) {
  let parsedBody: z.infer<typeof requestSchema>
  try {
    const body = (await request.json()) as unknown
    parsedBody = requestSchema.parse(body)
  } catch {
    return jsonResponse({ ok: false, message: 'Invalid request. Expected { domain }.' }, 422)
  }

  let domain: string
  try {
    domain = normalizeDomainHost(parsedBody.domain)
  } catch {
    return jsonResponse({ ok: false, message: 'Please enter a valid domain (e.g. acme.com).' }, 422)
  }

  const cached = resultCache.get(domain)
  if (cached && cached.expiresAt > Date.now()) {
    return jsonResponse(
      { ok: true, data: { ...cached.value, cached: true }, cost: cached.cost },
      200
    )
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    return jsonResponse(
      { ok: false, message: 'Service not configured. Please try again later.' },
      502
    )
  }

  const settledCollectors = await Promise.allSettled([
    collectHiringSignals(domain),
    collectNewsSignals(domain),
    collectTechSignals(domain),
  ])

  const collectedSignals = sortSignals(
    settledCollectors.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
  )

  if (collectedSignals.length === 0) {
    const quiet = defaultQuietResult(domain)
    resultCache.set(domain, { value: quiet, expiresAt: Date.now() + CACHE_TTL_MS })
    return jsonResponse({ ok: true, data: quiet }, 200)
  }

  try {
    const anthropic = new Anthropic({ apiKey: anthropicKey })
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      system: STYLE_SYSTEM_PROMPT,
      max_tokens: 1600,
      messages: [{ role: 'user', content: CLAUDE_PROMPT(domain, collectedSignals) }],
    })

    const firstBlock = message.content[0]
    const rawText = firstBlock?.type === 'text' ? firstBlock.text : ''
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return jsonResponse({ ok: false, message: 'Intent analysis failed. Please try again.' }, 502)
    }

    const parsed = resultSchema.parse(JSON.parse(jsonMatch[0]))
    const data: IntentSignalsResult = {
      ...parsed,
      signals: normalizeStrengths(parsed.signals),
      tokensIn: message.usage.input_tokens,
      tokensOut: message.usage.output_tokens,
    }

    const cost = calculateCost(usageFromAnthropic(message))
    resultCache.set(domain, { value: data, cost, expiresAt: Date.now() + CACHE_TTL_MS })

    return jsonResponse({ ok: true, data, cost }, 200)
  } catch {
    return jsonResponse({ ok: false, message: 'Intent analysis failed. Please try again.' }, 502)
  }
}

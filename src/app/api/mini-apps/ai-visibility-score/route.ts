import Anthropic from '@anthropic-ai/sdk'
import { STYLE_SYSTEM_PROMPT } from '@/lib/llm/style'
import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { scrapeEntitySignals } from '@/lib/mini-apps/avs-entity'
import { askPerplexityWithCitations } from '@/lib/mini-apps/avs-perplexity'
import { loadLatestAvsScan, saveAvsScan } from '@/lib/mini-apps/avs-storage'
import type { AVSApiResponse, AVSResult, SubScore } from '@/lib/mini-apps/avs-types'
import {
  AVS_SUB_SCORE_LABELS,
  AVS_SUB_SCORE_ORDER,
  computeAvs,
  scoreToGrade,
  type AVSSubScoreKey,
} from '@/lib/mini-apps/avs-weights'
import { brandsMentionedInText, type TrackedBrand } from '@/lib/mini-apps/brand-mentions'
import { scanAioBrandCited } from '@/lib/mini-apps/dataforseo-aio'
import { isValidDomain, normalizeDomain } from '@/lib/mini-apps/normalize-domain'
import {
  askChatGpt,
  askClaude,
  CLAUDE_ANSWER_MODEL,
  CLAUDE_SETUP_MODEL,
} from '@/lib/mini-apps/sov-providers'

export type { AVSApiResponse, AVSResult, SubScore } from '@/lib/mini-apps/avs-types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 55

const TIMEOUT_MS = 55_000
const INTERPRET_MODEL = 'claude-opus-4-5'
type SetupPayload = {
  brand: string
  category: string
  buying_intent_questions: string[]
  brand_question: string
}

type InterpretPayload = {
  one_liner: string
  biggest_drag: { sub_score: string; why: string }
  short_read: { sub_score: string; diagnosis: string }[]
  fix_recommendations: string[]
}

function jsonResponse(body: AVSApiResponse, status: number) {
  return NextResponse.json(body, { status })
}

function parseJson<T>(rawText: string): T {
  const stripped = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()
  const jsonMatch = stripped.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON')
  return JSON.parse(jsonMatch[0]) as T
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3)
  )
}

function textAgreement(a: string, b: string): number {
  const sa = tokenize(a)
  const sb = tokenize(b)
  if (sa.size === 0 || sb.size === 0) return 0
  let inter = 0
  for (const w of sa) if (sb.has(w)) inter++
  return inter / Math.max(sa.size, sb.size)
}

function buildSubScore(key: AVSSubScoreKey, score: number, coverage: string): SubScore {
  const rounded = Math.round(Math.min(100, Math.max(0, score)))
  return {
    key,
    name: AVS_SUB_SCORE_LABELS[key],
    score: rounded,
    grade: scoreToGrade(rounded),
    coverage,
  }
}

const SETUP_PROMPT = (domain: string, brandOverride?: string) => `
From domain "${domain}"${brandOverride ? ` and brand name "${brandOverride}"` : ''}, infer the brand name, product category, exactly 3 buying-intent questions a real buyer would ask (natural, do NOT name the brand), and one direct brand question ("What is {brand} and who is it for?"). Return ONLY valid JSON:
{
  "brand": <string>,
  "category": <string>,
  "buying_intent_questions": [<3 strings>],
  "brand_question": <string>
}
`

const INTERPRET_PROMPT = (
  domain: string,
  brand: string,
  category: string,
  subScores: SubScore[],
  facts: object
) => `
You are an expert in how AI systems surface and describe brands. You are given four factual sub-scores (presence, citations, entity clarity, drift) and the underlying signals. Interpret them — do not change the numbers. Write a memorable, slightly pointed one_liner. Name the single biggest drag on the score and why. For each weak sub-score (below 70), give a 1-2 sentence diagnosis. Then give 3-5 specific "what to fix" recommendations — concrete actions, not generic advice. Return ONLY valid JSON.

Domain: ${domain}
Brand: ${brand}
Category: ${category}
Sub-scores: ${JSON.stringify(subScores)}
Facts: ${JSON.stringify(facts)}

Return ONLY JSON:
{
  "one_liner": <string>,
  "biggest_drag": { "sub_score": <string>, "why": <string> },
  "short_read": [{ "sub_score": <string>, "diagnosis": <string> }],
  "fix_recommendations": [<3-5 strings>]
}
`

const ENTITY_PROBE_PROMPT = (brand: string, domain: string, signals: object) => `
What is ${brand} (${domain}) and who is it for? Be specific. Return ONLY JSON: { "clarity_score": <0-100 where 100 = confident accurate description, low = hedged/wrong/unsure>, "summary": <one sentence> }

Structured data signals we already measured: ${JSON.stringify(signals)}
`

export async function POST(request: Request) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    return jsonResponse(
      { ok: false, message: 'Service not configured. Please try again later.' },
      502
    )
  }

  let payload: { domain?: unknown; brand?: unknown }
  try {
    payload = (await request.json()) as { domain?: unknown; brand?: unknown }
  } catch {
    return jsonResponse({ ok: false, message: 'Invalid request.' }, 422)
  }

  const rawDomain = typeof payload.domain === 'string' ? payload.domain.trim() : ''
  if (!rawDomain || !isValidDomain(rawDomain)) {
    return jsonResponse({ ok: false, message: 'Enter a valid domain.' }, 422)
  }

  const domain = normalizeDomain(rawDomain)
  const brandOverride = typeof payload.brand === 'string' ? payload.brand.trim() : undefined

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let tokensIn = 0
  let tokensOut = 0

  try {
    const anthropic = new Anthropic({ apiKey: anthropicKey })

    const setupMsg = await anthropic.messages.create({
      model: CLAUDE_SETUP_MODEL,
      system: STYLE_SYSTEM_PROMPT,
      max_tokens: 1200,
      messages: [{ role: 'user', content: SETUP_PROMPT(domain, brandOverride) }],
    })
    tokensIn += setupMsg.usage.input_tokens
    tokensOut += setupMsg.usage.output_tokens
    const setupBlock = setupMsg.content[0]
    if (setupBlock?.type !== 'text') throw new Error('Setup failed')
    const setup = parseJson<SetupPayload>(setupBlock.text)
    if (setup.buying_intent_questions.length < 3) throw new Error('Need 3 questions')
    const questions = setup.buying_intent_questions.slice(0, 3)
    const brand = brandOverride || setup.brand
    const category = setup.category
    const brandQuestion = setup.brand_question

    const tracked: TrackedBrand = {
      domain,
      name: brand,
      aliases: [brand, domain.split('.')[0] ?? ''],
      is_you: true,
    }

    const hasOpenAi = Boolean(process.env.OPENAI_API_KEY)
    const hasPerplexity = Boolean(process.env.PERPLEXITY_API_KEY)
    const hasDataforseo = Boolean(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD)

    const presenceTasks: Promise<{ mentioned: boolean; engine: string }>[] = []
    const citationTasks: Promise<{ cited: boolean; engine: string; counted: boolean }>[] = []

    for (const q of questions) {
      presenceTasks.push(
        askClaude(anthropic, q).then((r) => {
          tokensIn += r.tokens_in
          tokensOut += r.tokens_out
          const mentioned = r.ok && brandsMentionedInText(r.text, [tracked]).length > 0
          return { mentioned, engine: 'Claude' }
        })
      )
      if (hasOpenAi) {
        presenceTasks.push(
          askChatGpt(q).then((r) => {
            tokensIn += r.tokens_in
            tokensOut += r.tokens_out
            const mentioned = r.ok && brandsMentionedInText(r.text, [tracked]).length > 0
            return { mentioned, engine: 'ChatGPT' }
          })
        )
      }
      if (hasPerplexity) {
        const ppxP = askPerplexityWithCitations(q, domain).then((r) => {
          tokensIn += r.tokens_in
          tokensOut += r.tokens_out
          return r
        })
        presenceTasks.push(
          ppxP.then((r) => ({
            mentioned: r.ok && brandsMentionedInText(r.text, [tracked]).length > 0,
            engine: 'Perplexity',
          }))
        )
        citationTasks.push(
          ppxP.then((r) => ({
            cited: r.brand_cited,
            engine: 'Perplexity',
            counted: r.ok,
          }))
        )
      }
      if (hasDataforseo) {
        citationTasks.push(
          scanAioBrandCited(
            process.env.DATAFORSEO_LOGIN!,
            process.env.DATAFORSEO_PASSWORD!,
            q,
            domain,
            controller.signal
          ).then((r) => ({
            cited: r.brand_cited,
            engine: 'Google AI Overview',
            counted: r.ok && r.ai_overview_present,
          }))
        )
      }
    }

    const entityScrapeP = scrapeEntitySignals(domain, controller.signal)
    const entityProbeP = anthropic.messages.create({
      model: CLAUDE_ANSWER_MODEL,
      system: STYLE_SYSTEM_PROMPT,
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: ENTITY_PROBE_PROMPT(brand, domain, { pending: true }),
        },
      ],
    })

    const driftProxySamples: Promise<string>[] = []
    for (let i = 0; i < 3; i++) {
      driftProxySamples.push(
        anthropic.messages
          .create({
            model: CLAUDE_ANSWER_MODEL,
            system: STYLE_SYSTEM_PROMPT,
            max_tokens: 500,
            messages: [{ role: 'user', content: brandQuestion }],
          })
          .then((m) => {
            tokensIn += m.usage.input_tokens
            tokensOut += m.usage.output_tokens
            const b = m.content[0]
            return b?.type === 'text' ? b.text : ''
          })
      )
    }

    const priorP = loadLatestAvsScan(domain)

    const [presenceSettled, citationSettled, entitySignals, entityProbeMsg, prior, ...driftTexts] =
      await Promise.all([
        Promise.allSettled(presenceTasks),
        Promise.allSettled(citationTasks),
        entityScrapeP,
        entityProbeP,
        priorP,
        ...driftProxySamples,
      ])

    tokensIn += entityProbeMsg.usage.input_tokens
    tokensOut += entityProbeMsg.usage.output_tokens
    const probeBlock = entityProbeMsg.content[0]
    let probeClarity = 50
    if (probeBlock?.type === 'text') {
      try {
        const probe = parseJson<{ clarity_score?: number }>(probeBlock.text)
        if (typeof probe.clarity_score === 'number') probeClarity = probe.clarity_score
      } catch {
        /* keep default */
      }
    }

    const presenceHits = presenceSettled.filter(
      (r) => r.status === 'fulfilled' && r.value.mentioned
    ).length
    const presenceTotal = presenceSettled.filter((r) => r.status === 'fulfilled').length
    const presenceScore = presenceTotal > 0 ? Math.round((presenceHits / presenceTotal) * 100) : 0

    const enginesUsed: string[] = ['Claude']
    if (hasOpenAi) enginesUsed.push('ChatGPT')
    if (hasPerplexity) enginesUsed.push('Perplexity')
    const presenceCoverage =
      enginesUsed.length === 1 && !hasOpenAi && !hasPerplexity
        ? 'Claude only (no OpenAI/Perplexity key)'
        : enginesUsed.join(' + ')

    const citationCounted = citationSettled.filter(
      (r) => r.status === 'fulfilled' && r.value.counted
    )
    const citationHits = citationCounted.filter(
      (r) => r.status === 'fulfilled' && r.value.cited
    ).length
    const citationTotal = citationCounted.length
    const citationScore = citationTotal > 0 ? Math.round((citationHits / citationTotal) * 100) : 0
    const citationEngines = citationCounted
      .map((r) => (r.status === 'fulfilled' ? r.value.engine : null))
      .filter(Boolean) as string[]
    const citationCoverage =
      citationTotal === 0
        ? 'No citation engines (add Perplexity or DataForSEO)'
        : citationEngines.join(' + ')

    const entityScore = Math.round((entitySignals.structured_score + probeClarity) / 2)
    const entityCoverage = process.env.FIRECRAWL_API_KEY
      ? 'Firecrawl structured data + Claude probe'
      : 'Claude probe only (no Firecrawl key)'

    let driftScore = 70
    let driftCoverage = 'proxy (no history yet)'
    if (prior) {
      const prevP = prior.sub_scores.find((s) => s.key === 'presence')?.score ?? 0
      const prevC = prior.sub_scores.find((s) => s.key === 'citations')?.score ?? 0
      const delta = Math.abs(presenceScore - prevP) + Math.abs(citationScore - prevC)
      driftScore = Math.round(Math.max(0, 100 - Math.min(100, delta)))
      driftCoverage = `vs scan ${prior.created_at.slice(0, 10)}`
    } else if (driftTexts.length >= 2) {
      const agreements: number[] = []
      for (let i = 0; i < driftTexts.length; i++) {
        for (let j = i + 1; j < driftTexts.length; j++) {
          agreements.push(textAgreement(driftTexts[i] ?? '', driftTexts[j] ?? ''))
        }
      }
      const avg =
        agreements.length > 0 ? agreements.reduce((a, b) => a + b, 0) / agreements.length : 0.5
      driftScore = Math.round(avg * 100)
      driftCoverage = 'proxy (no history yet) · Claude repeat samples'
    }

    const subScoreMap: Record<AVSSubScoreKey, number> = {
      presence: presenceScore,
      citations: citationScore,
      entity_clarity: entityScore,
      drift: driftScore,
    }

    const sub_scores: SubScore[] = AVS_SUB_SCORE_ORDER.map((key) =>
      buildSubScore(
        key,
        subScoreMap[key],
        key === 'presence'
          ? presenceCoverage
          : key === 'citations'
            ? citationCoverage
            : key === 'entity_clarity'
              ? entityCoverage
              : driftCoverage
      )
    )

    const avs = computeAvs(subScoreMap)
    const grade = scoreToGrade(avs)

    const interpretMsg = await anthropic.messages.create({
      model: INTERPRET_MODEL,
      system: STYLE_SYSTEM_PROMPT,
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: INTERPRET_PROMPT(domain, brand, category, sub_scores, {
            presence: { hits: presenceHits, total: presenceTotal },
            citations: { hits: citationHits, total: citationTotal },
            entity_signals: entitySignals,
            probe_clarity: probeClarity,
            drift_coverage: driftCoverage,
          }),
        },
      ],
    })
    tokensIn += interpretMsg.usage.input_tokens
    tokensOut += interpretMsg.usage.output_tokens
    const interpretBlock = interpretMsg.content[0]
    if (interpretBlock?.type !== 'text') throw new Error('Interpret failed')
    const interpreted = parseJson<InterpretPayload>(interpretBlock.text)

    const result: AVSResult = {
      domain,
      brand,
      category,
      avs,
      grade,
      one_liner: interpreted.one_liner,
      sub_scores,
      biggest_drag: interpreted.biggest_drag,
      short_read: interpreted.short_read,
      fix_recommendations: interpreted.fix_recommendations,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
    }

    await saveAvsScan(randomUUID(), domain, avs, sub_scores, result)
    clearTimeout(timer)
    return jsonResponse({ ok: true, data: result }, 200)
  } catch (err) {
    clearTimeout(timer)
    if (controller.signal.aborted) {
      return jsonResponse({ ok: false, message: 'Scan timed out. Try again in a moment.' }, 504)
    }
    console.error('[ai-visibility-score]', err)
    return jsonResponse(
      { ok: false, message: "Couldn't compute your score right now. Please try again." },
      500
    )
  }
}

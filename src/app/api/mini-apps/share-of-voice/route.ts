import Anthropic from '@anthropic-ai/sdk'
import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { brandsMentionedInText, excerpt, type TrackedBrand } from '@/lib/mini-apps/brand-mentions'
import {
  isValidDomain,
  normalizeDomain,
  parseCompetitorDomains,
} from '@/lib/mini-apps/normalize-domain'
import {
  askChatGpt,
  askClaude,
  askPerplexity,
  CLAUDE_SETUP_MODEL,
  type AnswerCallResult,
} from '@/lib/mini-apps/sov-providers'
import { saveSovScan, type SovScanRecord } from '@/lib/mini-apps/sov-storage'
import type {
  BrandScore,
  Provider,
  ScanApiResponse,
  ScanFree,
  ScanGated,
} from '@/lib/mini-apps/sov-types'

export type {
  BrandScore,
  Provider,
  ScanApiResponse,
  ScanFree,
  ScanGated,
  UnlockApiResponse,
} from '@/lib/mini-apps/sov-types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 55

type SetupPayload = {
  category: string
  brands: { domain: string; name: string; aliases: string[] }[]
  questions: string[]
  recommendations: string[]
}

function jsonScan(body: ScanApiResponse, status: number) {
  return NextResponse.json(body, { status })
}

function parseSetupJson(rawText: string): SetupPayload {
  const stripped = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()
  const jsonMatch = stripped.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON')
  const parsed = JSON.parse(jsonMatch[0]) as SetupPayload
  if (!parsed.category || !Array.isArray(parsed.brands) || !Array.isArray(parsed.questions)) {
    throw new Error('Invalid setup shape')
  }
  if (parsed.questions.length !== 5) throw new Error('Need 5 questions')
  return parsed
}

const SETUP_PROMPT = (domains: string[]) => `
You are a market analyst. From these domains, infer each brand's name and the product category they compete in, then write buying-intent questions a real buyer would type when looking for recommendations in that category. Questions must be natural and must NOT name any of the brands. Also write 3 specific, actionable recommendations a brand could follow to show up more often in AI answers for this category — specific, not generic. Return ONLY valid JSON.

DOMAINS:
${domains.map((d) => `- ${d}`).join('\n')}

Return ONLY valid JSON:
{
  "category": <product category string>,
  "brands": [
    { "domain": <domain>, "name": <brand name>, "aliases": [<name variants, domain root, shorthand>] }
  ],
  "questions": [<exactly 5 buying-intent question strings>],
  "recommendations": [<exactly 3 actionable strings>]
}
`

function buildTrackedBrands(
  setupBrands: SetupPayload['brands'],
  yourDomain: string,
  competitorDomains: string[]
): TrackedBrand[] {
  const allDomains = [yourDomain, ...competitorDomains]
  return allDomains.map((domain) => {
    const fromSetup = setupBrands.find((b) => normalizeDomain(b.domain) === domain)
    const name = fromSetup?.name ?? domain.split('.')[0] ?? domain
    const aliases = fromSetup?.aliases ?? []
    return {
      domain,
      name,
      aliases: [...aliases, name, domain.split('.')[0] ?? ''].filter(Boolean),
      is_you: domain === yourDomain,
    }
  })
}

function computeScores(
  brands: TrackedBrand[],
  answers: AnswerCallResult[],
  providersUsed: Provider[]
): { scores: BrandScore[]; answerRows: Map<string, Map<Provider, AnswerCallResult>> } {
  const successful = answers.filter((a) => a.ok && a.text.length > 0)
  const totalAnswers = successful.length

  const byQuestion = new Map<string, AnswerCallResult[]>()
  for (const a of successful) {
    const list = byQuestion.get(a.question) ?? []
    list.push(a)
    byQuestion.set(a.question, list)
  }

  const scores: BrandScore[] = brands.map((brand) => {
    let appearances = 0
    const by_provider = providersUsed.map((provider) => {
      const providerAnswers = successful.filter((a) => a.provider === provider)
      const total = providerAnswers.length
      const app = providerAnswers.filter((a) =>
        brandsMentionedInText(a.text, [brand]).includes(brand.name)
      ).length
      return {
        provider,
        appearances: app,
        total,
        share: total > 0 ? Math.round((app / total) * 100) : 0,
      }
    })

    for (const a of successful) {
      if (brandsMentionedInText(a.text, [brand]).includes(brand.name)) appearances++
    }

    return {
      name: brand.name,
      domain: brand.domain,
      is_you: brand.is_you,
      appearances,
      total_answers: totalAnswers,
      share_of_voice: totalAnswers > 0 ? Math.round((appearances / totalAnswers) * 100) : 0,
      rank: 0,
      by_provider,
    }
  })

  scores.sort((a, b) => b.share_of_voice - a.share_of_voice)
  scores.forEach((s, i) => {
    s.rank = i + 1
  })

  const answerRows = new Map<string, Map<Provider, AnswerCallResult>>()
  for (const [question, rows] of byQuestion) {
    const pmap = new Map<Provider, AnswerCallResult>()
    for (const r of rows) pmap.set(r.provider, r)
    answerRows.set(question, pmap)
  }

  return { scores, answerRows }
}

export async function POST(request: Request) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    return jsonScan({ ok: false, message: 'Service not configured. Please try again later.' }, 502)
  }

  let payload: { your_domain?: unknown; competitors?: unknown }
  try {
    payload = (await request.json()) as { your_domain?: unknown; competitors?: unknown }
  } catch {
    return jsonScan({ ok: false, message: 'Invalid request.' }, 422)
  }

  const rawYour = typeof payload.your_domain === 'string' ? payload.your_domain.trim() : ''
  if (!rawYour || !isValidDomain(rawYour)) {
    return jsonScan({ ok: false, message: 'Enter a valid domain for your brand.' }, 422)
  }

  const yourDomain = normalizeDomain(rawYour)
  const competitorDomains = parseCompetitorDomains(payload.competitors).filter(
    (d) => d !== yourDomain
  )

  for (const c of competitorDomains) {
    if (!isValidDomain(c)) {
      return jsonScan({ ok: false, message: 'Enter a valid domain for your brand.' }, 422)
    }
  }

  const allDomains = [yourDomain, ...competitorDomains]

  let setup: SetupPayload
  let setupTokensIn = 0
  let setupTokensOut = 0

  try {
    const anthropic = new Anthropic({ apiKey: anthropicKey })
    const setupMessage = await anthropic.messages.create({
      model: CLAUDE_SETUP_MODEL,
      max_tokens: 1500,
      messages: [{ role: 'user', content: SETUP_PROMPT(allDomains) }],
    })
    setupTokensIn = setupMessage.usage.input_tokens
    setupTokensOut = setupMessage.usage.output_tokens
    const block = setupMessage.content[0]
    const raw = block?.type === 'text' ? block.text : ''
    setup = parseSetupJson(raw)
  } catch {
    return jsonScan({ ok: false, message: 'Could not analyse this market. Please try again.' }, 500)
  }

  const brands = buildTrackedBrands(setup.brands, yourDomain, competitorDomains)
  const questions = setup.questions.slice(0, 5)

  const anthropic = new Anthropic({ apiKey: anthropicKey })
  const answerTasks: Promise<AnswerCallResult>[] = []

  const hasOpenAi = Boolean(process.env.OPENAI_API_KEY)
  const hasPerplexity = Boolean(process.env.PERPLEXITY_API_KEY)

  for (const question of questions) {
    answerTasks.push(askClaude(anthropic, question))
    if (hasOpenAi) answerTasks.push(askChatGpt(question))
    if (hasPerplexity) answerTasks.push(askPerplexity(question))
  }

  const settled = await Promise.allSettled(answerTasks)
  const answers: AnswerCallResult[] = settled
    .filter((r): r is PromiseFulfilledResult<AnswerCallResult> => r.status === 'fulfilled')
    .map((r) => r.value)

  const providersUsed = [...new Set(answers.filter((a) => a.ok).map((a) => a.provider))]

  if (providersUsed.length === 0) {
    return jsonScan({ ok: false, message: 'No AI providers responded. Please try again.' }, 502)
  }

  const { scores, answerRows } = computeScores(brands, answers, providersUsed)

  const yourScore = scores.find((s) => s.is_you)
  const competitors = scores.filter((s) => !s.is_you)
  const topCompetitor = competitors[0]

  const yourShare = yourScore?.share_of_voice ?? 0
  const yourRank = yourScore?.rank ?? scores.length
  const topName = topCompetitor?.name ?? 'A competitor'
  const topShare = topCompetitor?.share_of_voice ?? 0

  const yourBrand = yourScore?.name ?? yourDomain

  const free: ScanFree = {
    category: setup.category,
    your_brand: yourBrand,
    your_domain: yourDomain,
    providers_used: providersUsed,
    questions_count: questions.length,
    headline: {
      your_share: yourShare,
      your_rank: yourRank,
      total_brands: scores.length,
      top_competitor: topName,
      top_competitor_share: topShare,
    },
    scores,
  }

  const gatedQuestions = questions.map((question) => {
    const pmap = answerRows.get(question) ?? new Map()
    const by_provider = providersUsed.map((provider) => {
      const row = pmap.get(provider)
      const text = row?.text ?? ''
      const mentioned = text ? brandsMentionedInText(text, brands) : []
      return {
        provider,
        answer_excerpt: text ? excerpt(text) : '',
        brands_mentioned: mentioned,
      }
    })
    return { question, by_provider }
  })

  let answerTokensIn = 0
  let answerTokensOut = 0
  for (const a of answers) {
    answerTokensIn += a.tokens_in
    answerTokensOut += a.tokens_out
  }

  const gated: ScanGated = {
    questions: gatedQuestions,
    recommendations: (setup.recommendations ?? []).slice(0, 3),
    tokens_in: setupTokensIn + answerTokensIn,
    tokens_out: setupTokensOut + answerTokensOut,
  }

  const scanId = randomUUID()
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

  const record: SovScanRecord = {
    gated,
    lead_context: {
      your_domain: yourDomain,
      category: setup.category,
      your_share: yourShare,
      top_competitor: topName,
    },
    expires_at: expiresAt,
  }

  await saveSovScan(scanId, record)

  return jsonScan({ ok: true, scanId, free }, 200)
}

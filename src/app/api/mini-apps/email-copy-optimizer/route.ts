import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

import { calculateCost, type CostBreakdown, usageFromAnthropic } from '@/lib/llm/cost'
import { STYLE_SYSTEM_PROMPT } from '@/lib/llm/style'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 55

const TIMEOUT_MS = 55_000

type Severity = 'high' | 'medium' | 'low'

type EmailOptimizerInput = {
  subject: string
  body: string
  context?: {
    goal?: string
    audience?: string
    tone?: string
  }
}

type DiagnosisIssue = {
  label: string
  severity: Severity
  note: string
}

type VariationChange = {
  change: string
  reason: string
}

type EmailVariation = {
  name: string
  subject: string
  body: string
  changes: VariationChange[]
}

export type EmailCopyOptimizerResult = {
  diagnosis: {
    score: number
    issues: DiagnosisIssue[]
  }
  variations: [EmailVariation, EmailVariation, EmailVariation]
  tokens_in: number
  tokens_out: number
}

type SuccessResponse = { ok: true; data: EmailCopyOptimizerResult; cost?: CostBreakdown }
type ErrorResponse = { ok: false; message: string }
export type ApiResponse = SuccessResponse | ErrorResponse

function jsonResponse(body: ApiResponse, status: number) {
  return NextResponse.json(body, { status })
}

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim()
  const withoutStart = trimmed.replace(/^```(?:json)?\s*/i, '')
  return withoutStart.replace(/\s*```$/, '').trim()
}

function extractJsonObject(text: string): string | null {
  const cleaned = stripMarkdownFences(text)
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  return jsonMatch ? jsonMatch[0] : null
}

function toCleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function validateInput(payload: unknown): EmailOptimizerInput | null {
  if (!payload || typeof payload !== 'object') return null

  const raw = payload as { subject?: unknown; body?: unknown; context?: unknown }
  const subject = toCleanString(raw.subject)
  const body = toCleanString(raw.body)

  if (!subject || subject.length > 200) return null
  if (!body || body.length < 50 || body.length > 4000) return null

  const contextRaw = raw.context
  const context =
    contextRaw && typeof contextRaw === 'object'
      ? {
          goal: toCleanString((contextRaw as { goal?: unknown }).goal) || undefined,
          audience: toCleanString((contextRaw as { audience?: unknown }).audience) || undefined,
          tone: toCleanString((contextRaw as { tone?: unknown }).tone) || undefined,
        }
      : undefined

  return { subject, body, context }
}

function isSeverity(value: unknown): value is Severity {
  return value === 'high' || value === 'medium' || value === 'low'
}

function validateResultShape(data: unknown): EmailCopyOptimizerResult {
  if (!data || typeof data !== 'object') throw new Error('Invalid result root')

  const root = data as { diagnosis?: unknown; variations?: unknown }
  if (!root.diagnosis || typeof root.diagnosis !== 'object') throw new Error('Missing diagnosis')

  const diagnosisRaw = root.diagnosis as { score?: unknown; issues?: unknown }
  const score = typeof diagnosisRaw.score === 'number' ? Math.round(diagnosisRaw.score) : NaN
  if (!Number.isFinite(score) || score < 1 || score > 100) throw new Error('Invalid score')

  if (!Array.isArray(diagnosisRaw.issues)) throw new Error('Issues must be an array')
  const issues = diagnosisRaw.issues.slice(0, 5).map((issue) => {
    if (!issue || typeof issue !== 'object') throw new Error('Invalid issue')
    const issueRaw = issue as { label?: unknown; severity?: unknown; note?: unknown }
    const label = toCleanString(issueRaw.label)
    const note = toCleanString(issueRaw.note)
    if (!label || !note || !isSeverity(issueRaw.severity)) throw new Error('Invalid issue fields')
    return {
      label,
      severity: issueRaw.severity,
      note,
    } satisfies DiagnosisIssue
  })

  if (!Array.isArray(root.variations) || root.variations.length !== 3) {
    throw new Error('Must return exactly 3 variations')
  }

  const variations = root.variations.map((variation) => {
    if (!variation || typeof variation !== 'object') throw new Error('Invalid variation')
    const v = variation as {
      name?: unknown
      subject?: unknown
      body?: unknown
      changes?: unknown
    }
    const name = toCleanString(v.name)
    const subject = toCleanString(v.subject)
    const body = toCleanString(v.body)

    if (!name || !subject || !body) throw new Error('Variation fields are required')
    if (subject.length > 200) throw new Error('Variation subject too long')
    if (countWords(body) >= 120) throw new Error('Variation body must be under 120 words')

    if (!Array.isArray(v.changes) || v.changes.length === 0) throw new Error('Missing changes')
    const changes = v.changes.map((change) => {
      if (!change || typeof change !== 'object') throw new Error('Invalid change item')
      const c = change as { change?: unknown; reason?: unknown }
      const changeText = toCleanString(c.change)
      const reason = toCleanString(c.reason)
      if (!changeText || !reason) throw new Error('Invalid change fields')
      return { change: changeText, reason } satisfies VariationChange
    })

    return { name, subject, body, changes } satisfies EmailVariation
  }) as [EmailVariation, EmailVariation, EmailVariation]

  return {
    diagnosis: { score, issues },
    variations,
    tokens_in: 0,
    tokens_out: 0,
  }
}

function buildPrompt(input: EmailOptimizerInput): string {
  const ctxLines = [
    input.context?.goal ? `Goal: ${input.context.goal}` : null,
    input.context?.audience ? `Audience: ${input.context.audience}` : null,
    input.context?.tone ? `Preferred tone: ${input.context.tone}` : null,
  ].filter(Boolean)

  return [
    'You are an expert lifecycle email copywriter.',
    'Analyse and optimize the email below.',
    '',
    'EMAIL INPUT:',
    `Subject: ${input.subject}`,
    'Body:',
    input.body,
    '',
    ctxLines.length > 0 ? 'CONTEXT:' : '',
    ...ctxLines,
    '',
    'Return ONLY valid JSON in this exact format:',
    '{',
    '  "diagnosis": {',
    '    "score": <integer 1-100>,',
    '    "issues": [',
    '      { "label": <string>, "severity": <"high"|"medium"|"low">, "note": <string> }',
    '    ]',
    '  },',
    '  "variations": [',
    '    {',
    '      "name": <string>,',
    '      "subject": <string>,',
    '      "body": <string>,',
    '      "changes": [',
    '        { "change": <string>, "reason": <string> }',
    '      ]',
    '    }',
    '  ]',
    '}',
    '',
    'Rules:',
    '- Return exactly 3 variations.',
    '- Keep each variation body under 120 words.',
    '- Include exactly one clear CTA in each variation.',
    '- Avoid spam-trigger language and hype phrasing.',
    '- Preserve factual claims from the original email.',
    '- Each variation must use a different strategic angle.',
    '- Ignore signatures, disclaimers, and quoted thread history.',
    '- Match the same language as the input email.',
    '- Return at most 5 diagnosis issues.',
  ]
    .filter(Boolean)
    .join('\n')
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('TimeoutError')), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function POST(request: Request) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    return jsonResponse(
      { ok: false, message: 'Service is not configured yet. Please try again later.' },
      502
    )
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonResponse({ ok: false, message: 'Invalid request payload.' }, 422)
  }

  const input = validateInput(payload)
  if (!input) {
    return jsonResponse(
      {
        ok: false,
        message: 'Please provide a valid subject and body (body must be 50-4000 characters).',
      },
      422
    )
  }

  const anthropic = new Anthropic({ apiKey: anthropicKey })
  const basePrompt = buildPrompt(input)

  try {
    const firstAttempt = await withTimeout(
      anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        system: STYLE_SYSTEM_PROMPT,
        max_tokens: 1800,
        messages: [{ role: 'user', content: basePrompt }],
      }),
      TIMEOUT_MS
    )

    const firstText = firstAttempt.content[0]?.type === 'text' ? firstAttempt.content[0].text : ''
    let parsedJson = extractJsonObject(firstText)
    let parsed: EmailCopyOptimizerResult | null = null
    let finalMessage = firstAttempt

    if (parsedJson) {
      try {
        parsed = validateResultShape(JSON.parse(parsedJson))
      } catch {
        parsed = null
      }
    }

    if (!parsed) {
      const retryAttempt = await withTimeout(
        anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          system: STYLE_SYSTEM_PROMPT,
          max_tokens: 1800,
          messages: [
            {
              role: 'user',
              content: [
                basePrompt,
                '',
                'Your previous output failed JSON validation.',
                'Return the corrected JSON only, no markdown fences, no explanation.',
                '',
                'Previous output:',
                firstText.slice(0, 8000),
              ].join('\n'),
            },
          ],
        }),
        TIMEOUT_MS
      )

      finalMessage = retryAttempt
      const retryText = retryAttempt.content[0]?.type === 'text' ? retryAttempt.content[0].text : ''
      parsedJson = extractJsonObject(retryText)
      if (!parsedJson) {
        return jsonResponse(
          {
            ok: false,
            message:
              'We hit a formatting issue while optimizing your email. Please try again in a moment.',
          },
          500
        )
      }
      parsed = validateResultShape(JSON.parse(parsedJson))
    }

    parsed.tokens_in = finalMessage.usage.input_tokens
    parsed.tokens_out = finalMessage.usage.output_tokens

    const cost = calculateCost(usageFromAnthropic(finalMessage))
    return jsonResponse({ ok: true, data: parsed, cost }, 200)
  } catch (err) {
    const isTimeout = err instanceof Error && err.message === 'TimeoutError'
    return jsonResponse(
      {
        ok: false,
        message: isTimeout
          ? 'This request took too long. Please try again with a shorter email.'
          : 'Something went wrong while optimizing your copy. Please try again.',
      },
      500
    )
  }
}

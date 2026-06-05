import Anthropic from '@anthropic-ai/sdk'
import { STYLE_SYSTEM_PROMPT } from '@/lib/llm/style'
import { NextResponse } from 'next/server'

import { calculateCost, type CostBreakdown, usageFromAnthropic } from '@/lib/llm/cost'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export type IssueSeverity = 'critical' | 'warning' | 'suggestion'

export type FieldIssue = {
  field: string
  value: string
  issue: string
  severity: IssueSeverity
  fix: string
}

export type SanityResult = {
  record_type: string
  quality_score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  summary: string
  issues: FieldIssue[]
  clean_fields: string[]
  duplicate_risk: 'high' | 'medium' | 'low' | 'none'
  duplicate_reason: string
  tokens_in: number
  tokens_out: number
}

type SuccessResponse = { ok: true; data: SanityResult; cost?: CostBreakdown }
type ErrorResponse = { ok: false; message: string }
export type ApiResponse = SuccessResponse | ErrorResponse

const CLAUDE_PROMPT = (recordText: string) => `
You are a CRM data quality expert. Analyse the following CRM record data and return a structured sanity check report.

CRM RECORD:
${recordText.slice(0, 6000)}

Return ONLY valid JSON in this exact shape — no markdown, no explanation:
{
  "record_type": <what type of CRM record this appears to be, e.g. "Contact", "Account", "Lead", "Deal", "Opportunity">,
  "quality_score": <integer 0-100, overall data quality score>,
  "grade": <"A" | "B" | "C" | "D" | "F" based on score: A=90+, B=75-89, C=55-74, D=35-54, F=0-34>,
  "summary": <2-3 sentence summary of the record's overall data quality and the most important issues to fix>,
  "issues": [
    {
      "field": <field name>,
      "value": <the current value, or "empty" if missing>,
      "issue": <concise description of the problem>,
      "severity": <"critical" | "warning" | "suggestion">,
      "fix": <specific actionable fix — what the value should be or how to correct it>
    }
  ],
  "clean_fields": <array of field names that look correct and complete>,
  "duplicate_risk": <"high" | "medium" | "low" | "none">,
  "duplicate_reason": <1 sentence explaining why there may or may not be a duplicate risk — e.g. generic email domain, common name, missing unique identifiers>
}

Severity guide:
- critical: missing required field, obviously wrong format (e.g. phone in email field), data that would break automation
- warning: incomplete, inconsistent capitalisation, suspicious value, format mismatch
- suggestion: enrichment opportunity, best-practice improvement, optional but useful

Rules:
- Only flag real issues — don't invent problems if the data looks fine.
- If a field is empty or missing, that is always at least a warning.
- Check email format, phone format, URL format, name capitalisation, company name consistency.
- clean_fields should list fields that have no issues at all.
- If fewer than 3 issues exist, that is fine — quality is high.
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

  let payload: { record_text?: unknown }
  try {
    payload = (await request.json()) as { record_text?: unknown }
  } catch {
    return jsonResponse({ ok: false, message: 'Invalid request.' }, 422)
  }

  const recordText = typeof payload.record_text === 'string' ? payload.record_text.trim() : ''

  if (!recordText) {
    return jsonResponse({ ok: false, message: 'Paste your CRM record data.' }, 422)
  }
  if (recordText.length < 20) {
    return jsonResponse({ ok: false, message: 'Record too short. Paste the full field data.' }, 422)
  }

  try {
    const anthropic = new Anthropic({ apiKey: anthropicKey })

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      system: STYLE_SYSTEM_PROMPT,
      max_tokens: 1600,
      messages: [{ role: 'user', content: CLAUDE_PROMPT(recordText) }],
    })

    const firstBlock = message.content[0]
    const rawText = firstBlock?.type === 'text' ? firstBlock.text : ''

    let parsed: SanityResult
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found')
      parsed = JSON.parse(jsonMatch[0]) as SanityResult
      parsed.tokens_in = message.usage.input_tokens
      parsed.tokens_out = message.usage.output_tokens
    } catch {
      return jsonResponse({ ok: false, message: 'Analysis failed. Please try again.' }, 502)
    }

    const cost = calculateCost(usageFromAnthropic(message))
    return jsonResponse({ ok: true, data: parsed, cost }, 200)
  } catch {
    return jsonResponse({ ok: false, message: 'Something went wrong. Please try again.' }, 502)
  }
}

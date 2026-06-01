import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 55

const MIN_PROCESS_CHARS = 25

export type BlueprintStep = {
  step: number
  title: string
  description: string
  tool: string
  action_type: 'trigger' | 'action' | 'transform' | 'filter' | 'output'
  automatable: boolean
}

export type ToolOption = {
  name: 'Make' | 'n8n' | 'Zapier'
  fit_score: number
  why: string
  best_for: string
  pricing_note: string
}

export type BlueprintResult = {
  process_name: string
  one_liner: string
  current_state: {
    steps_count: number
    time_per_run: string
    frequency: string
    time_saved_per_week: string
    time_saved_per_year: string
  }
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  difficulty_score: number
  recommended_tool: 'Make' | 'n8n' | 'Zapier'
  tool_options: ToolOption[]
  steps: BlueprintStep[]
  mermaid: string
  starter_config: {
    platform: 'make' | 'n8n'
    json: string
    note: string
  }
  gotchas: string[]
  tokens_in: number
  tokens_out: number
}

type SuccessResponse = { ok: true; data: BlueprintResult }
type ErrorResponse = { ok: false; message: string }
export type ApiResponse = SuccessResponse | ErrorResponse

const CLAUDE_PROMPT = (processText: string) => `
You are a senior automation engineer who has shipped hundreds of Make, n8n, and Zapier workflows. Turn the user's plain-English manual process into a concrete automation blueprint. Be specific: name the actual triggers, apps, and steps — no generic "connect your tools" filler. Pick the recommended tool based on this exact process and justify it honestly, including where a cheaper or simpler option would do. Time-saved estimates must be realistic, never inflated. Every gotcha must be specific to this workflow. The mermaid field must be a valid flowchart that renders without edits. Return ONLY valid JSON.

MANUAL PROCESS:
${processText.slice(0, 8000)}

Return ONLY valid JSON in this exact shape — no markdown, no explanation:
{
  "process_name": <short name for the workflow>,
  "one_liner": <memorable summary e.g. "Your Monday CSV ritual, gone">,
  "current_state": {
    "steps_count": <integer manual steps today>,
    "time_per_run": <e.g. "45 min">,
    "frequency": <e.g. "Weekly">,
    "time_saved_per_week": <e.g. "3 hrs">,
    "time_saved_per_year": <e.g. "~150 hrs">
  },
  "difficulty": <"Beginner" | "Intermediate" | "Advanced">,
  "difficulty_score": <integer 1-10>,
  "recommended_tool": <"Make" | "n8n" | "Zapier">,
  "tool_options": [
    {
      "name": "Make",
      "fit_score": <0-10>,
      "why": <1-2 sentences specific to this process>,
      "best_for": <short phrase>,
      "pricing_note": <short honest note>
    },
    {
      "name": "n8n",
      "fit_score": <0-10>,
      "why": <1-2 sentences>,
      "best_for": <short phrase>,
      "pricing_note": <short honest note>
    },
    {
      "name": "Zapier",
      "fit_score": <0-10>,
      "why": <1-2 sentences>,
      "best_for": <short phrase>,
      "pricing_note": <short honest note>
    }
  ],
  "steps": [
    {
      "step": <1-based number>,
      "title": <step title>,
      "description": <what happens>,
      "tool": <tool for this step>,
      "action_type": <"trigger" | "action" | "transform" | "filter" | "output">,
      "automatable": <true if fully automatable, false if human required>
    }
  ],
  "mermaid": <valid Mermaid flowchart string>,
  "starter_config": {
    "platform": <"make" | "n8n" — match recommended_tool where possible>,
    "json": <stringified JSON scaffold as a single escaped string>,
    "note": <one line explaining this is a scaffold, not import-ready>
  },
  "gotchas": [<exactly 3 specific watch-outs>]
}

Mermaid rules:
- Output a valid Mermaid flowchart. Use "graph LR" for 6 steps or fewer, "graph TD" for more than 6.
- Wrap every node label in double quotes.
- Do not use parentheses, colons, or special characters inside labels — they break parsing.
- Use [ ] for the trigger node, ( ) for actions, and { } for any decision/filter.
- One arrow per relationship, e.g. n1 --> n2. Keep node ids short (n1, n2, n3).

Rules:
- tool_options must be exactly 3 entries: Make, n8n, Zapier in that order.
- steps must cover the full process in order.
- recommended_tool must match one of the tool_options names.
`

function jsonResponse(body: ApiResponse, status: number) {
  return NextResponse.json(body, { status })
}

function parseClaudeJson(rawText: string): BlueprintResult {
  const stripped = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()
  const jsonMatch = stripped.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found')
  return JSON.parse(jsonMatch[0]) as BlueprintResult
}

export async function POST(request: Request) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  if (!anthropicKey) {
    return jsonResponse(
      { ok: false, message: 'Service not configured. Please try again later.' },
      502
    )
  }

  let payload: { process?: unknown }
  try {
    payload = (await request.json()) as { process?: unknown }
  } catch {
    return jsonResponse({ ok: false, message: 'Invalid request.' }, 422)
  }

  const processText = typeof payload.process === 'string' ? payload.process.trim() : ''

  if (!processText || processText.length < MIN_PROCESS_CHARS) {
    return jsonResponse(
      {
        ok: false,
        message: 'Describe the process in a bit more detail so we can map it.',
      },
      422
    )
  }

  try {
    const anthropic = new Anthropic({ apiKey: anthropicKey })
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: CLAUDE_PROMPT(processText) }],
    })

    const firstBlock = message.content[0]
    const rawText = firstBlock?.type === 'text' ? firstBlock.text : ''

    let parsed: BlueprintResult
    try {
      parsed = parseClaudeJson(rawText)
      parsed.tokens_in = message.usage.input_tokens
      parsed.tokens_out = message.usage.output_tokens
    } catch {
      return jsonResponse(
        { ok: false, message: 'Blueprint generation failed. Please try again.' },
        500
      )
    }

    return jsonResponse({ ok: true, data: parsed }, 200)
  } catch {
    return jsonResponse({ ok: false, message: 'Something went wrong. Please try again.' }, 502)
  }
}

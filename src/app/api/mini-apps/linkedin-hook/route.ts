import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

import { calculateCost, type CostBreakdown, usageFromAnthropic } from '@/lib/llm/cost'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export type Hook = {
  angle: string
  opening_line: string
  follow_up: string
  channel: 'linkedin-dm' | 'email' | 'cold-call'
  tone: 'direct' | 'curious' | 'complimentary' | 'challenger'
}

export type HookResult = {
  post_author: string
  post_summary: string
  trigger: string
  trigger_type: 'opinion' | 'achievement' | 'pain' | 'insight' | 'news' | 'question'
  target_persona: string
  hooks: Hook[]
  best_hook_index: number
  tokens_in: number
  tokens_out: number
}

type SuccessResponse = { ok: true; data: HookResult; cost?: CostBreakdown }
type ErrorResponse = { ok: false; message: string }
export type ApiResponse = SuccessResponse | ErrorResponse

const CLAUDE_PROMPT = (postText: string) => `
You are a world-class B2B outbound copywriter. A sales rep has shared a LinkedIn post they want to use as an outbound trigger.

LINKEDIN POST:
${postText.slice(0, 6000)}

Analyse the post and return ONLY valid JSON in this exact shape — no markdown, no explanation:
{
  "post_author": <name or "Unknown" if not determinable>,
  "post_summary": <1 sentence capturing what the post is actually about>,
  "trigger": <the specific thing in the post that makes this a good outbound moment — be precise>,
  "trigger_type": <"opinion" | "achievement" | "pain" | "insight" | "news" | "question">,
  "target_persona": <job title of the ideal person to reach out to based on this post>,
  "hooks": [
    {
      "angle": <the strategic angle this hook takes — e.g. "Challenge their assumption", "Validate and pivot">,
      "opening_line": <a compelling, personalised first line referencing the post — max 2 sentences, no fluff>,
      "follow_up": <1-2 sentence follow-up that connects their post to a specific value prop or problem you solve>,
      "channel": <"linkedin-dm" | "email" | "cold-call">,
      "tone": <"direct" | "curious" | "complimentary" | "challenger">
    }
  ],
  "best_hook_index": <0-based index of the hook most likely to get a reply>
}

Rules:
- Generate exactly 3 hooks with different tones and channels.
- The opening_line must reference something SPECIFIC from the post — never generic.
- No mention of "I came across your post" — that's banned. Be more creative.
- Keep each opening_line under 40 words.
- The follow_up should connect naturally without sounding like a pitch.
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

  let payload: { post_text?: unknown }
  try {
    payload = (await request.json()) as { post_text?: unknown }
  } catch {
    return jsonResponse({ ok: false, message: 'Invalid request.' }, 422)
  }

  const postText = typeof payload.post_text === 'string' ? payload.post_text.trim() : ''

  if (!postText) {
    return jsonResponse({ ok: false, message: 'Post text is required.' }, 422)
  }
  if (postText.length < 30) {
    return jsonResponse(
      { ok: false, message: 'Post is too short to analyse. Paste the full text.' },
      422
    )
  }

  try {
    const anthropic = new Anthropic({ apiKey: anthropicKey })

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1800,
      messages: [{ role: 'user', content: CLAUDE_PROMPT(postText) }],
    })

    const firstBlock = message.content[0]
    const rawText = firstBlock?.type === 'text' ? firstBlock.text : ''

    let parsed: HookResult
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found')
      parsed = JSON.parse(jsonMatch[0]) as HookResult
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

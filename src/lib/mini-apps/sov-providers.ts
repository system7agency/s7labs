import Anthropic from '@anthropic-ai/sdk'

export const CLAUDE_SETUP_MODEL = 'claude-opus-4-5'
export const CLAUDE_ANSWER_MODEL = 'claude-haiku-4-5'
export const OPENAI_ANSWER_MODEL = 'gpt-4o-mini'
export const PERPLEXITY_ANSWER_MODEL = 'sonar'

export type Provider = 'claude' | 'chatgpt' | 'perplexity'

const BUYER_ANSWER_PROMPT = (question: string) =>
  `A buyer asked: "${question}"

Answer as a helpful assistant recommending specific products, platforms, or companies they should evaluate. Name real brands. Be concise but concrete. Do not ask follow-up questions.`

export type AnswerCallResult = {
  provider: Provider
  question: string
  ok: boolean
  text: string
  tokens_in: number
  tokens_out: number
}

export async function askClaude(anthropic: Anthropic, question: string): Promise<AnswerCallResult> {
  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_ANSWER_MODEL,
      max_tokens: 600,
      messages: [{ role: 'user', content: BUYER_ANSWER_PROMPT(question) }],
    })
    const block = message.content[0]
    const text = block?.type === 'text' ? block.text : ''
    return {
      provider: 'claude',
      question,
      ok: text.length > 0,
      text,
      tokens_in: message.usage.input_tokens,
      tokens_out: message.usage.output_tokens,
    }
  } catch {
    return { provider: 'claude', question, ok: false, text: '', tokens_in: 0, tokens_out: 0 }
  }
}

export async function askChatGpt(question: string): Promise<AnswerCallResult> {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    return { provider: 'chatgpt', question, ok: false, text: '', tokens_in: 0, tokens_out: 0 }
  }
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: OPENAI_ANSWER_MODEL,
        max_tokens: 600,
        messages: [{ role: 'user', content: BUYER_ANSWER_PROMPT(question) }],
      }),
      cache: 'no-store',
    })
    if (!res.ok) {
      return { provider: 'chatgpt', question, ok: false, text: '', tokens_in: 0, tokens_out: 0 }
    }
    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
      usage?: { prompt_tokens?: number; completion_tokens?: number }
    }
    const text = body.choices?.[0]?.message?.content ?? ''
    return {
      provider: 'chatgpt',
      question,
      ok: text.length > 0,
      text,
      tokens_in: body.usage?.prompt_tokens ?? 0,
      tokens_out: body.usage?.completion_tokens ?? 0,
    }
  } catch {
    return { provider: 'chatgpt', question, ok: false, text: '', tokens_in: 0, tokens_out: 0 }
  }
}

export async function askPerplexity(question: string): Promise<AnswerCallResult> {
  const key = process.env.PERPLEXITY_API_KEY
  if (!key) {
    return { provider: 'perplexity', question, ok: false, text: '', tokens_in: 0, tokens_out: 0 }
  }
  try {
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: PERPLEXITY_ANSWER_MODEL,
        max_tokens: 600,
        messages: [{ role: 'user', content: BUYER_ANSWER_PROMPT(question) }],
      }),
      cache: 'no-store',
    })
    if (!res.ok) {
      return { provider: 'perplexity', question, ok: false, text: '', tokens_in: 0, tokens_out: 0 }
    }
    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
      usage?: { prompt_tokens?: number; completion_tokens?: number }
    }
    const text = body.choices?.[0]?.message?.content ?? ''
    return {
      provider: 'perplexity',
      question,
      ok: text.length > 0,
      text,
      tokens_in: body.usage?.prompt_tokens ?? 0,
      tokens_out: body.usage?.completion_tokens ?? 0,
    }
  } catch {
    return { provider: 'perplexity', question, ok: false, text: '', tokens_in: 0, tokens_out: 0 }
  }
}

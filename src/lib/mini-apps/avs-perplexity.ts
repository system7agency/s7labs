import { PERPLEXITY_ANSWER_MODEL } from '@/lib/mini-apps/sov-providers'
import { normalizeDomain } from '@/lib/mini-apps/normalize-domain'

export type PerplexityAnswer = {
  ok: boolean
  text: string
  brand_cited: boolean
  cited_domains: string[]
  tokens_in: number
  tokens_out: number
}

function domainsFromUrls(urls: string[]): string[] {
  const out: string[] = []
  for (const u of urls) {
    try {
      const host = new URL(u).hostname.replace(/^www\./, '').toLowerCase()
      if (host && !out.includes(host)) out.push(host)
    } catch {
      /* skip */
    }
  }
  return out
}

export async function askPerplexityWithCitations(
  question: string,
  trackedDomain: string
): Promise<PerplexityAnswer> {
  const key = process.env.PERPLEXITY_API_KEY
  if (!key) {
    return {
      ok: false,
      text: '',
      brand_cited: false,
      cited_domains: [],
      tokens_in: 0,
      tokens_out: 0,
    }
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
        messages: [{ role: 'user', content: question }],
      }),
      cache: 'no-store',
    })
    if (!res.ok) {
      return {
        ok: false,
        text: '',
        brand_cited: false,
        cited_domains: [],
        tokens_in: 0,
        tokens_out: 0,
      }
    }
    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
      citations?: string[]
      usage?: { prompt_tokens?: number; completion_tokens?: number }
    }
    const text = body.choices?.[0]?.message?.content ?? ''
    const cited_domains = domainsFromUrls(body.citations ?? [])
    const brand_cited = cited_domains.some((d) => normalizeDomain(d) === trackedDomain)
    return {
      ok: text.length > 0,
      text,
      brand_cited,
      cited_domains,
      tokens_in: body.usage?.prompt_tokens ?? 0,
      tokens_out: body.usage?.completion_tokens ?? 0,
    }
  } catch {
    return {
      ok: false,
      text: '',
      brand_cited: false,
      cited_domains: [],
      tokens_in: 0,
      tokens_out: 0,
    }
  }
}

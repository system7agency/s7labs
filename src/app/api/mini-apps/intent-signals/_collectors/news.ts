import { FirecrawlAppV1 as FirecrawlApp } from '@mendable/firecrawl-js'

import type { CollectorSignal } from './index'

function pickNewsLinks(markdown: string): Array<{ title: string; url: string }> {
  const links = Array.from(markdown.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/gi))
    .map((match) => ({
      title: match[1]?.trim() ?? '',
      url: match[2]?.trim() ?? '',
    }))
    .filter((link) => link.title.length >= 24 && link.url.length > 0)

  const deduped: Array<{ title: string; url: string }> = []
  const seen = new Set<string>()
  for (const link of links) {
    if (seen.has(link.url)) continue
    seen.add(link.url)
    deduped.push(link)
    if (deduped.length >= 4) break
  }
  return deduped
}

export async function collectNewsSignals(domain: string): Promise<CollectorSignal[]> {
  const firecrawlKey = process.env.FIRECRAWL_API_KEY
  if (!firecrawlKey) return []

  const firecrawl = new FirecrawlApp({ apiKey: firecrawlKey })
  const queryUrl = `https://news.google.com/search?q=${encodeURIComponent(domain)}`
  const now = new Date().toISOString()

  const result = await firecrawl.scrapeUrl(queryUrl, { formats: ['markdown'] }).catch(() => null)
  if (!result || !result.success || !result.markdown) return []

  return pickNewsLinks(result.markdown).map((item) => ({
    type: 'news',
    headline: item.title,
    detail: 'Mention appears in recent search/news results tied to this domain.',
    source: 'News search',
    sourceUrl: item.url,
    observedAt: now,
  }))
}

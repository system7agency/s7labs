import { FirecrawlAppV1 as FirecrawlApp } from '@mendable/firecrawl-js'

import type { CollectorSignal } from './index'

const CAREER_PATHS = ['/careers', '/jobs', '/company/careers']
const HIRING_MARKERS = [
  "we're hiring",
  'we are hiring',
  'open positions',
  'job openings',
  'join our team',
  'careers',
]

function cleanSnippet(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/^[-*#>\s]+/, '')
    .trim()
}

function extractHiringSnippet(markdown: string): string | null {
  const lines = markdown.split('\n').map((line) => cleanSnippet(line))
  for (const line of lines) {
    const lower = line.toLowerCase()
    if (line.length < 24) continue
    if (HIRING_MARKERS.some((marker) => lower.includes(marker))) {
      return line.slice(0, 220)
    }
  }
  return null
}

export async function collectHiringSignals(domain: string): Promise<CollectorSignal[]> {
  const firecrawlKey = process.env.FIRECRAWL_API_KEY
  if (!firecrawlKey) return []

  const firecrawl = new FirecrawlApp({ apiKey: firecrawlKey })
  const root = `https://${domain}`
  const urls = [root, ...CAREER_PATHS.map((path) => `${root}${path}`)]
  const now = new Date().toISOString()

  const settled = await Promise.allSettled(
    urls.map((url) => firecrawl.scrapeUrl(url, { formats: ['markdown'] }))
  )

  const signals: CollectorSignal[] = []
  settled.forEach((result, index) => {
    if (result.status !== 'fulfilled' || !result.value.success || !result.value.markdown) return
    const snippet = extractHiringSnippet(result.value.markdown)
    if (!snippet) return
    const sourceUrl = urls[index] ?? root
    signals.push({
      type: 'hiring',
      headline:
        sourceUrl === root ? 'Hiring language detected on homepage' : 'Active hiring page detected',
      detail: snippet,
      source: sourceUrl === root ? 'Website homepage' : 'Careers page',
      sourceUrl,
      observedAt: now,
    })
  })

  return signals.slice(0, 3)
}

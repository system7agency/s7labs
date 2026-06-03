import { FirecrawlAppV1 as FirecrawlApp } from '@mendable/firecrawl-js'

export type EntitySignals = {
  has_org_schema: boolean
  has_same_as: boolean
  has_product_schema: boolean
  has_og_tags: boolean
  structured_score: number
  markdown_snippet: string
}

function parseJsonLdBlocks(htmlOrMd: string): unknown[] {
  const blocks: unknown[] = []
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(htmlOrMd)) !== null) {
    try {
      blocks.push(JSON.parse(m[1] ?? '{}'))
    } catch {
      /* skip */
    }
  }
  const mdRe = /```json\s*([\s\S]*?)```/gi
  while ((m = mdRe.exec(htmlOrMd)) !== null) {
    try {
      blocks.push(JSON.parse(m[1] ?? '{}'))
    } catch {
      /* skip */
    }
  }
  return blocks
}

function walkJsonLd(node: unknown, hits: EntitySignals): void {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const item of node) walkJsonLd(item, hits)
    return
  }
  const obj = node as Record<string, unknown>
  const type = String(obj['@type'] ?? '')
  const types = type.split(',').map((t) => t.trim().toLowerCase())
  if (types.includes('organization') || types.includes('corporation')) hits.has_org_schema = true
  if (types.includes('product')) hits.has_product_schema = true
  if (obj.sameAs) hits.has_same_as = true
  for (const v of Object.values(obj)) walkJsonLd(v, hits)
}

export function scoreStructuredSignals(raw: string): EntitySignals {
  const hits: EntitySignals = {
    has_org_schema: false,
    has_same_as: false,
    has_product_schema: false,
    has_og_tags: /og:title|og:description|property=["']og:/i.test(raw),
    structured_score: 0,
    markdown_snippet: raw.slice(0, 8000),
  }
  for (const block of parseJsonLdBlocks(raw)) walkJsonLd(block, hits)
  let pts = 0
  if (hits.has_org_schema) pts += 35
  if (hits.has_same_as) pts += 25
  if (hits.has_product_schema) pts += 20
  if (hits.has_og_tags) pts += 20
  hits.structured_score = Math.min(100, pts)
  return hits
}

export async function scrapeEntitySignals(
  domain: string,
  signal: AbortSignal
): Promise<EntitySignals> {
  const key = process.env.FIRECRAWL_API_KEY
  const url = `https://${domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}`
  if (!key) {
    return scoreStructuredSignals('')
  }
  try {
    const app = new FirecrawlApp({ apiKey: key })
    const result = await app.scrapeUrl(url, { formats: ['markdown', 'html'] })
    if (signal.aborted) return scoreStructuredSignals('')
    if (!result.success) return scoreStructuredSignals('')
    const md = result.markdown ?? ''
    const html = result.html ?? ''
    return scoreStructuredSignals(`${md}\n${html}`)
  } catch {
    return scoreStructuredSignals('')
  }
}

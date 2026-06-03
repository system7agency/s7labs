const AI_BOT_PATTERNS = [
  'gptbot',
  'chatgpt-user',
  'claudebot',
  'claude-web',
  'anthropic-ai',
  'perplexitybot',
  'google-extended',
  'ccbot',
  'bytespider',
  'cohere-ai',
]

export type AgenticSignals = {
  robots: {
    exists: boolean
    blocks_ai_bots: boolean
    blocked_agents: string[]
    excerpt: string
  }
  structured_data: {
    present: boolean
    types: string[]
    block_count: number
  }
  meta: {
    has_description: boolean
    has_og_title: boolean
    has_og_description: boolean
  }
  headings: {
    h1_count: number
    h2_count: number
    single_h1: boolean
    h1_text: string | null
  }
  render: {
    html_body_text_length: number
    markdown_length: number
    likely_js_only: boolean
  }
  content: {
    has_pricing_signals: boolean
    has_contact_signals: boolean
    has_product_signals: boolean
  }
  images: {
    total: number
    with_alt: number
    alt_coverage_ratio: number
  }
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractJsonLdTypes(html: string): string[] {
  const types = new Set<string>()
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1] ?? '') as unknown
      const collect = (node: unknown) => {
        if (!node || typeof node !== 'object') return
        if (Array.isArray(node)) {
          node.forEach(collect)
          return
        }
        const obj = node as Record<string, unknown>
        if (typeof obj['@type'] === 'string') types.add(obj['@type'])
        if (Array.isArray(obj['@type'])) {
          obj['@type'].forEach((t) => {
            if (typeof t === 'string') types.add(t)
          })
        }
        if (obj['@graph']) collect(obj['@graph'])
        Object.values(obj).forEach(collect)
      }
      collect(parsed)
    } catch {
      // skip invalid JSON-LD blocks
    }
  }
  return [...types]
}

function parseRobotsTxt(text: string): { blocks_ai_bots: boolean; blocked_agents: string[] } {
  const blocked: string[] = []
  const lines = text.split(/\r?\n/)
  let currentAgents: string[] = []
  let disallowAll = false

  const flush = () => {
    if (!disallowAll) return
    for (const agent of currentAgents) {
      const lower = agent.toLowerCase()
      if (AI_BOT_PATTERNS.some((p) => lower.includes(p) || lower === '*')) {
        blocked.push(agent)
      }
    }
    currentAgents = []
    disallowAll = false
  }

  for (const raw of lines) {
    const line = raw.split('#')[0]?.trim() ?? ''
    if (!line) {
      flush()
      continue
    }
    const ua = line.match(/^user-agent:\s*(.+)$/i)
    if (ua) {
      flush()
      currentAgents.push(ua[1]?.trim() ?? '')
      continue
    }
    const dis = line.match(/^disallow:\s*(.*)$/i)
    if (dis) {
      const path = (dis[1] ?? '').trim()
      if (path === '/' || path === '/*') disallowAll = true
    }
  }
  flush()

  const unique = [...new Set(blocked)]
  return { blocks_ai_bots: unique.length > 0, blocked_agents: unique }
}

function countMatches(html: string, pattern: RegExp): number {
  return [...html.matchAll(pattern)].length
}

function hasSignal(text: string, patterns: RegExp[]): boolean {
  const lower = text.toLowerCase()
  return patterns.some((p) => p.test(lower))
}

export function buildAgenticSignals(
  html: string,
  markdown: string,
  robotsText: string | null
): AgenticSignals {
  const bodyText = stripHtmlToText(html)
  const combined = `${bodyText} ${markdown}`.toLowerCase()

  const types = extractJsonLdTypes(html)
  const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)]
  const h1Texts = h1Matches.map((m) => stripHtmlToText(m[1] ?? '')).filter(Boolean)

  const imgTags = [...html.matchAll(/<img\b[^>]*>/gi)]
  let withAlt = 0
  for (const tag of imgTags) {
    if (/\balt=["'][^"']+["']/i.test(tag[0] ?? '')) withAlt++
  }
  const totalImages = imgTags.length

  const robots =
    robotsText && robotsText.trim().length > 0
      ? {
          exists: true,
          ...parseRobotsTxt(robotsText),
          excerpt: robotsText.slice(0, 1200),
        }
      : {
          exists: false,
          blocks_ai_bots: false,
          blocked_agents: [] as string[],
          excerpt: '',
        }

  const metaDesc =
    /<meta[^>]+name=["']description["'][^>]+content=["'][^"']+["']/i.test(html) ||
    /<meta[^>]+content=["'][^"']+["'][^>]+name=["']description["']/i.test(html)

  const likelyJsOnly = bodyText.length < 400 && markdown.length > 800 && types.length === 0

  return {
    robots: {
      exists: robots.exists,
      blocks_ai_bots: robots.blocks_ai_bots,
      blocked_agents: robots.blocked_agents,
      excerpt: robots.excerpt,
    },
    structured_data: {
      present: types.length > 0,
      types,
      block_count: countMatches(html, /<script[^>]*type=["']application\/ld\+json["']/gi),
    },
    meta: {
      has_description: metaDesc,
      has_og_title: /<meta[^>]+property=["']og:title["']/i.test(html),
      has_og_description: /<meta[^>]+property=["']og:description["']/i.test(html),
    },
    headings: {
      h1_count: h1Matches.length,
      h2_count: countMatches(html, /<h2\b/gi),
      single_h1: h1Matches.length === 1,
      h1_text: h1Texts[0] ?? null,
    },
    render: {
      html_body_text_length: bodyText.length,
      markdown_length: markdown.length,
      likely_js_only: likelyJsOnly,
    },
    content: {
      has_pricing_signals: hasSignal(combined, [
        /\bpricing\b/,
        /\bprice\b/,
        /\bplans\b/,
        /\bper month\b/,
        /\b\/mo\b/,
      ]),
      has_contact_signals: hasSignal(combined, [
        /\bcontact\b/,
        /\bemail\b/,
        /\bphone\b/,
        /\bbook a demo\b/,
        /\bget in touch\b/,
      ]),
      has_product_signals: hasSignal(combined, [
        /\bproduct\b/,
        /\bplatform\b/,
        /\bfeatures\b/,
        /\bsolution\b/,
        /\bwe help\b/,
      ]),
    },
    images: {
      total: totalImages,
      with_alt: withAlt,
      alt_coverage_ratio: totalImages > 0 ? Math.round((withAlt / totalImages) * 100) / 100 : 1,
    },
  }
}

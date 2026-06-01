const DOMAIN_RE = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}/i

export function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./, '')
}

export function isValidDomain(input: string): boolean {
  const bare = normalizeDomain(input)
  return bare.length > 0 && DOMAIN_RE.test(bare)
}

export function parseCompetitorDomains(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of raw) {
    if (typeof item !== 'string') continue
    const d = normalizeDomain(item)
    if (!d || !isValidDomain(d) || seen.has(d)) continue
    seen.add(d)
    out.push(d)
    if (out.length >= 3) break
  }
  return out
}

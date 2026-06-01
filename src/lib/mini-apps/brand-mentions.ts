export type TrackedBrand = {
  domain: string
  name: string
  aliases: string[]
  is_you: boolean
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function brandsMentionedInText(text: string, brands: TrackedBrand[]): string[] {
  const mentioned: string[] = []
  for (const brand of brands) {
    const terms = [brand.name, ...brand.aliases, brand.domain.replace(/^www\./, '')]
    const root = brand.domain.split('.')[0]
    if (root && root.length > 2) terms.push(root)

    const unique = [...new Set(terms.map((t) => t.trim()).filter((t) => t.length > 1))]
    const hit = unique.some((term) => {
      const re = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i')
      return re.test(text)
    })
    if (hit) mentioned.push(brand.name)
  }
  return mentioned
}

export function excerpt(text: string, maxLen = 280): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= maxLen) return clean
  return clean.slice(0, maxLen - 1).trimEnd() + '…'
}

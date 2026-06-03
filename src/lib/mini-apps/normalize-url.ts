export function normalizeSiteUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  let href = trimmed
  if (!/^https?:\/\//i.test(href)) {
    href = `https://${href}`
  }

  try {
    const parsed = new URL(href)
    if (!parsed.hostname || !parsed.hostname.includes('.')) return null
    const path = parsed.pathname === '/' ? '' : parsed.pathname
    return `${parsed.origin}${path}${parsed.search}`
  } catch {
    return null
  }
}

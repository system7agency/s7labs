export const LEAD_EMAIL_COOKIE = 's7_lead_email'
export const LEAD_ID_COOKIE = 's7_lead_id'
export const LEAD_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90

function parseCookieString(cookieHeader: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const name = part.slice(0, idx).trim()
    const value = part.slice(idx + 1).trim()
    if (!name) continue
    try {
      out[name] = decodeURIComponent(value)
    } catch {
      out[name] = value
    }
  }
  return out
}

export function getLeadFromCookies(cookieHeader: string | null): {
  email: string | null
  leadId: string | null
} {
  if (!cookieHeader) return { email: null, leadId: null }
  const cookies = parseCookieString(cookieHeader)
  return {
    email: cookies[LEAD_EMAIL_COOKIE] ?? null,
    leadId: cookies[LEAD_ID_COOKIE] ?? null,
  }
}

export function getLeadFromBrowser(): { email: string | null; leadId: string | null } {
  if (typeof document === 'undefined') return { email: null, leadId: null }
  return getLeadFromCookies(document.cookie || null)
}

export function clearLeadCookies(): void {
  if (typeof document === 'undefined') return
  const expired = `expires=${new Date(0).toUTCString()}; path=/; SameSite=Lax`
  document.cookie = `${LEAD_EMAIL_COOKIE}=; ${expired}`
  document.cookie = `${LEAD_ID_COOKIE}=; ${expired}`
}

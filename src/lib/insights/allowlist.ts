/**
 * Source of truth for who can access /insights.
 * Kept in code (not env vars) so it's reviewable in PRs and impossible to
 * misconfigure at deploy time.
 *
 * Add a teammate by appending their lowercased email.
 */
export const INSIGHTS_ALLOWLIST: readonly string[] = ['development@system7.ai'] as const

export function isAllowed(email: string | null | undefined): boolean {
  if (!email) return false
  return INSIGHTS_ALLOWLIST.includes(email.toLowerCase().trim())
}

/**
 * Returns a short relative-time string. Server-safe (no Intl APIs that vary
 * with locale).
 */
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / (60 * 1000))
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`
}

export function ageInDays(createdAt: string, now: Date = new Date()): number {
  return (now.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
}

export const RESULT_EXPIRY_DAYS = 30

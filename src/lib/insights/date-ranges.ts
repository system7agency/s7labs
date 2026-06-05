export type DateRange = '7d' | '30d' | '90d' | 'all'

export function isDateRange(v: string | null | undefined): v is DateRange {
  return v === '7d' || v === '30d' || v === '90d' || v === 'all'
}

export function rangeToDays(range: DateRange): number | null {
  if (range === '7d') return 7
  if (range === '30d') return 30
  if (range === '90d') return 90
  return null
}

/**
 * For a given range, compute the current period [currentStart, now] and the
 * previous equivalent period [prevStart, currentStart]. For 'all' we return
 * null bounds for both — caller treats unbounded as "no filter".
 */
export function getRangeBounds(range: DateRange): {
  currentStart: string | null
  currentEnd: string
  prevStart: string | null
  prevEnd: string | null
} {
  const now = new Date()
  const currentEnd = now.toISOString()
  const days = rangeToDays(range)
  if (days === null) {
    return { currentStart: null, currentEnd, prevStart: null, prevEnd: null }
  }
  const currentStartDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  const prevStartDate = new Date(currentStartDate.getTime() - days * 24 * 60 * 60 * 1000)
  return {
    currentStart: currentStartDate.toISOString(),
    currentEnd,
    prevStart: prevStartDate.toISOString(),
    prevEnd: currentStartDate.toISOString(),
  }
}

/**
 * For chart x-axis: list every day (YYYY-MM-DD) from start to end inclusive.
 * Returns empty array when range is 'all'.
 */
export function listDaysInRange(range: DateRange): string[] {
  const days = rangeToDays(range)
  if (days === null) return []
  const out: string[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    out.push(toYmd(d))
  }
  return out
}

export function toYmd(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

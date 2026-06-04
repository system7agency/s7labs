'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
] as const

type RangeValue = (typeof OPTIONS)[number]['value']

export const DEFAULT_RANGE: RangeValue = '30d'

export function isRangeValue(v: string | null): v is RangeValue {
  if (!v) return false
  return OPTIONS.some((o) => o.value === v)
}

export function DateRangePicker() {
  const router = useRouter()
  const params = useSearchParams()
  const raw = params.get('range')
  const current: RangeValue = isRangeValue(raw) ? raw : DEFAULT_RANGE

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const next = e.target.value
      const sp = new URLSearchParams(params.toString())
      if (next === DEFAULT_RANGE) sp.delete('range')
      else sp.set('range', next)
      const query = sp.toString()
      router.replace(`/insights${query ? `?${query}` : ''}`, { scroll: false })
    },
    [params, router]
  )

  return (
    <label className="ins-range">
      <span className="sr-only">Date range</span>
      <select value={current} onChange={handleChange} aria-label="Date range">
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

type Props = {
  placeholder?: string
  paramName?: string
  debounceMs?: number
}

export function InsightsSearch({
  placeholder = 'Search…',
  paramName = 'search',
  debounceMs = 300,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const initial = params.get(paramName) ?? ''
  const [value, setValue] = useState(initial)
  const lastPushedRef = useRef(initial)
  const firstRunRef = useRef(true)

  // Sync from external URL changes (e.g. back/forward).
  useEffect(() => {
    const next = params.get(paramName) ?? ''
    if (next !== lastPushedRef.current) {
      setValue(next)
      lastPushedRef.current = next
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false
      return
    }
    const handle = window.setTimeout(() => {
      if (value === lastPushedRef.current) return
      const sp = new URLSearchParams(params.toString())
      if (value.trim().length === 0) sp.delete(paramName)
      else sp.set(paramName, value)
      // Reset to page 1 whenever the search query changes.
      sp.delete('page')
      lastPushedRef.current = value
      const query = sp.toString()
      router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false })
    }, debounceMs)
    return () => window.clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <label className="ins-search">
      <span className="sr-only">Search</span>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
  )
}

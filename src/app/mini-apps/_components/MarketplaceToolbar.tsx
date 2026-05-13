'use client'

import { useEffect, useRef, useState } from 'react'

import { CATEGORIES } from '../_data/apps'

export type SortKey = 'featured' | 'newest' | 'most-used' | 'quickest'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'most-used', label: 'Most Used' },
  { value: 'quickest', label: 'Quickest to Try' },
]

type MarketplaceToolbarProps = {
  query: string
  onQueryChange: (q: string) => void
  category: string
  onCategoryChange: (c: string) => void
  size: number
  onSizeChange: (s: number) => void
  sort: SortKey
  onSortChange: (s: SortKey) => void
}

export function MarketplaceToolbar({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  size,
  onSizeChange,
  sort,
  onSortChange,
}: MarketplaceToolbarProps) {
  const [sortOpen, setSortOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const sortRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!sortOpen) return
    const onDown = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [sortOpen])

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Featured'

  return (
    <div className="toolbar reveal in">
      <div className="tb-search">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ic-search"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="search mini-apps..."
          aria-label="Search mini-apps"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <span className="kbd">/</span>
      </div>

      <div className="tb-chips" role="tablist">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={c.id === category ? 'chip is-active' : 'chip'}
            onClick={() => onCategoryChange(c.id)}
            aria-pressed={c.id === category}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="tb-controls">
        <div className="tb-sizer" aria-label="Card size">
          {[3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={n === size ? 'sz is-active' : 'sz'}
              onClick={() => onSizeChange(n)}
              title={
                n === 3
                  ? 'Focus · 3 per row'
                  : n === 4
                    ? 'Balanced · 4 per row'
                    : 'Compact · 5 per row'
              }
              aria-label={`${n} cards per row`}
            >
              <svg viewBox="0 0 16 16" fill="currentColor">
                {n === 3 ? (
                  <>
                    <rect x="0" y="3" width="5" height="10" rx="1" />
                    <rect x="5.5" y="3" width="5" height="10" rx="1" />
                    <rect x="11" y="3" width="5" height="10" rx="1" />
                  </>
                ) : n === 4 ? (
                  <>
                    <rect x="0" y="3" width="3.5" height="10" rx="1" />
                    <rect x="4" y="3" width="3.5" height="10" rx="1" />
                    <rect x="8" y="3" width="3.5" height="10" rx="1" />
                    <rect x="12" y="3" width="3.5" height="10" rx="1" />
                  </>
                ) : (
                  <>
                    <rect x="0" y="3" width="2.6" height="10" rx="0.6" />
                    <rect x="3.1" y="3" width="2.6" height="10" rx="0.6" />
                    <rect x="6.2" y="3" width="2.6" height="10" rx="0.6" />
                    <rect x="9.3" y="3" width="2.6" height="10" rx="0.6" />
                    <rect x="12.4" y="3" width="2.6" height="10" rx="0.6" />
                  </>
                )}
              </svg>
            </button>
          ))}
        </div>

        <div className={sortOpen ? 'tb-sort is-open' : 'tb-sort'} ref={sortRef}>
          <button
            type="button"
            className="sort-btn"
            onClick={() => setSortOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={sortOpen}
          >
            <span className="sort-lbl">{currentSortLabel.toUpperCase()}</span>
            <svg viewBox="0 0 12 12" fill="currentColor">
              <path d="M2 4l4 4 4-4" />
            </svg>
          </button>
          <ul className="sort-menu" role="menu">
            {SORT_OPTIONS.map((o) => (
              <li
                key={o.value}
                className={o.value === sort ? 'is-active' : undefined}
                onClick={() => {
                  onSortChange(o.value)
                  setSortOpen(false)
                }}
                role="menuitem"
              >
                {o.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

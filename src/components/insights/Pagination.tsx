'use client'

import { clsx } from 'clsx'
import { useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

type Props = {
  page: number
  totalPages: number
  pageSize: number
  total: number
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export function Pagination({ page, totalPages, pageSize, total }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const navigate = useCallback(
    (mutator: (sp: URLSearchParams) => void) => {
      const sp = new URLSearchParams(params.toString())
      mutator(sp)
      const query = sp.toString()
      router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false })
    },
    [params, pathname, router]
  )

  const goToPage = (next: number) => {
    if (next < 1 || next > totalPages || next === page) return
    navigate((sp) => {
      if (next === 1) sp.delete('page')
      else sp.set('page', String(next))
    })
  }

  const onPageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = Number.parseInt(e.target.value, 10)
    navigate((sp) => {
      if (next === 25) sp.delete('pageSize')
      else sp.set('pageSize', String(next))
      sp.delete('page')
    })
  }

  const prevDisabled = page <= 1
  const nextDisabled = page >= totalPages

  return (
    <div className="ins-pagination" role="navigation" aria-label="Pagination">
      <div className="ins-pagination-info">
        {total === 0 ? '0 results' : `${total.toLocaleString()} result${total === 1 ? '' : 's'}`}
      </div>
      <div className="ins-pagination-controls">
        <label className="ins-page-size">
          <span className="sr-only">Rows per page</span>
          <select value={pageSize} onChange={onPageSizeChange} aria-label="Rows per page">
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={clsx('ins-page-btn', { 'is-disabled': prevDisabled })}
          onClick={() => goToPage(page - 1)}
          disabled={prevDisabled}
          aria-label="Previous page"
        >
          « Prev
        </button>
        <span className="ins-page-indicator">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className={clsx('ins-page-btn', { 'is-disabled': nextDisabled })}
          onClick={() => goToPage(page + 1)}
          disabled={nextDisabled}
          aria-label="Next page"
        >
          Next »
        </button>
      </div>
    </div>
  )
}

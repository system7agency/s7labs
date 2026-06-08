'use client'

import { clsx } from 'clsx'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

type Props = {
  column: string
  label: string
  activeColumn: string
  activeDir: 'asc' | 'desc'
  defaultDir?: 'asc' | 'desc'
  className?: string
  align?: 'left' | 'right' | 'center'
}

export function SortableHeader({
  column,
  label,
  activeColumn,
  activeDir,
  defaultDir = 'desc',
  className,
  align = 'left',
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const isActive = activeColumn === column

  const onClick = () => {
    const sp = new URLSearchParams(params.toString())
    let nextDir: 'asc' | 'desc'
    if (isActive) {
      nextDir = activeDir === 'asc' ? 'desc' : 'asc'
    } else {
      nextDir = defaultDir
    }
    sp.set('sortBy', column)
    sp.set('sortDir', nextDir)
    sp.delete('page')
    const query = sp.toString()
    router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false })
  }

  const arrow = isActive ? (activeDir === 'asc' ? '▲' : '▼') : ''

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx('ins-sort-th', className, {
        'is-active': isActive,
        'is-right': align === 'right',
        'is-center': align === 'center',
      })}
      aria-label={`Sort by ${label}${isActive ? ` (currently ${activeDir === 'asc' ? 'ascending' : 'descending'})` : ''}`}
    >
      <span>{label}</span>
      {arrow ? <span className="ins-sort-arrow">{arrow}</span> : null}
    </button>
  )
}

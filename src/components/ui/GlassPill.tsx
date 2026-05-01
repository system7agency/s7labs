import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

type Props = HTMLAttributes<HTMLDivElement>

export function GlassPill({ className, ...props }: Props) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full',
        'bg-[var(--color-surface-2)] backdrop-blur-xl backdrop-saturate-150',
        'border border-[var(--color-border)]',
        'shadow-[var(--shadow-card)]',
        'px-4 py-2',
        className
      )}
      {...props}
    />
  )
}

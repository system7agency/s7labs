'use client'

import type { RouteCardData } from '@/types/route'

import { Typewriter } from './Typewriter'

type Props = {
  route: RouteCardData
  shouldType: boolean
  onTypingComplete: () => void
}

export function RouteCard({ route, shouldType, onTypingComplete }: Props) {
  const { index, label, tagline, tags, href } = route
  return (
    <a
      href={href}
      aria-label={`${label}: ${tagline}`}
      className="group flex min-h-[280px] flex-col justify-between rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 no-underline transition-colors duration-200 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
    >
      <span className="font-mono text-[11px] font-medium tracking-[0.14em] text-[var(--color-fg-dim)] uppercase">
        {index}
      </span>

      <div>
        <div className="flex items-baseline gap-2">
          <span
            aria-hidden="true"
            className="font-mono text-[24px] font-medium text-[var(--color-accent)]"
          >
            $
          </span>
          <Typewriter
            text={label}
            start={shouldType}
            speed={45}
            startDelay={300}
            onComplete={onTypingComplete}
            className="font-mono text-[24px] font-medium text-[var(--color-fg)]"
          />
        </div>
        <p className="mt-4 max-w-[320px] text-sm font-normal text-[var(--color-fg-muted)]">
          {tagline}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-medium tracking-[0.14em] text-[var(--color-fg-dim)] uppercase">
          {tags.join(' · ')}
        </span>
        <span className="font-mono text-[12px] font-medium tracking-[0.14em] text-[var(--color-fg-muted)] uppercase transition-colors duration-200 group-hover:text-[var(--color-accent)]">
          ENTER →
        </span>
      </div>
    </a>
  )
}

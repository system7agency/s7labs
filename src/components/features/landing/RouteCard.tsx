'use client'

import { useCardTilt } from '@/hooks/useCardTilt'
import type { RouteCardData } from '@/types/route'

import { Typewriter } from './Typewriter'

type Props = {
  route: RouteCardData
  shouldType: boolean
  onTypingComplete: () => void
}

/*
 * Card child stacking (z-index within the card):
 *   z-1: route-card-scan (hover line)
 *   z-1: route-card-glyph (ambient glyphs)
 *   z-2: route-card-glare (cursor-tracked glare)
 *   z-10: card content (index, label, tagline, footer)
 *
 * The card root has overflow:hidden so all decorative layers clip to
 * the rounded rectangle.
 */
export function RouteCard({ route, shouldType, onTypingComplete }: Props) {
  const { index, label, tagline, tags, href } = route
  const { ref, tilt, prefersReducedMotion } = useCardTilt<HTMLAnchorElement>()

  return (
    <a
      ref={ref}
      href={href}
      aria-label={`${label}: ${tagline}`}
      className="route-card group relative flex min-h-[280px] flex-col justify-between overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 no-underline hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      style={{
        transform: prefersReducedMotion
          ? undefined
          : `perspective(1200px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
        transition: tilt.active
          ? 'transform 60ms ease-out, border-color 200ms, background-color 200ms'
          : 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms, background-color 200ms',
        willChange: 'transform',
        transformStyle: 'preserve-3d',
      }}
    >
      <span className="route-card-scan" aria-hidden="true" />
      <span
        className="route-card-glare"
        aria-hidden="true"
        style={{
          background: prefersReducedMotion
            ? 'none'
            : `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.08), transparent 50%)`,
          opacity: tilt.active ? 1 : 0,
        }}
      />
      <span className="route-card-glyph" data-glyph="1" aria-hidden="true">
        λ
      </span>
      <span className="route-card-glyph" data-glyph="2" aria-hidden="true">
        →
      </span>
      <span className="route-card-glyph" data-glyph="3" aria-hidden="true">
        Σ
      </span>

      <span className="relative z-10 font-mono text-[11px] font-medium tracking-[0.14em] text-[var(--color-fg-dim)] uppercase">
        {index}
      </span>

      <div className="relative z-10">
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

      <div className="relative z-10 flex items-center justify-between">
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

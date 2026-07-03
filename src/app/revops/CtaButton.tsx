import type { ReactNode } from 'react'
import styles from './CtaButton.module.css'

/* ==========================================================================
   CtaButton — the single, shared RevOps call-to-action button.
   Ports the design-system `ButtonPrimary` 1:1: a dark surface at rest with a
   blue gradient that sweeps in from the left on hover (a pseudo-element, so
   the label rides above it). `variant="secondary"` renders the quiet outline
   pill. Colours come from the section-scoped theme tokens (--blue, --surface,
   --text, --border-strong, --dim, --cyan), so the button themes itself to
   whichever section it sits in.
   ========================================================================== */

type CtaButtonProps = {
  href: string
  children: ReactNode
  variant?: 'primary' | 'secondary'
  /** Show the trailing arrow (design's `arr` span). */
  arrow?: boolean
  className?: string
}

export function CtaButton({
  href,
  children,
  variant = 'primary',
  arrow = false,
  className,
}: CtaButtonProps) {
  return (
    <a href={href} className={[styles.btn, styles[variant], className].filter(Boolean).join(' ')}>
      <span className={styles.label}>{children}</span>
      {arrow ? (
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
      ) : null}
    </a>
  )
}

'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { openContactModal } from '@/components/ContactModal'
import styles from './InsideSystem7Section.module.css'
import { CtaButton } from './CtaButton'

/* ==========================================================================
   InsideSystem7Section — closing "module" A: "Inside System7".
   A centered, single-column closing statement (eyebrow, header, subhead,
   primary CTA) with a refined reveal and a soft orbital-ring accent that
   draws in once on scroll. Self-contained: React + module CSS only.

   Shared "fixed repeated module" across RevOps, Agent and Build: the eyebrow
   and "Talk to System7" CTA are constant; only the header + subhead vary by
   route (defaults are the RevOps copy).
   ========================================================================== */

const DEFAULT_HEADER: ReactNode = (
  <>
    S<sup>7</sup> Labs builds the revenue system. System<sup>7</sup> runs it with you.
  </>
)
const DEFAULT_SUBHEAD: ReactNode = (
  <>
    S<sup>7</sup> Labs is the build studio inside System<sup>7</sup>, where your revenue systems are
    designed, built and proven. System<sup>7</sup> then embeds with your team to run and improve
    them - or you run them yourself. You own what we build and your team operates it -
    production-grade systems, not a black box you rent.
  </>
)

type InsideSystem7SectionProps = {
  header?: ReactNode
  subhead?: ReactNode
}

export function InsideSystem7Section({
  header = DEFAULT_HEADER,
  subhead = DEFAULT_SUBHEAD,
}: InsideSystem7SectionProps = {}) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [play, setPlay] = useState(false)
  const [reduced, setReduced] = useState(false)

  // Detect reduced-motion once on mount (deferred setState via rAF so it is
  // not a synchronous-in-effect update).
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.requestAnimationFrame(() => setReduced(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  // Trigger the reveal once when scrolled into view.
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    if (reduced) {
      const id = window.requestAnimationFrame(() => setPlay(true))
      return () => window.cancelAnimationFrame(id)
    }

    if (typeof IntersectionObserver === 'undefined') {
      const id = window.requestAnimationFrame(() => setPlay(true))
      return () => window.cancelAnimationFrame(id)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting) {
          setPlay(true)
          observer.unobserve(entry.target)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)

    return () => {
      observer.disconnect()
    }
  }, [reduced])

  const stateClass = reduced ? styles.reduced : play ? styles.play : ''

  return (
    <section
      ref={sectionRef}
      className={`${styles.section} ${stateClass}`}
      aria-labelledby="inside-system7-heading"
    >
      {/* Decorative orbital-ring accent behind the copy */}
      <div className={styles.accent} aria-hidden="true">
        <svg className={styles.orbit} viewBox="0 0 480 480" fill="none">
          <circle className={styles.ring} cx="240" cy="240" r="150" />
          <circle className={`${styles.ring} ${styles.ringInner}`} cx="240" cy="240" r="104" />
          <circle className={styles.orbitDot} cx="240" cy="90" r="3.5" />
        </svg>
      </div>

      <div className={styles.inner}>
        <span className={`${styles.eyebrow} ${styles.reveal}`}>{'// INSIDE SYSTEM7'}</span>

        <h2 id="inside-system7-heading" className={`${styles.header} ${styles.reveal}`}>
          {header}
        </h2>

        <p className={`${styles.subhead} ${styles.reveal}`}>{subhead}</p>

        <div className={`${styles.actions} ${styles.reveal}`}>
          <CtaButton onClick={() => openContactModal('inside-system7')} arrow>
            Talk to System7
          </CtaButton>
        </div>
      </div>
    </section>
  )
}

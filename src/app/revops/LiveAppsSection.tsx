'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

import { APPS } from '@/app/mini-apps/_data/apps'

import styles from './LiveAppsSection.module.css'
import { CtaButton } from './CtaButton'

/* ==========================================================================
   LiveAppsSection — closing "module" C: "Live apps".
   The repeated closing frame (shared with Agent and Build): a centered
   single-column statement (eyebrow, header, subhead, one CTA) that routes to
   the Live Apps gallery. Same refined reveal + orbital accent as the sibling
   closing modules. Self-contained: React + module CSS only.
   ========================================================================== */

const DEFAULT_SUBHEAD: ReactNode = (
  <>
    These are deliberately small, live tools - each one solves a single problem fast. Open one, test
    it, use it. The quickest way to feel how a system works.
  </>
)

type LiveAppsSectionProps = {
  subhead?: ReactNode
}

// The live app names, split into two rows for the counter-scrolling strip.
// Reads straight from the gallery data so it never drifts from the real list.
const LIVE_NAMES = APPS.filter((a) => a.status === 'live').map((a) => a.name)
const ROW_A = LIVE_NAMES.filter((_, i) => i % 2 === 0)
const ROW_B = LIVE_NAMES.filter((_, i) => i % 2 === 1)

function MarqueeRow({ names, reverse }: { names: string[]; reverse?: boolean }) {
  return (
    <div className={styles.marqueeRow}>
      <div className={`${styles.marqueeInner} ${reverse ? styles.marqueeReverse : ''}`}>
        {/* content twice for a seamless loop */}
        {[0, 1].map((pass) => (
          <div key={pass} className={styles.marqueeGroup} aria-hidden={pass === 1 || undefined}>
            {names.map((n) => (
              <span key={`${pass}-${n}`} className={styles.appPill}>
                {n}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function LiveAppsSection({ subhead = DEFAULT_SUBHEAD }: LiveAppsSectionProps = {}) {
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
      aria-labelledby="live-apps-heading"
    >
      <div className={styles.inner}>
        <span className={`${styles.eyebrow} ${styles.reveal}`}>{'// LIVE APPS'}</span>

        <h2 id="live-apps-heading" className={`${styles.header} ${styles.reveal}`}>
          Solve a quick problem right now.
        </h2>

        <p className={`${styles.subhead} ${styles.reveal}`}>{subhead}</p>
      </div>

      {/* Counter-scrolling strip of the real live apps — a taste of the gallery */}
      <div className={`${styles.appsStrip} ${styles.reveal}`} aria-hidden="true">
        <MarqueeRow names={ROW_A} />
        <MarqueeRow names={ROW_B} reverse />
      </div>

      <div className={styles.inner}>
        <div className={`${styles.actions} ${styles.reveal}`}>
          <CtaButton href="/mini-apps" arrow>
            Explore the live apps
          </CtaButton>
        </div>
      </div>
    </section>
  )
}

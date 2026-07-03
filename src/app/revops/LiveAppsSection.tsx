'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './LiveAppsSection.module.css'
import { CtaButton } from './CtaButton'

/* ==========================================================================
   LiveAppsSection — closing "module" C: "Live apps".
   The repeated closing frame (shared with Agent and Build): a centered
   single-column statement (eyebrow, header, subhead, one CTA) that routes to
   the Live Apps gallery. Same refined reveal + orbital accent as the sibling
   closing modules. Self-contained: React + module CSS only.
   ========================================================================== */

export function LiveAppsSection() {
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
      {/* Decorative orbital-ring accent behind the copy */}
      <div className={styles.accent} aria-hidden="true">
        <svg className={styles.orbit} viewBox="0 0 480 480" fill="none">
          <circle className={styles.ring} cx="240" cy="240" r="150" />
          <circle className={`${styles.ring} ${styles.ringInner}`} cx="240" cy="240" r="104" />
          <circle className={styles.orbitDot} cx="240" cy="90" r="3.5" />
        </svg>
      </div>

      <div className={styles.inner}>
        <span className={`${styles.eyebrow} ${styles.reveal}`}>{'// LIVE APPS'}</span>

        <h2 id="live-apps-heading" className={`${styles.header} ${styles.reveal}`}>
          Solve a quick problem right now.
        </h2>

        <p className={`${styles.subhead} ${styles.reveal}`}>
          These are deliberately small, live tools - each one solves a single problem fast. Open
          one, test it, use it. The quickest way to feel how a system works.
        </p>

        <div className={`${styles.actions} ${styles.reveal}`}>
          <CtaButton href="/mini-apps" arrow>
            Explore the live apps
          </CtaButton>
        </div>
      </div>
    </section>
  )
}

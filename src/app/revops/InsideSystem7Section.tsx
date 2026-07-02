'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './InsideSystem7Section.module.css'

/* ==========================================================================
   InsideSystem7Section — closing "module" A: "Inside System7".
   A centered, single-column closing statement (eyebrow, header, subhead,
   primary CTA) with a refined reveal and a soft orbital-ring accent that
   draws in once on scroll. Self-contained: React + module CSS only.
   ========================================================================== */

export function InsideSystem7Section() {
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
          S<sup>7</sup> Labs builds the revenue system. System<sup>7</sup> runs it with you.
        </h2>

        <p className={`${styles.subhead} ${styles.reveal}`}>
          S<sup>7</sup> Labs is the build studio inside System<sup>7</sup>, where your revenue
          systems are designed, built and proven. System<sup>7</sup> then embeds with your team to
          run and improve them - or you run them yourself. You own what we build and your team
          operates it - production-grade systems, not a black box you rent.
        </p>

        <div className={`${styles.actions} ${styles.reveal}`}>
          <a className={styles.ctaPrimary} href="https://www.system7.ai/contact">
            Talk to System7 <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  )
}

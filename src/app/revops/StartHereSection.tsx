'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './StartHereSection.module.css'

/* ==========================================================================
   StartHereSection — closing "module" B: "Start here".
   A centered, single-column closing statement (eyebrow, header, subhead,
   primary + secondary CTAs, mono note) with a refined reveal and a gentle
   drawing-line accent that traces in once on scroll.
   Self-contained: React + module CSS only.
   ========================================================================== */

export function StartHereSection() {
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
      aria-labelledby="start-here-heading"
    >
      {/* Decorative drawing-line accent: a gentle underscore that traces in
          beneath the header, with a soft travelling gleam. */}
      <div className={styles.accent} aria-hidden="true">
        <svg className={styles.lineSvg} viewBox="0 0 480 24" fill="none">
          <path className={styles.line} d="M8 12 C 128 12, 168 4, 240 4 C 312 4, 352 20, 472 20" />
        </svg>
      </div>

      <div className={styles.inner}>
        <span className={`${styles.eyebrow} ${styles.reveal}`}>{'// START HERE'}</span>

        <h2 id="start-here-heading" className={`${styles.header} ${styles.reveal}`}>
          Bring us the workflow. We&apos;ll build the system around it.
        </h2>

        <p className={`${styles.subhead} ${styles.reveal}`}>
          If your team keeps doing revenue work by hand - sourcing, research, routing, reporting -
          it can probably be built. Tell us where the friction is and we&apos;ll map the system
          around it.
        </p>

        <div className={`${styles.actions} ${styles.reveal}`}>
          <a className={styles.ctaPrimary} href="https://www.system7.ai/contact">
            Map the system
          </a>
          <a className={styles.ctaSecondary} href="/mini-apps">
            Browse live apps
          </a>
        </div>

        <p className={`${styles.note} ${styles.reveal}`}>
          Response within 24 hours · UK engineering
        </p>
      </div>
    </section>
  )
}

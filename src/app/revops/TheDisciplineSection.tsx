'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './TheDisciplineSection.module.css'

/* ==========================================================================
   TheDisciplineSection — "The discipline" section.
   A premium "dismiss the alternatives, reveal the owned system" reveal that
   animates once on scroll-in. The four "Not X" alternatives strike out in
   sequence while a central "A system you own" emblem solidifies and locks.
   Self-contained: React + module CSS only. Inline SVG, no libraries.
   ========================================================================== */

/** The alternatives GTM engineering is NOT — each gets dismissed in turn. */
const NEGATIONS: ReadonlyArray<string> = [
  'Not a SaaS subscription',
  'Not outsourced reps',
  'Not one-off campaigns',
  'Not a black box',
]

export function TheDisciplineSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [play, setPlay] = useState(false)
  const [reduced, setReduced] = useState(false)

  // Detect reduced-motion once on mount (deferred setState so it is not a
  // synchronous-in-effect update).
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.requestAnimationFrame(() => setReduced(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  // Trigger the sequence once when scrolled into view.
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    // If reduced motion, jump straight to the final state.
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
      aria-labelledby="discipline-heading"
    >
      <div className={styles.inner}>
        {/* ---------- LEFT: copy ---------- */}
        <div className={styles.copy}>
          <span className={styles.eyebrow}>{'// THE DISCIPLINE'}</span>

          <h2 id="discipline-heading" className={`${styles.header} ${styles.reveal}`}>
            Not a tool. Not an SDR team.{' '}
            <span className={styles.accent}>A revenue system you own.</span>
          </h2>

          <p className={`${styles.subhead} ${styles.reveal}`}>
            GTM engineering is the discipline of building the automated systems behind go-to-market.
            We connect your data, signals, outreach and CRM into one motion that runs without manual
            effort, so what you get is not a campaign but a system your team owns, operates and
            improves as you grow.
          </p>

          <div className={styles.chips}>
            {NEGATIONS.map((n) => (
              <span className={styles.chip} key={n}>
                <span className={styles.chipDot} aria-hidden="true" />
                {n}
              </span>
            ))}
          </div>
        </div>

        {/* ---------- RIGHT: animation ---------- */}
        <div className={styles.viz}>
          <div className={styles.stage} aria-hidden="true">
            {/* Dismissed alternatives, struck out one by one */}
            <ul className={styles.alts}>
              {NEGATIONS.map((n) => (
                <li className={styles.alt} key={n}>
                  <span className={styles.altText}>{n}</span>
                  <span className={styles.strike} />
                  <svg className={styles.altX} viewBox="0 0 16 16" fill="none">
                    <path className={styles.altXStroke} d="M4 4 L12 12 M12 4 L4 12" />
                  </svg>
                </li>
              ))}
            </ul>

            {/* Central emblem — the owned system, locking in */}
            <div className={styles.emblem}>
              <svg className={styles.emblemSvg} viewBox="0 0 240 240" fill="none">
                <defs>
                  <radialGradient id="disciplineCore" cx="50%" cy="42%" r="62%">
                    <stop offset="0%" stopColor="#4f8cff" stopOpacity="0.34" />
                    <stop offset="60%" stopColor="#4f8cff" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#4f8cff" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="disciplineRing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8fb6ff" />
                    <stop offset="100%" stopColor="#4f8cff" />
                  </linearGradient>
                </defs>

                {/* Soft radial glow behind the core */}
                <circle
                  className={styles.glow}
                  cx="120"
                  cy="118"
                  r="96"
                  fill="url(#disciplineCore)"
                />

                {/* Outer orbit ring, drawn in */}
                <circle className={styles.orbit} cx="120" cy="120" r="92" />

                {/* Hexagonal secure shell that locks around the core */}
                <path
                  className={styles.shell}
                  d="M120 42 L187 81 L187 159 L120 198 L53 159 L53 81 Z"
                />

                {/* Traveling node on the orbit ring */}
                <circle className={styles.node} cx="120" cy="28" r="4" />

                {/* Lock body */}
                <rect className={styles.lockBody} x="96" y="118" width="48" height="40" rx="7" />
                {/* Lock shackle, snaps shut */}
                <path
                  className={styles.lockShackle}
                  d="M104 118 L104 106 A16 16 0 0 1 136 106 L136 118"
                />
              </svg>

              <div className={styles.emblemLabel}>
                <span className={styles.emblemLabelKicker}>{'// OWNED'}</span>
                <span className={styles.emblemLabelText}>A system you own</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

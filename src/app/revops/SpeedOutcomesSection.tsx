'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './SpeedOutcomesSection.module.css'

/* ==========================================================================
   SpeedOutcomesSection — "Speed & outcomes" section.
   A premium "days -> minutes" time-compression viz that animates once on
   scroll-in. Two parallel tracks: an OLD track measured in DAYS that crawls
   and is left behind, and a NEW track measured in MINUTES that fills almost
   instantly. Background tasks (Research, Reporting, Qualification) complete
   rapidly. Self-contained: React + module CSS only. No libraries.
   ========================================================================== */

/** Background tasks that visibly complete while you wait. */
const TASKS: ReadonlyArray<{ label: string; from: string; to: string }> = [
  { label: 'Research', from: '2 days', to: '90s' },
  { label: 'Reporting', from: '1 day', to: '40s' },
  { label: 'Qualification', from: '3 days', to: '2m' },
]

/* Count-down driver: the old estimate collapses from days into minutes. */
const DAYS_FROM = 6 // starting estimate, in days
const MINUTES_TO = 4 // final result, in minutes

export function SpeedOutcomesSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [play, setPlay] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [displayValue, setDisplayValue] = useState(DAYS_FROM)
  const [collapsed, setCollapsed] = useState(false)
  const rafRef = useRef<number | null>(null)

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
      const id = window.requestAnimationFrame(() => {
        setPlay(true)
        setCollapsed(true)
        setDisplayValue(MINUTES_TO)
      })
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

  // Count-down: the big readout collapses from DAYS to MINUTES, then flips
  // its unit label. Kicked off shortly after play begins so it lands with
  // the new track filling.
  useEffect(() => {
    if (!play || reduced) return
    const COUNT_DELAY_MS = 750
    const COUNT_DUR_MS = 1150
    let startTs: number | null = null
    let started = false

    const timeout = window.setTimeout(() => {
      started = true
      const step = (ts: number) => {
        if (startTs === null) startTs = ts
        const t = Math.min(1, (ts - startTs) / COUNT_DUR_MS)
        // easeInOutCubic — accelerates then eases into the final value.
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
        // Collapse the days value toward the minutes value.
        const value = DAYS_FROM + (MINUTES_TO - DAYS_FROM) * eased
        setDisplayValue(Number(value.toFixed(0)))
        if (t < 1) {
          rafRef.current = window.requestAnimationFrame(step)
        } else {
          setDisplayValue(MINUTES_TO)
          setCollapsed(true)
        }
      }
      rafRef.current = window.requestAnimationFrame(step)
    }, COUNT_DELAY_MS)

    return () => {
      window.clearTimeout(timeout)
      if (started && rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [play, reduced])

  const stateClass = reduced ? styles.reduced : play ? styles.play : ''
  const unitLabel = collapsed ? 'MINUTES' : 'DAYS'

  return (
    <section
      ref={sectionRef}
      className={`${styles.section} ${stateClass}`}
      aria-labelledby="speed-heading"
    >
      <div className={styles.inner}>
        {/* ---------- LEFT: copy ---------- */}
        <div className={styles.copy}>
          <span className={styles.eyebrow}>{'// SPEED'}</span>

          <h2 id="speed-heading" className={`${styles.header} ${styles.reveal}`}>
            Work that took days now takes minutes.
          </h2>

          <p className={`${styles.subhead} ${styles.reveal}`}>
            When the system does the manual work, the waiting disappears - research, reporting and
            qualification run in the background and finish before you&rsquo;ve refilled your coffee.
            We handle the complexity; you get the results.
          </p>

          {/* Destination per the copy doc's build note (system7.ai/results);
              confirm the URL is live before launch. */}
          <a href="https://www.system7.ai/results" className={`${styles.link} ${styles.reveal}`}>
            See the numbers on real engagements
            <span className={styles.linkArrow} aria-hidden="true">
              →
            </span>
          </a>
        </div>

        {/* ---------- RIGHT: time-compression viz ---------- */}
        <div className={styles.viz}>
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>Time to result</span>
              <span className={styles.cardMeta}>SAME REQUEST</span>
            </div>

            {/* Big collapsing readout */}
            <div className={styles.readout}>
              <span className={styles.readoutValue}>{displayValue}</span>
              <span className={styles.readoutUnitWrap} aria-hidden="true">
                <span
                  className={`${styles.readoutUnit} ${styles.unitDays} ${
                    collapsed ? styles.unitHidden : ''
                  }`}
                >
                  DAYS
                </span>
                <span
                  className={`${styles.readoutUnit} ${styles.unitMinutes} ${
                    collapsed ? styles.unitShown : ''
                  }`}
                >
                  MINUTES
                </span>
              </span>
              <span className={styles.srOnly}>
                {displayValue} {unitLabel.toLowerCase()}
              </span>
            </div>

            {/* Two parallel tracks: OLD (days) crawls, NEW (minutes) fills */}
            <div className={styles.tracks}>
              <div className={`${styles.track} ${styles.trackOld}`}>
                <div className={styles.trackHead}>
                  <span className={styles.trackLabel}>Manual</span>
                  <span className={`${styles.trackUnit} ${styles.unitOld}`}>DAYS</span>
                </div>
                <div className={styles.rail}>
                  <span className={`${styles.fill} ${styles.fillOld}`} aria-hidden="true" />
                </div>
              </div>

              <div className={`${styles.track} ${styles.trackNew}`}>
                <div className={styles.trackHead}>
                  <span className={styles.trackLabel}>With the system</span>
                  <span className={`${styles.trackUnit} ${styles.unitNew}`}>MINUTES</span>
                </div>
                <div className={styles.rail}>
                  <span className={`${styles.fill} ${styles.fillNew}`} aria-hidden="true" />
                  <span className={styles.fillSpark} aria-hidden="true" />
                </div>
              </div>
            </div>

            {/* Background tasks completing rapidly */}
            <div className={styles.tasks}>
              {TASKS.map((task) => (
                <div className={styles.task} key={task.label}>
                  <span className={styles.taskCheck} aria-hidden="true">
                    <svg viewBox="0 0 14 14" fill="none">
                      <path className={styles.taskTick} d="M2.5 7.5 L6 11 L11.5 3.5" />
                    </svg>
                  </span>
                  <span className={styles.taskLabel}>{task.label}</span>
                  <span className={styles.taskTimes}>
                    <span className={styles.taskFrom}>{task.from}</span>
                    <span className={styles.taskArrow} aria-hidden="true">
                      →
                    </span>
                    <span className={styles.taskTo}>{task.to}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.footNote}>
              <span className={styles.footDot} aria-hidden="true" />
              Running in the background · done before your coffee&rsquo;s ready
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

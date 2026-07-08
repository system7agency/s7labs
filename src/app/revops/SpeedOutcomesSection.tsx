'use client'

import { useRef } from 'react'

import { MotionRoot, VIEWPORT, fadeUp, m, useInView } from '@/components/Motion'

/* The three tasks named in the section subhead; the DAYS → MINUTES labels are
   the header's own words. No figures beyond the approved copy. */
const ROWS = ['Research', 'Reporting', 'Qualification']

/* 07 · Speed & outcomes — each row's timeline literally compresses: the dim
   "days" bar fills, then collapses into the short accent "minutes" segment. */
export function SpeedOutcomesSection() {
  const rowsRef = useRef<HTMLDivElement | null>(null)
  const inView = useInView(rowsRef, { once: true, amount: 0.4 })

  return (
    <MotionRoot>
      <section className="fx-sec" aria-label="Speed and outcomes">
        <div className="fx-eyebrow">
          <span className="lead">
            <span className="slashes">{'//'}</span> SPEED
          </span>
          <span className="num">07</span>
        </div>

        <div className="fx-head">
          <m.h2
            className="fx-h2"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            Work that took days <span className="accent-text">now takes minutes.</span>
          </m.h2>
          <m.p
            className="fx-sub"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            When the system does the manual work, the waiting disappears - research, reporting and
            qualification run in the background and finish before you&rsquo;ve refilled your coffee.
            We handle the complexity; you get the results.
          </m.p>
        </div>

        <div ref={rowsRef} className={inView ? 'rv-speed play' : 'rv-speed'}>
          {ROWS.map((task, i) => (
            <div key={task} className="rv-speed-row">
              <span className="task">{task}</span>
              <span className="track" aria-hidden="true">
                <span
                  className="was-fill"
                  style={{ '--d': `${i * 0.25}s` } as React.CSSProperties}
                />
                <span
                  className="now-fill"
                  style={{ '--d': `${i * 0.25}s` } as React.CSSProperties}
                />
              </span>
              <span className="figures">
                <span className="was">Days</span>
                <span className="arr" aria-hidden="true">
                  →
                </span>
                <span className="now">Minutes</span>
              </span>
            </div>
          ))}
        </div>

        <m.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT}>
          <a className="rv-speed-link" href="https://www.system7.ai/results">
            See the numbers on real engagements <span aria-hidden="true">→</span>
          </a>
        </m.div>
      </section>
    </MotionRoot>
  )
}

'use client'

import { MotionRoot, VIEWPORT, fadeUp, m, staggerParent } from '@/components/Motion'

/* The three tasks named in the section subhead; DAYS → MINUTES are the
   header's own words. No figures beyond the approved copy. */
const TASKS = ['Research', 'Reporting', 'Qualification']

/* Speedometer geometry: an open-bottom arc that sweeps from DAYS (lower-left)
   over the top to MINUTES (lower-right). Angles are standard math degrees;
   screen y is inverted in the projection. */
const CX = 180
const CY = 186
const R = 136
const R_TICK_IN = 118
const A_START = 216 // DAYS end
const A_END = -36 // MINUTES end

const project = (deg: number): [number, number] => {
  const r = (deg * Math.PI) / 180
  return [CX + R * Math.cos(r), CY - R * Math.sin(r)]
}

/* The arc as a many-segment path so we can animate pathLength (draw-on) and
   dodge SVG arc-flag guesswork. Points run DAYS → MINUTES. */
const ARC_D = Array.from({ length: 121 }, (_, i) => {
  const [x, y] = project(A_START + ((A_END - A_START) * i) / 120)
  return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
}).join(' ')

const TICKS = Array.from({ length: 13 }, (_, k) => {
  const deg = A_START + ((A_END - A_START) * k) / 12
  const r = (deg * Math.PI) / 180
  const c = Math.cos(r)
  const s = Math.sin(r)
  return {
    x1: CX + R_TICK_IN * c,
    y1: CY - R_TICK_IN * s,
    x2: CX + R * c,
    y2: CY - R * s,
    hot: k / 12,
  }
})

const [MX, MY] = project(A_END) // glowing marker at the MINUTES end

/* 07 · Speed & outcomes — a speed gauge: the needle-track sweeps from the
   old timescale (days, dim) to the new one (minutes, lit) as it enters view. */
export function SpeedOutcomesSection() {
  return (
    <MotionRoot>
      <section className="fx-sec" aria-label="Speed and outcomes">
        <div className="fx-eyebrow">
          <span className="lead">
            <span className="slashes">{'//'}</span> SPEED
          </span>
          <span className="num">07</span>
        </div>

        <div className="rv-speed-grid">
          <div>
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
              qualification run in the background and finish before you&rsquo;ve refilled your
              coffee. We handle the complexity; you get the results.
            </m.p>

            <m.div
              className="rv-speed-tasks"
              variants={staggerParent(0.1)}
              initial="hidden"
              whileInView="show"
              viewport={VIEWPORT}
            >
              {TASKS.map((task, i) => (
                <m.div key={task} className="rv-speed-task" variants={fadeUp}>
                  <span className="idx">{String(i + 1).padStart(2, '0')}</span>
                  <span className="name">{task}</span>
                  <span className="shift">
                    Days <span className="arr">→</span> <span className="v">Minutes</span>
                  </span>
                </m.div>
              ))}
            </m.div>

            <m.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT}>
              <a
                className="rv-speed-link"
                href="https://www.system7.ai/case-studies"
                target="_blank"
                rel="noopener noreferrer"
              >
                See the numbers on real engagements <span aria-hidden="true">→</span>
              </a>
            </m.div>
          </div>

          <div className="rv-gauge" aria-hidden="true">
            <svg viewBox="0 0 360 300" className="rv-gauge-svg">
              <defs>
                <linearGradient id="rv-gauge-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
                  <stop offset="55%" stopColor="var(--accent)" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="var(--cyan, #04e3ee)" stopOpacity="1" />
                </linearGradient>
              </defs>
              {/* dim baseline track */}
              <path className="rv-gauge-track" d={ARC_D} />
              {/* ticks, brightening toward the minutes end */}
              {TICKS.map((t, i) => (
                <line
                  key={i}
                  className="rv-gauge-tick"
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  style={{ opacity: 0.2 + 0.7 * t.hot }}
                />
              ))}
              {/* accent sweep drawing days → minutes on entry */}
              <m.path
                className="rv-gauge-fill"
                d={ARC_D}
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={VIEWPORT}
                transition={{ duration: 1.8, ease: [0.3, 0, 0.2, 1], delay: 0.3 }}
              />
              {/* pulsing marker parked at minutes */}
              <m.circle
                className="rv-gauge-dot"
                cx={MX}
                cy={MY}
                r={5.5}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={VIEWPORT}
                transition={{ duration: 0.4, delay: 1.9 }}
              />
            </svg>
            <div className="rv-gauge-center">
              <span className="was">Days</span>
              <span className="arr" aria-hidden="true">
                ↓
              </span>
              <span className="now">Minutes</span>
            </div>
            <span className="rv-gauge-end days">DAYS</span>
            <span className="rv-gauge-end mins">MINUTES</span>
          </div>
        </div>
      </section>
    </MotionRoot>
  )
}

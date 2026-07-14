'use client'

import { useRef } from 'react'

import { MotionRoot, VIEWPORT, fadeUp, m, useInView } from '@/components/Motion'
import { ScrollLink } from '@/components/ScrollLink'

import { DesignAgentButton } from './DesignAgentButton'

/* The six repetitive tasks from the copy doc. Shown as an endless orbit -
   no figures, no scale, just the loop the work keeps running through. */
const TASKS = [
  'Chasing information',
  'Copying between tools',
  'Manual checks',
  'Routing and triage',
  'Status chasing',
  'Repetitive reporting',
]

/* Orbit geometry: six tasks evenly spaced around one ring. R is the ring the
   pulse travels; LABEL_R is a slightly larger radius so each task's node and
   label sit just outside the ring line and never overlap it. */
const S = 600
const R = 178
const LABEL_R = 205
const NODES = TASKS.map((task, i) => {
  const a = ((-90 + i * (360 / TASKS.length)) * Math.PI) / 180
  return {
    task,
    // label anchor sits a touch outside the ring line
    x: Math.cos(a) * LABEL_R,
    y: Math.sin(a) * LABEL_R,
    // point on the ring itself — where a faint spoke meets the centre
    ringX: Math.cos(a) * R,
    ringY: Math.sin(a) * R,
  }
})

/* Which quadrant a label sits in, so it anchors away from the ring centre. */
function labelSide(x: number): 'left' | 'right' | 'center' {
  if (x > 12) return 'right'
  if (x < -12) return 'left'
  return 'center'
}

/* 02 · Where the time goes — the felt problem, carrying the page's CTAs.
   The right side draws the six repetitive tasks as one endless orbit: a pulse
   circles the ring forever (the work that never finishes) while, one at a
   time, a task is lifted inward to the agent core and taken off them. */
export function AgentHero() {
  const orbitRef = useRef<HTMLDivElement | null>(null)
  const inView = useInView(orbitRef, { once: true, amount: 0.4 })

  return (
    <MotionRoot>
      <section className="fx-sec" aria-label="Where the time goes">
        <div className="fx-eyebrow">
          <span className="lead">
            <span className="slashes">{'//'}</span> WHERE THE TIME GOES
          </span>
          <span className="num">02</span>
        </div>

        <div className="ag-split">
          <div>
            <m.h2
              className="fx-h2"
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={VIEWPORT}
            >
              Your best people are doing work that{' '}
              <span className="accent-text">doesn&rsquo;t need them.</span>
            </m.h2>
            <m.p
              className="fx-sub"
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={VIEWPORT}
            >
              Skilled teams lose hours every week to repetitive, multi-step tasks - chasing
              information, moving data between tools, checking and routing work.
            </m.p>

            <m.p
              className="fx-turn"
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={VIEWPORT}
            >
              Agents take <span className="accent-text">that work</span> off them.
            </m.p>

            <m.div
              className="fx-ctas"
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={VIEWPORT}
            >
              <DesignAgentButton />
              <ScrollLink className="btn ghost" href="#the-work">
                <span>See what agents do</span>
              </ScrollLink>
            </m.div>
          </div>

          <div ref={orbitRef} className={inView ? 'ag-orbit play' : 'ag-orbit'}>
            <svg
              className="ag-orbit-svg"
              viewBox={`${-S / 2} ${-S / 2} ${S} ${S}`}
              aria-hidden="true"
            >
              {/* the ring the work runs around, drawn on once in view */}
              <m.circle
                cx={0}
                cy={0}
                r={R}
                className="ag-orbit-ring"
                pathLength={1}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={inView ? { pathLength: 1, opacity: 1 } : {}}
                transition={{ duration: 1.1, delay: 0.15, ease: [0.3, 0, 0.2, 1] }}
              />

              {/* faint tether from each on-ring task point to the core */}
              {NODES.map((n, i) => (
                <m.line
                  key={`th-${i}`}
                  x1={n.ringX}
                  y1={n.ringY}
                  x2={0}
                  y2={0}
                  className="ag-orbit-tether"
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.6 + i * 0.08 }}
                />
              ))}

              {/* the pulse that keeps circling the ring — the work never ends */}
              {inView && (
                <>
                  <circle r={R} className="ag-orbit-track" pathLength={1} />
                  <circle r={R} className="ag-orbit-comet" pathLength={1} />
                </>
              )}

              {/* one task at a time lifted off the ring, inward to the core */}
              {inView &&
                NODES.map((n, i) => (
                  <m.circle
                    key={`lift-${i}`}
                    r={3.4}
                    className="ag-orbit-lift"
                    initial={{ cx: n.ringX, cy: n.ringY, opacity: 0 }}
                    animate={{
                      cx: [n.ringX, 0],
                      cy: [n.ringY, 0],
                      opacity: [0, 0.95, 0],
                    }}
                    transition={{
                      duration: 1.4,
                      times: [0, 0.4, 1],
                      delay: 1.4 + i * 0.9,
                      repeat: Infinity,
                      repeatDelay: TASKS.length * 0.9 - 1.4,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
            </svg>

            {/* a quiet still point at the centre — where lifted work lands.
                No label, no pulsing ring: just a soft glow so the middle
                reads as a destination without popping. */}
            <div className="ag-orbit-core" aria-hidden="true">
              <span className="dot" />
            </div>

            {/* the six repetitive tasks, seated just outside the ring */}
            <ul className="ag-orbit-list" role="list" aria-label="The repetitive work">
              {NODES.map((n, i) => (
                <m.li
                  key={n.task}
                  className={`ag-orbit-item is-${labelSide(n.x)}`}
                  style={{
                    left: `calc(50% + ${((n.x / S) * 100).toFixed(2)}%)`,
                    top: `calc(50% + ${((n.y / S) * 100).toFixed(2)}%)`,
                  }}
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.55 + i * 0.09 }}
                >
                  <span className="ag-orbit-node" aria-hidden="true" />
                  <span className="ag-orbit-lbl">{n.task}</span>
                </m.li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </MotionRoot>
  )
}

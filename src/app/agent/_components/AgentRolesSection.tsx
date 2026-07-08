'use client'

import { useRef } from 'react'

import { MotionRoot, VIEWPORT, fadeUp, m, useInView } from '@/components/Motion'

const ROLES = ['Researcher', 'Analyst', 'Operator', 'Reviewer', 'Coordinator', 'Reporter']

const OUTPUT = [
  'QA checks',
  'missing-field reports',
  'handoffs',
  'escalations',
  'daily briefs',
  'audit logs',
]

/* Hub geometry: six roles evenly around the core. */
const S = 600
const R = 232
const POSITIONS = ROLES.map((_, i) => {
  const a = ((-90 + i * 60) * Math.PI) / 180
  return { x: Math.cos(a) * R, y: Math.sin(a) * R }
})

/* 04 · The work — one agent pattern at the centre, sending work out to the
   roles it plays across the business (the client's "central agent sending
   data to different agents" sketch). Anchor target for "See what agents do". */
export function AgentRolesSection() {
  const hubRef = useRef<HTMLDivElement | null>(null)
  const inView = useInView(hubRef, { once: true, amount: 0.35 })

  return (
    <MotionRoot>
      <section className="fx-sec" id="the-work" aria-label="The work">
        <div className="fx-eyebrow">
          <span className="lead">
            <span className="slashes">{'//'}</span> THE WORK
          </span>
          <span className="num">04</span>
        </div>

        <div className="fx-head">
          <m.h2
            className="fx-h2"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            The same agent, <span className="accent-text">across the whole business.</span>
          </m.h2>
          <m.p
            className="fx-sub"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            Agents are defined by the role they play, not the department they sit in - so one
            pattern works anywhere the work repeats, from operations and finance to support and
            knowledge work.
          </m.p>
        </div>

        <div ref={hubRef} className={inView ? 'ag-hub play' : 'ag-hub'}>
          <svg className="ag-hub-svg" viewBox={`${-S / 2} ${-S / 2} ${S} ${S}`} aria-hidden="true">
            {POSITIONS.map((p, i) => (
              <m.line
                key={`sp-${i}`}
                x1={0}
                y1={0}
                x2={p.x}
                y2={p.y}
                className="ag-spoke"
                pathLength={1}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={inView ? { pathLength: 1, opacity: 1 } : {}}
                transition={{ duration: 0.55, delay: 0.15 + i * 0.1, ease: [0.3, 0, 0.2, 1] }}
              />
            ))}
            {/* work packets flowing from the core out along each spoke */}
            {inView &&
              POSITIONS.map((p, i) => (
                <m.circle
                  key={`pk-${i}`}
                  r={3.2}
                  className="ag-packet"
                  initial={{ cx: 0, cy: 0, opacity: 0 }}
                  animate={{
                    cx: [0, p.x],
                    cy: [0, p.y],
                    opacity: [0, 0.95, 0],
                  }}
                  transition={{
                    duration: 1.6,
                    times: [0, 0.35, 1],
                    delay: 1.1 + i * 0.55,
                    repeat: Infinity,
                    repeatDelay: 2.2,
                    ease: 'easeInOut',
                  }}
                />
              ))}
          </svg>

          <div className="ag-core">
            <span className="pulse" aria-hidden="true" />
            <span className="t">AGENT</span>
          </div>

          {ROLES.map((role, i) => {
            const p = POSITIONS[i]!
            return (
              <m.span
                key={role}
                className="ag-role"
                style={{
                  left: `calc(50% + ${((p.x / S) * 100).toFixed(2)}%)`,
                  top: `calc(50% + ${((p.y / S) * 100).toFixed(2)}%)`,
                }}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.35 + i * 0.1 }}
              >
                {role}
              </m.span>
            )
          })}
        </div>

        <m.div
          className="ag-output"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
        >
          <span className="k">Typical output</span>
          {OUTPUT.map((item, i) => (
            <span key={item} className="item">
              {item}
              {i < OUTPUT.length - 1 && <span className="dt"> ·</span>}
            </span>
          ))}
        </m.div>
      </section>
    </MotionRoot>
  )
}

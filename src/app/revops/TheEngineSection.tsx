'use client'

import { useRef } from 'react'

import { MotionRoot, VIEWPORT, fadeUp, m, useInView } from '@/components/Motion'

/* Stage names and descriptors are verbatim from the copy doc. */
const STAGES = [
  { name: 'Source & enrich', cap: 'build and clean target lists from live data' },
  { name: 'Research', cap: 'AI agents brief every account and contact' },
  { name: 'Signals', cap: 'track intent, hiring, funding and tech changes' },
  { name: 'Verify', cap: 'validate contacts for deliverability' },
  { name: 'Sequence', cap: 'launch personalised outreach across email and social' },
  { name: 'Route', cap: 'score, qualify and assign to the right rep' },
]

/* 06 · The engine — one pipeline drawn as a vertical spine, sourced at the
   top, synced at the bottom, the six stages alternating sides as the line
   flows through them. */
export function TheEngineSection() {
  const spineRef = useRef<HTMLDivElement | null>(null)
  const inView = useInView(spineRef, { once: true, amount: 0.15 })

  return (
    <MotionRoot>
      <section className="fx-sec" aria-label="The engine">
        <div className="fx-eyebrow">
          <span className="lead">
            <span className="slashes">{'//'}</span> THE ENGINE
          </span>
          <span className="num">06</span>
        </div>

        <div className="fx-head">
          <m.h2
            className="fx-h2"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            One pipeline. <span className="accent-text">Every step connected.</span>
          </m.h2>
          <m.p
            className="fx-sub"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            The capabilities above don&rsquo;t have to run in isolation. We wire them into an engine
            where a lead can move from sourced to synced with zero manual handoffs - your tools,
            vendors and infrastructure unified, orchestrated and handled.
          </m.p>
        </div>

        <div className="rv-spine-wrap">
          <span className="rv-spine-end">SOURCED</span>
          <div ref={spineRef} className={inView ? 'rv-spine play' : 'rv-spine'}>
            <span className="rv-spine-fill" aria-hidden="true" />
            <div role="list" aria-label="The pipeline">
              {STAGES.map((s, i) => (
                <div key={s.name} className="rv-stage" role="listitem">
                  <span className="node" aria-hidden="true" />
                  <div className="body">
                    <span className="idx">{String(i + 1).padStart(2, '0')}</span>
                    <div className="name">{s.name}</div>
                    <p className="cap">{s.cap}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <span className="rv-spine-end synced">SYNCED</span>
        </div>
      </section>
    </MotionRoot>
  )
}

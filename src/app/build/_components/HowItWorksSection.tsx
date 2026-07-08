'use client'

import { useRef } from 'react'

import { MotionRoot, VIEWPORT, fadeUp, m, useInView } from './Motion'

const STEPS = [
  { idx: '01', name: 'Scope', cap: 'With the people who live the problem.' },
  { idx: '02', name: 'Build', cap: 'Code, and low-code where it makes sense.' },
  { idx: '03', name: 'Connect', cap: 'Wired into the systems you already run.' },
  { idx: '04', name: 'Ship', cap: 'Something your team actually uses.' },
]

/* 05 · How it works — a described problem becomes working software.
   The line-draw + node choreography stays in CSS (keyed off `.play`);
   motion's useInView is the trigger. */
export function HowItWorksSection() {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const inView = useInView(trackRef, { once: true, amount: 0.35 })

  return (
    <MotionRoot>
      <section className="fx-sec" aria-label="How it works">
        <div className="fx-eyebrow">
          <span className="lead">
            <span className="slashes">{'//'}</span> HOW IT WORKS
          </span>
          <span className="num">05</span>
        </div>

        <div className="hiw-head">
          <m.h2 className="fx-h2" variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT}>
            From a described problem to <span className="accent-text">working software.</span>
          </m.h2>
          <m.p className="fx-sub" variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT}>
            We scope the problem with the people who live it, build with code and low-code where it
            makes sense, connect it to your systems, and ship something your team actually uses.
          </m.p>
        </div>

        <div
          ref={trackRef}
          className={inView ? 'hiw-track play' : 'hiw-track'}
          role="list"
          aria-label="The build process"
        >
          <span className="hiw-fill" aria-hidden="true" />
          {STEPS.map((s) => (
            <div key={s.idx} className="hiw-step" role="listitem">
              <span className="node" aria-hidden="true" />
              <span className="idx">{s.idx}</span>
              <div className="name">{s.name}</div>
              <p className="cap">{s.cap}</p>
            </div>
          ))}
        </div>
      </section>
    </MotionRoot>
  )
}

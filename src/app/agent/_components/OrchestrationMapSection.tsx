'use client'

import { Fragment, useRef } from 'react'

import { MotionRoot, VIEWPORT, fadeUp, m, staggerParent, useInView } from '@/components/Motion'

const LAYERS = ['Trigger', 'Context', 'Reasoning', 'Tools', 'Control', 'Action']

const CONTROLS = [
  'Permissions',
  'Human gates',
  'Confidence thresholds',
  'Audit logs',
  'Escalation paths',
]

/* 03 · Orchestration & control — the chained layers, and what keeps them safe. */
export function OrchestrationMapSection() {
  const chainRef = useRef<HTMLDivElement | null>(null)
  const inView = useInView(chainRef, { once: true, amount: 0.4 })

  return (
    <MotionRoot>
      <section className="fx-sec" aria-label="Orchestration and control">
        <div className="fx-eyebrow">
          <span className="lead">
            <span className="slashes">{'//'}</span> ORCHESTRATION &amp; CONTROL
          </span>
          <span className="num">03</span>
        </div>

        <div className="fx-head">
          <m.h2
            className="fx-h2"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            One agent helps.{' '}
            <span className="accent-text">A system of them changes how work moves.</span>
          </m.h2>
          <m.p
            className="fx-sub"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            Work moves end to end without the manual relay - that&rsquo;s orchestration. Agents
            chained into one flow, each taking a step and passing to the next, your tools and people
            included. Every step stays inside set permissions, with human approval where it matters
            and a full audit trail.
          </m.p>
        </div>

        <div ref={chainRef} className={inView ? 'ag-chain play' : 'ag-chain'}>
          <span className="ag-chain-label">The layers each agent moves through</span>
          <div className="ag-chain-row" role="list" aria-label="Agent layers">
            {LAYERS.map((layer, i) => (
              <Fragment key={layer}>
                {i > 0 && <span className="ag-link" aria-hidden="true" />}
                <span className="ag-node" role="listitem">
                  {layer}
                </span>
              </Fragment>
            ))}
          </div>
        </div>

        <m.div
          className="ag-rail"
          variants={staggerParent(0.07)}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
        >
          <m.span className="ag-rail-label" variants={fadeUp}>
            Stays under control
          </m.span>
          <div className="ag-rail-chips" role="list" aria-label="Controls">
            {CONTROLS.map((c) => (
              <m.span key={c} className="ag-chip" role="listitem" variants={fadeUp}>
                {c}
              </m.span>
            ))}
          </div>
        </m.div>
      </section>
    </MotionRoot>
  )
}

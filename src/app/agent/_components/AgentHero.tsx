'use client'

import { useRef } from 'react'

import { MotionRoot, VIEWPORT, fadeUp, m, useInView } from '@/components/Motion'
import { ScrollLink } from '@/components/ScrollLink'

import { DesignAgentButton } from './DesignAgentButton'

/* The six repetitive tasks from the copy doc. Shown as a connected cycle -
   no figures, no scale, just the loop the work keeps running through. */
const TASKS = [
  'Chasing information',
  'Copying between tools',
  'Manual checks',
  'Routing and triage',
  'Status chasing',
  'Repetitive reporting',
]

const ROW_H = 60

/* 02 · Where the time goes — the felt problem, carrying the page's CTAs.
   The right side draws the repetitive tasks as one continuous loop, with a
   pulse that keeps circling: the work that never finishes. */
export function AgentHero() {
  const loopRef = useRef<HTMLDivElement | null>(null)
  const inView = useInView(loopRef, { once: true, amount: 0.4 })

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

          <div
            ref={loopRef}
            className={inView ? 'ag-loop play' : 'ag-loop'}
            style={{ '--travel': `${(TASKS.length - 1) * ROW_H}px` } as React.CSSProperties}
          >
            <span className="ag-loop-rail" aria-hidden="true" />
            <span className="ag-loop-fill" aria-hidden="true" />
            <span className="ag-loop-return" aria-hidden="true" />
            <span className="ag-loop-comet" aria-hidden="true" />
            <ul className="ag-loop-list" role="list" aria-label="The repetitive work">
              {TASKS.map((t) => (
                <li key={t} className="ag-loop-row" style={{ height: `${ROW_H}px` }}>
                  <span className="ag-loop-node" aria-hidden="true" />
                  <span className="ag-loop-lbl">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </MotionRoot>
  )
}

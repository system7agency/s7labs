'use client'

import { useRef } from 'react'

import { MotionRoot, VIEWPORT, fadeUp, m, useInView } from '@/components/Motion'
import { ScrollLink } from '@/components/ScrollLink'

import { DesignAgentButton } from './DesignAgentButton'

/* The six repetitive tasks from the copy doc, weighted by how much of the
   week each tends to eat. The widths are relative visual weight, not
   published figures. */
const DRAINS: { label: string; w: number }[] = [
  { label: 'Chasing information', w: 0.94 },
  { label: 'Copying between tools', w: 0.8 },
  { label: 'Manual checks', w: 0.67 },
  { label: 'Routing and triage', w: 0.55 },
  { label: 'Status chasing', w: 0.45 },
  { label: 'Repetitive reporting', w: 0.37 },
]

/* 02 · Where the time goes — the felt problem, carrying the page's CTAs.
   The right side charts where the week actually goes: bars fill on scroll
   and hold, so the section shows the weight it's describing. */
export function AgentHero() {
  const chartRef = useRef<HTMLDivElement | null>(null)
  const inView = useInView(chartRef, { once: true, amount: 0.4 })

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

          <div ref={chartRef} className={inView ? 'ag-chart play' : 'ag-chart'} aria-hidden="true">
            <span className="ag-chart-axis">The week, today</span>
            {DRAINS.map((d, i) => (
              <div key={d.label} className="ag-bar">
                <span className="ag-bar-lbl">{d.label}</span>
                <span
                  className="ag-bar-track"
                  style={{ '--w': d.w, '--d': `${0.15 + i * 0.11}s` } as React.CSSProperties}
                >
                  <span className="ag-bar-fill" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MotionRoot>
  )
}

'use client'

import { MotionRoot, VIEWPORT, fadeUp, m, staggerParent } from '@/components/Motion'

const NOT = [
  'Not a SaaS subscription',
  'Not outsourced reps',
  'Not one-off campaigns',
  'Not a black box',
]

/* 05 · The discipline — what GTM engineering is (and is not). The negations
   sit in corner-bracket tickets, echoing the capability cards' corner marks. */
export function TheDisciplineSection() {
  return (
    <MotionRoot>
      <section className="fx-sec" aria-label="The discipline">
        <div className="fx-eyebrow">
          <span className="lead">
            <span className="slashes">{'//'}</span> THE DISCIPLINE
          </span>
          <span className="num">05</span>
        </div>

        <div className="fx-head">
          <m.h2
            className="fx-h2"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            Not a tool. Not an SDR team.{' '}
            <span className="accent-text">A revenue system you own.</span>
          </m.h2>
          <m.p
            className="fx-sub"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            GTM engineering is the discipline of building the automated systems behind go-to-market.
            We connect your data, signals, outreach and CRM into one motion that runs without manual
            effort, so what you get is not a campaign but a system your team owns, operates and
            improves as you grow.
          </m.p>
        </div>

        <m.div
          className="rv-tickets"
          role="list"
          aria-label="What it is not"
          variants={staggerParent(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
        >
          {NOT.map((label) => (
            <m.div key={label} className="rv-ticket" role="listitem" variants={fadeUp}>
              <span className="x" aria-hidden="true">
                ✕
              </span>
              <span className="lbl">{label}</span>
            </m.div>
          ))}
        </m.div>
      </section>
    </MotionRoot>
  )
}

'use client'

import { MotionRoot, VIEWPORT, fadeUp, m, staggerParent } from '@/components/Motion'

const NOT = [
  'Not a SaaS subscription',
  'Not outsourced reps',
  'Not one-off campaigns',
  'Not a black box',
]

/* 05 · The discipline — what GTM engineering is (and is not). The negations
   sit in corner-bracket tickets; a heavily cropped orbit ring bleeds in from
   the right (client: "the circle… a bit more cut off… on this side"). */
export function TheDisciplineSection() {
  return (
    <MotionRoot>
      <section className="fx-sec rv-disc" aria-label="The discipline">
        <m.div
          className="rv-orb"
          aria-hidden="true"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 1.1, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <svg viewBox="0 0 760 760" className="rv-orb-svg">
            <defs>
              <radialGradient id="rv-orb-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.13" />
                <stop offset="55%" stopColor="var(--accent)" stopOpacity="0.045" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="380" cy="380" r="300" fill="url(#rv-orb-glow)" />
            <g className="rv-orb-drift">
              <circle
                cx="380"
                cy="380"
                r="340"
                fill="none"
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="1.1"
                strokeDasharray="1 7"
                strokeLinecap="round"
              />
              <circle
                cx="380"
                cy="380"
                r="288"
                fill="none"
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth="1"
              />
              <path
                className="rv-orb-arc"
                d="M 380 40 A 340 340 0 0 1 674.4 210"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </g>
            <circle cx="380" cy="380" r="2" fill="rgba(255, 255, 255, 0.2)" />
          </svg>
        </m.div>

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

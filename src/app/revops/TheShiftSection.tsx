'use client'

import { MotionRoot, VIEWPORT, fadeUp, m, staggerParent } from '@/components/Motion'

const ROWS: [string, string][] = [
  ['Hire more reps for manual work', 'Build systems that do it for you'],
  ['Buy another tool, hope it sticks', 'Connect the tools you already run'],
  ['Clean the CRM by hand', 'Keep data accurate automatically'],
  ['Chase follow-ups manually', 'Trigger the next action automatically'],
  ['Send more, measure activity', 'Act on intent, measure outcomes'],
]

const DRAW = { duration: 1.4, ease: [0.3, 0, 0.2, 1] as const }

/* 03 · The shift — the ledger of old habits vs engineered replacements,
   beside the curve that explains why: headcount flattens, systems compound. */
export function TheShiftSection() {
  return (
    <MotionRoot>
      <section className="fx-sec" aria-label="The shift">
        <div className="fx-eyebrow">
          <span className="lead">
            <span className="slashes">{'//'}</span> THE SHIFT
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
            The old way to grow was to hire.{' '}
            <span className="accent-text">The new way is to engineer.</span>
          </m.h2>
          <m.p
            className="fx-sub"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            Grow faster or run leaner. Usually both. Today you do both by engineering the system,
            not by adding to the team. And with most companies still running revenue operations
            without real automation, the teams that move first pull ahead.
          </m.p>
        </div>

        <div className="rv-shift-grid">
          <m.div
            variants={staggerParent(0.09)}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            <m.div className="rv-ledger-head" variants={fadeUp}>
              <span className="old">Resourcing your team</span>
              <span />
              <span className="new">Engineering your team</span>
            </m.div>
            {ROWS.map(([oldWay, newWay]) => (
              <m.div key={oldWay} className="rv-row" variants={fadeUp}>
                <span className="old">{oldWay}</span>
                <span className="arr" aria-hidden="true">
                  →
                </span>
                <span className="new">{newWay}</span>
              </m.div>
            ))}
          </m.div>

          <div className="rv-curves" aria-hidden="true">
            <svg viewBox="0 0 440 300">
              {/* axes */}
              <line className="axis" x1="24" y1="270" x2="424" y2="270" />
              <line className="axis" x1="24" y1="270" x2="24" y2="24" />
              {/* add people — flattens */}
              <m.path
                className="flat"
                d="M 24 262 C 130 196, 220 176, 420 168"
                pathLength={1}
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={VIEWPORT}
                transition={DRAW}
              />
              {/* engineer the system — compounds */}
              <m.path
                className="comp"
                d="M 24 262 C 180 254, 300 210, 420 56"
                pathLength={1}
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={VIEWPORT}
                transition={{ ...DRAW, delay: 0.25 }}
              />
            </svg>
            <div className="rv-legend">
              <m.span variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT}>
                <i /> Resourcing your team
              </m.span>
              <m.span
                className="on"
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={VIEWPORT}
              >
                <i /> Engineering your team
              </m.span>
            </div>
          </div>
        </div>
      </section>
    </MotionRoot>
  )
}

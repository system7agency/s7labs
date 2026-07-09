'use client'

import { MotionRoot, VIEWPORT, fadeUp, m, staggerParent } from './Motion'

const TRAITS = [
  { idx: '01', label: 'Built fast' },
  { idx: '02', label: 'Fitted exactly' },
  { idx: '03', label: 'Easy to change' },
  { idx: '04', label: 'Yours to own' },
]

/* 03 · The advantage — your knowledge of the business is the raw material. */
export function TheAdvantageSection() {
  return (
    <MotionRoot>
      <section className="fx-sec" aria-label="The advantage">
        <div className="fx-eyebrow">
          <span className="lead">
            <span className="slashes">{'//'}</span> THE ADVANTAGE
          </span>
          <span className="num">03</span>
        </div>

        <div className="adv-grid">
          <div>
            <m.h2 className="fx-h2" variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT}>
              You know your business better than <span className="accent-text">any vendor</span>{' '}
              ever will.
            </m.h2>
            <m.p className="fx-sub" variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT}>
              You can already describe where work breaks down, what is missing and what would make
              your business faster. And now that bespoke software is fast to build - we can turn
              that knowledge into working tools and automations you own.
            </m.p>
          </div>

          <m.div
            className="adv-traits"
            role="list"
            aria-label="What that gets you"
            variants={staggerParent(0.09)}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            {TRAITS.map((t) => (
              <m.div key={t.idx} className="adv-cell" role="listitem" variants={fadeUp}>
                <span className="idx">{t.idx}</span>
                <span className="lbl">{t.label}</span>
              </m.div>
            ))}
          </m.div>
        </div>
      </section>
    </MotionRoot>
  )
}

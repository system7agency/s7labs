'use client'

import { ScrollLink } from '@/components/ScrollLink'

import { MotionRoot, VIEWPORT, fadeUp, m } from './Motion'
import { StartBuildButton } from './StartBuildButton'
import { TheOldWayViz } from './TheOldWayViz'

/* 02 · The old way — the felt pain, then the pivot to what we do instead. */
export function TheOldWaySection() {
  return (
    <MotionRoot>
      <section className="fx-sec" aria-label="The old way">
        <div className="fx-eyebrow">
          <span className="lead">
            <span className="slashes">{'//'}</span> THE OLD WAY
          </span>
          <span className="num">02</span>
        </div>

        <div className="ow-layout">
          <div className="ow-copy">
            <div className="ow-head">
          <m.h2 className="fx-h2" variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT}>
            Most software wasn&rsquo;t built for your business.{' '}
            <span className="accent-text">It was built for everyone else&rsquo;s.</span>
          </m.h2>
          <m.p className="fx-sub" variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT}>
            So you adapt - paying for a hundred features to use six, bending your process to fit the
            tool, patching the gaps with spreadsheets and manual handoffs. Every workaround is a
            system in disguise - one you don&rsquo;t control.
          </m.p>
        </div>

        <m.p className="ow-turn" variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT}>
          We build <span className="accent-text">the opposite</span> - made for one business, not a
          market.
        </m.p>

            <m.div
              className="ow-ctas"
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={VIEWPORT}
            >
              <StartBuildButton />
              <ScrollLink className="btn ghost" href="#what-we-build">
                <span>See what we build</span>
              </ScrollLink>
            </m.div>
          </div>

          <m.div
            className="ow-side"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            <TheOldWayViz />
          </m.div>
        </div>
      </section>
    </MotionRoot>
  )
}

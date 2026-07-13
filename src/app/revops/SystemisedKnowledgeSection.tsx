'use client'

import { openContactModal } from '@/components/ContactModal'
import { MotionRoot, VIEWPORT, fadeUp, m } from '@/components/Motion'

import { CtaButton } from './CtaButton'

/* 02 · Systemised knowledge — the page's primary CTAs live here, since the
   hero is locked. A huge outlined ghost word gives the section depth without
   a panel (echoing the hero's background word). */
export function SystemisedKnowledgeSection() {
  return (
    <MotionRoot>
      <section className="fx-sec" aria-label="Systemised knowledge">
        <m.span
          className="rv-ghost"
          aria-hidden="true"
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 1.2, ease: [0.2, 0.7, 0.2, 1] }}
        >
          SYSTEMS
        </m.span>

        <div className="fx-eyebrow">
          <span className="lead">
            <span className="slashes">{'//'}</span> GTM ENGINEERING
          </span>
          <span className="num">02</span>
        </div>

        <div className="rv-sysk">
          <m.h2
            className="fx-h2"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            Your market knowledge is the advantage. <span className="accent-text">Systems</span> are
            how it scales.
          </m.h2>
          <m.p
            className="fx-sub"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            You already know your market and where the revenue is. We turn that knowledge into the
            systems that act on it, so the manual work runs itself and your team stays on what
            actually closes.
          </m.p>
          <m.div
            className="fx-ctas"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            <CtaButton onClick={() => openContactModal('revops-map-engine')} arrow>
              Map your revenue engine
            </CtaButton>
            {/* Per the copy doc, this scrolls to the Capabilities section. */}
            <CtaButton href="#capabilities" variant="secondary">
              See a system in action
            </CtaButton>
          </m.div>
        </div>
      </section>
    </MotionRoot>
  )
}

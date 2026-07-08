'use client'

import { MotionRoot, VIEWPORT, fadeUp, m, staggerParent } from '@/components/Motion'

const LAYERS = ['Your systems', 'Your rules', 'Your data']

/* 05 · The model — build studio positioning. The stack diagram makes the
   argument: your layers are permanent, the model on top is swappable. */
export function TheModelSection() {
  return (
    <MotionRoot>
      <section className="fx-sec" aria-label="The model">
        <div className="fx-eyebrow">
          <span className="lead">
            <span className="slashes">{'//'}</span> THE MODEL
          </span>
          <span className="num">05</span>
        </div>

        <div className="ag-model">
          <m.h2
            className="fx-h2"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            You don&rsquo;t subscribe to agents. You build a{' '}
            <span className="accent-text">model-agnostic capability.</span>
          </m.h2>

          <div>
            <m.p
              className="fx-sub"
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={VIEWPORT}
            >
              Most agent tools hand you a platform and leave you to configure it. We work the other
              way - S<sup>7</sup> Labs designs, connects and scales a custom AI stack around your
              systems, your rules and your data, then grows it as the agents earn trust. The stack
              is model-agnostic, so we run whatever model leads the market and swap as that changes
              - you are never locked to one provider.
            </m.p>

            <m.div
              className="ag-stack"
              aria-hidden="true"
              variants={staggerParent(0.1)}
              initial="hidden"
              whileInView="show"
              viewport={VIEWPORT}
            >
              <m.div className="ag-slot" variants={fadeUp}>
                <span>The model</span>
                <span className="tag">Model-agnostic</span>
              </m.div>
              {LAYERS.map((layer) => (
                <m.div key={layer} className="ag-layer" variants={fadeUp}>
                  {layer}
                </m.div>
              ))}
              <m.span className="ag-stack-cap" variants={fadeUp}>
                Never locked to one provider
              </m.span>
            </m.div>
          </div>
        </div>
      </section>
    </MotionRoot>
  )
}

/* ==========================================================================
   TheModelSection — Agent Section 05: "The model".
   Positioning: we are a build studio, not a SaaS platform. The custom AI stack
   is model-agnostic, so it stays current. Lean text section reusing the shared
   `.sec` layout (eyebrow, header, subhead) from page-styles.css.
   ========================================================================== */

export function TheModelSection() {
  return (
    <section className="sec reveal" data-sec="05">
      <div className="sec-tag">
        <span className="n">05</span>
        <span className="lbl">
          <span>{'// THE MODEL'}</span>
          <span className="v">THE MODEL</span>
        </span>
      </div>
      <div className="sec-head">
        <div className="left">
          <h2>
            You don&rsquo;t subscribe to agents. You build a{' '}
            <span className="accent-text">model-agnostic capability.</span>
          </h2>
          <p>
            Most agent tools hand you a platform and leave you to configure it. We work the other
            way - S<sup>7</sup> Labs designs, connects and scales a custom AI stack around your
            systems, your rules and your data, then grows it as the agents earn trust. The stack is
            model-agnostic, so we run whatever model leads the market and swap as that changes - you
            are never locked to one provider.
          </p>
        </div>
        <div className="right">
          <span className="pd" />
          <span>
            MODEL-AGNOSTIC · <span className="v">SWAPPABLE</span>
          </span>
        </div>
      </div>
    </section>
  )
}

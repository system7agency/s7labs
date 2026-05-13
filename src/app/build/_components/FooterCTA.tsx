import { CommissionCTA } from './CommissionCTA'

export function FooterCTA() {
  return (
    <section className="sec">
      <div className="cta-term reveal">
        <span className="corner tl" />
        <span className="corner tr" />
        <span className="corner bl" />
        <span className="corner br" />
        <div className="prompt-line">
          <span className="p">system7 ~$</span>
          <span>commission --build</span>
          <span className="v">--problem-worth-solving</span>
        </div>
        <h2>
          Got a problem <span className="accent-text">worth building for?</span>
        </h2>
        <p className="sub">
          30-minute discovery call. Bring the problem. We&rsquo;ll bring the build plan.
        </p>
        <div className="row">
          <CommissionCTA />
          <div className="status-row">
            <span className="dot" />
            <span>RESPONSE WITHIN 24H</span>
            <span className="sep" />
            <span className="v">UK TIMEZONE</span>
          </div>
        </div>
      </div>
    </section>
  )
}

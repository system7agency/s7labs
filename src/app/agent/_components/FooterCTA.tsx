import { DesignAgentButton } from './DesignAgentButton'

export function FooterCTA() {
  return (
    <section className="sec" id="cta">
      <div className="cta-block reveal">
        <span className="corner tl" />
        <span className="corner tr" />
        <span className="corner bl" />
        <span className="corner br" />

        <div className="cta-grid">
          <div className="cta-main">
            <div className="eye">
              {'// '}
              <span className="v">START HERE</span>
            </div>
            <h2>
              Bring us the work.{' '}
              <span className="accent-text">We&rsquo;ll build the system around it.</span>
            </h2>
            <p className="sub">
              If your team keeps doing repetitive, multi-step work - research, monitoring, routing,
              reconciliation, reporting - it can probably be built. Tell us where the friction is
              and we&rsquo;ll map the system around it.
            </p>
            <div className="row">
              <DesignAgentButton label="Map the system" />
              <a className="btn ghost" href="/mini-apps">
                <span>Browse live apps</span>
              </a>
            </div>
          </div>
          <aside className="cta-block-side">
            <div className="tb-row">
              <span className="tb-l">PROJECT</span>
              <span className="tb-r">S7 LABS</span>
            </div>
            <div className="tb-row">
              <span className="tb-l">ROUTE</span>
              <span className="tb-r">_02 · AGENT</span>
            </div>
            <div className="tb-row">
              <span className="tb-l">REVISION</span>
              <span className="tb-r">r.04</span>
            </div>
            <div className="tb-row">
              <span className="tb-l">SHEET</span>
              <span className="tb-r">06 / 06</span>
            </div>
            <div className="tb-row">
              <span className="tb-l">SCALE</span>
              <span className="tb-r">1 : 1</span>
            </div>
          </aside>
        </div>

        <div className="status-row">
          <span className="dot" />
          <span>
            RESPONSE WITHIN <span className="v">24 HOURS</span>
          </span>
          <span className="sep" />
          <span>UK ENGINEERING</span>
          <span className="sep" />
          <span>UK TIMEZONE</span>
        </div>
      </div>
    </section>
  )
}

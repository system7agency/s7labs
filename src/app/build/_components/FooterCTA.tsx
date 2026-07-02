import { StartBuildButton } from './StartBuildButton'

export function FooterCTA() {
  return (
    <section className="sec">
      <div className="cta-block reveal">
        <span className="corner tl" />
        <span className="corner tr" />
        <span className="corner bl" />
        <span className="corner br" />
        <div className="eye">
          {'// '}
          <span className="v">START HERE</span>
        </div>
        <h2>
          Bring us the problem.{' '}
          <span className="accent-text">We&rsquo;ll build the system around it.</span>
        </h2>
        <p className="sub">
          If your team keeps describing a tool they wish they had, or a manual process that will not
          go away - quoting, approvals, routing, reporting, handoffs - it can probably be built. Tell
          us where the friction is and we&rsquo;ll map the system around it.
        </p>
        <div className="row">
          <StartBuildButton label="Map the system" />
          <div className="status-row">
            <span className="dot" />
            <span>RESPONSE WITHIN 24 HOURS</span>
            <span className="sep" />
            <span className="v">UK ENGINEERING</span>
          </div>
        </div>
      </div>
    </section>
  )
}

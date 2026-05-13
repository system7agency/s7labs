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
          <span className="v">READY</span>
        </div>
        <h2>
          Bring us the idea. <span className="accent-text">We&rsquo;ll build the system.</span>
        </h2>
        <p className="sub">
          If there is a product your team keeps describing, a tool your business keeps missing or a
          system off-the-shelf software cannot quite solve, System7 can help define, design, build
          and ship it.
        </p>
        <div className="row">
          <StartBuildButton />
          <div className="status-row">
            <span className="dot" />
            <span>RESPONSE WITHIN 24H</span>
            <span className="sep" />
            <span className="v">UK ENGINEERING</span>
            <span className="sep" />
            <span>UK TIMEZONE</span>
          </div>
        </div>
      </div>
    </section>
  )
}

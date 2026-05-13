export function FooterCTA() {
  return (
    <section className="section">
      <div className="cta-block reveal">
        <div className="accent-dot-row" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="eye">
          {'// '}
          <span className="v">READY</span>
        </div>
        <h2>
          Let&rsquo;s build your <span className="accent-text">next venture</span>.
        </h2>
        <p className="sub">30-minute discovery call. No deck required. We bring the questions.</p>
        <div className="status-row" style={{ marginTop: 36, opacity: 1, animation: 'none' }}>
          <span className="dot" />
          <span>RESPONSE WITHIN 24H</span>
          <span className="sep" />
          <span className="v">UK TIMEZONE</span>
          <span className="sep" />
          <span>INVITE-ONLY</span>
        </div>
      </div>
    </section>
  )
}

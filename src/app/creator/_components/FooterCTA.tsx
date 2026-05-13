import { BookingCTA } from './BookingCTA'

export function FooterCTA() {
  return (
    <section className="section">
      <div className="section-head">
        <span className="section-eyebrow">
          <span className="accent-dot" />
          {'// READY'}
        </span>
        <span className="section-num">06 / 06</span>
      </div>

      <div className="footer-cta">
        <div className="accent-dot-row" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <h2>
          Ready to own your <span className="accent-text">audience?</span>
        </h2>

        <p className="cta-sub">
          One discovery call. We scope your product, map your audience, and tell you exactly what
          we&rsquo;d build.
        </p>

        <BookingCTA label="Book Discovery Call" />

        <div className="subline">SYSTEM7 · CREATOR LAB · INVITE-ONLY</div>
      </div>
    </section>
  )
}

import { BookingCTA } from './BookingCTA'

export function CreatorHero() {
  return (
    <section className="hero">
      <div className="hero-eyebrow">
        <span className="accent-dot" />
        ROUTE_02 — CREATOR LAB
      </div>

      <div className="hero-title-wrap">
        <div className="osc-rings" aria-hidden="true">
          <div className="ring" />
          <div className="r2 ring" />
          <div className="r3 ring" />
        </div>

        <div className="hero-bg-word" aria-hidden="true">
          CREATOR
        </div>

        <h1 className="hero-title">
          <span id="hero-type-target" className="type-target">
            Build software your audience pays for.
          </span>
          <span className="type-cursor" aria-hidden="true" />
        </h1>
      </div>

      <p className="hero-subtitle">
        S7 Labs designs and ships software products for creators — tools your audience actually
        wants, on a platform you own and control.
      </p>

      <div className="hero-meta">
        <span>MICRO</span>
        <span className="sep" />
        <span>MACRO</span>
        <span className="sep" />
        <span>BUSINESS</span>
        <span className="sep" />
        <span className="invite">INVITE-ONLY</span>
      </div>

      <div className="hero-cta-wrap">
        <BookingCTA label="Book Discovery Call" />
      </div>

      <div className="scroll-hint">
        <span>EXPLORE</span>
        <span className="line" />
      </div>
    </section>
  )
}

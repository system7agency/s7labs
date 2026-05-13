import { CommissionCTA } from './CommissionCTA'

export function BuildHero() {
  return (
    <section className="hero">
      <div className="code-rain" id="codeRain" aria-hidden="true" />
      <div className="hero-eyebrow">
        <span className="accent-dot" />
        BUILD LAB · EST. 2025
      </div>
      <div className="hero-title-wrap">
        <div className="osc-rings" aria-hidden="true">
          <div className="ring" />
          <div className="ring r2" />
          <div className="ring r3" />
        </div>
        <div className="hero-bg-word" aria-hidden="true">
          BUILD
        </div>
        <h1 className="hero-title">
          <span className="line l1" aria-label="We don't just talk about AI.">
            <span className="typed" data-text="We don't just talk about AI." />
            <span className="caret" aria-hidden="true" />
          </span>
          <span className="line l2">
            <span className="accent-text">We ship it.</span>
          </span>
        </h1>
      </div>
      <p className="hero-subtitle">
        Custom AI systems for teams defining the future of their industry — designed, built, and
        shipped by System7 engineers.
      </p>
      <div className="cta-row">
        <CommissionCTA />
      </div>
      <div className="status-row">
        <span className="dot" />
        <span className="v">2 LIVE PRODUCTS</span>
        <span className="sep" />
        {/* NOTE (SYS-499): Design says "3+ IN DEVELOPMENT" — verify count with Nicolas. */}
        <span>3+ IN DEVELOPMENT</span>
        <span className="sep" />
        <span className="v">UK ENGINEERING</span>
      </div>
    </section>
  )
}

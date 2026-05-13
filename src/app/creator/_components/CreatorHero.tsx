export function CreatorHero() {
  return (
    <section className="hero">
      <div className="hero-eyebrow">
        <span className="accent-dot" />
        CREATOR LAB · EST. 2025
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
          <span className="line l1" aria-label="Technology is no longer a barrier.">
            <span className="typed" data-text="Technology is no longer a barrier." />
            <span className="caret" aria-hidden="true" />
          </span>
          <span className="line l2">
            <span className="accent-text">Own your audience.</span>
          </span>
        </h1>
      </div>

      <p className="hero-subtitle">
        We partner with creators to build digital products that turn followers into recurring
        revenue — apps, brands, and businesses that you own.
      </p>

      <div className="status-row">
        <span className="dot" />
        <span className="v">ACTIVE</span>
        <span className="sep" />
        <span>100K–1M FOLLOWER RANGE</span>
        <span className="sep" />
        <span>UK CREATORS</span>
        <span className="sep" />
        <span className="v">INVITE-ONLY</span>
      </div>
    </section>
  )
}

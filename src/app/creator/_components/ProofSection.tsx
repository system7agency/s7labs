const PENDING = [
  { ttl: 'ENGAGEMENT_02', desc: 'In qualification · Q3 confirm' },
  { ttl: 'ENGAGEMENT_03', desc: 'In qualification · Q4 confirm' },
  { ttl: 'ENGAGEMENT_04', desc: 'Reserved · invitation pending' },
] as const

export function ProofSection() {
  return (
    <section className="section reveal">
      <div className="section-head">
        <span className="section-eyebrow">
          <span className="accent-dot" />
          {'// 05 / 05 · IN PROGRESS'}
        </span>
        <span className="section-num">
          05 / 05 · <span className="v">LIVE</span>
        </span>
      </div>

      <div className="copy proof-intro">
        <h2>Live, not theoretical.</h2>
        <p>
          Our first build is in development now with a fitness creator. More partnerships in
          qualification. Every project becomes a reference for the next.
        </p>
      </div>

      <article className="proof-card">
        <span className="corner tl" />
        <span className="corner tr" />
        <span className="corner bl" />
        <span className="corner br" />

        <div className="pill">ENGAGEMENT_01</div>
        <h3>Dr Gains</h3>
        <p className="body">
          Mobile app for personalized strength programming. Built around an existing community of
          500K+ followers — turning daily content into a daily product loop.
        </p>
        <div className="status">
          <span className="dot" />
          <span className="v">IN DEVELOPMENT</span>
          <span className="sep" />
          <span>MOBILE APP</span>
          <span className="sep" />
          <span className="v">LAUNCH Q3</span>
        </div>
        <a
          href="https://deck.s7labs.ai/dr-gains"
          className="deck-link"
          target="_blank"
          rel="noopener"
        >
          <span>View deck</span>
          <span className="arr" aria-hidden="true">
            →
          </span>
        </a>
      </article>

      <div className="pending-row">
        {PENDING.map((p) => (
          <div key={p.ttl} className="pending">
            <div className="lbl">pending</div>
            <div className="ttl">{p.ttl}</div>
            <div className="desc">{p.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

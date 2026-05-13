const WHY = [
  {
    meta: '// engineering',
    bin: '0101',
    ttl: 'AI-native engineering',
    desc: 'Built faster, shipped sooner.',
  },
  {
    meta: '// business',
    bin: '0110',
    ttl: 'Business-first',
    desc: 'We build companies, not just apps.',
  },
  {
    meta: '// alignment',
    bin: '1001',
    ttl: 'Shared upside',
    desc: 'Joint venture model. We win when you win.',
  },
  {
    meta: '// horizon',
    bin: '1010',
    ttl: 'Path to exit',
    desc: 'Designed from day one for long-term value.',
  },
] as const

export function AdvantageSection() {
  return (
    <section className="section reveal">
      <div className="section-head">
        <span className="section-eyebrow">
          <span className="accent-dot" />
          {'// 04 / 05 · ADVANTAGE'}
        </span>
        <span className="section-num">
          04 / 05 · <span className="v">DIFFERENTIATED</span>
        </span>
      </div>

      <div className="grid-2">
        <div className="copy">
          <h2>Built for creators, not for platforms.</h2>
          <p>
            We&rsquo;re not a platform. We&rsquo;re not a marketplace. We&rsquo;re an engineering
            team that partners with creators one at a time, builds real businesses around their
            audience, and shares the upside.
          </p>
        </div>
        <div className="visual">
          <div className="why-grid">
            {WHY.map((w) => (
              <div key={w.ttl} className="why-card" data-why>
                <span className="corner tl" />
                <span className="corner br" />
                <div className="meta">
                  <span>{w.meta}</span>
                  <span className="bin">{w.bin}</span>
                </div>
                <h3 className="ttl">{w.ttl}</h3>
                <p className="desc">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

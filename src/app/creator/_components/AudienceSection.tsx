const TIERS = [
  {
    num: '01',
    label: 'MICRO · 10K–100K',
    name: 'Building audience',
    desc: 'Side hustle. Limited monetization.',
    target: false,
  },
  {
    num: '02',
    label: 'MACRO · 100K–1M',
    name: 'Audience built. Revenue unbuilt.',
    desc: 'Validated reach without a product to monetize. Where we operate.',
    target: true,
  },
  {
    num: '03',
    label: 'BUSINESS · 1M+',
    name: 'Operating creator-CEO',
    desc: 'Already operating. Already owned.',
    target: false,
  },
] as const

export function AudienceSection() {
  return (
    <section className="section">
      <div className="section-head">
        <span className="section-eyebrow">
          <span className="accent-dot" />
          {'// 01 / 05 · AUDIENCE'}
        </span>
        <span className="section-num">
          01 / 05 · <span className="v">FOCUS</span>
        </span>
      </div>

      <div className="audience-grid">
        <div className="audience-copy">
          <h2>Transaction-driven creators with reach.</h2>
          <p>
            Not every creator is the same. We focus on creators who combine audience and business
            mindset — those ready to convert reach into real commercial outcomes.
          </p>
          <p>
            Macro creators between 100,000 and 1 million followers, where audience is large enough
            to validate a product and small enough to stay personal.
          </p>
        </div>

        <div className="tier-stack">
          {TIERS.map((tier) => (
            <div key={tier.num} className={`tier${tier.target ? 'is-target pulse-once' : ''}`}>
              <span className="tier-num">{tier.num}</span>
              <div className="tier-body">
                <div className="tier-label">{tier.label}</div>
                <div className="tier-name">{tier.name}</div>
                <div className="tier-desc">{tier.desc}</div>
              </div>
              {tier.target ? <span className="tier-annot">{'// our target'}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

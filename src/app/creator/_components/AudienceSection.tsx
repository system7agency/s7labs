const TIERS = [
  {
    index: '01',
    label: 'MICRO',
    name: 'Micro Creator',
    range: '10k — 100k followers',
    desc: 'You have a loyal, engaged community. S7 Labs builds the product layer that turns your audience into subscribers and customers.',
    features: [
      'Audience-first product scoping',
      'Launch-ready in under 90 days',
      'Full IP ownership — no rev share',
      'Branded to your identity',
    ],
  },
  {
    index: '02',
    label: 'MACRO',
    name: 'Macro Creator',
    range: '100k+ followers',
    desc: "At scale, one viral post shouldn't determine your month. We build software infrastructure that generates revenue independent of the algorithm.",
    features: [
      'Multi-product architecture',
      'Scalable payment infrastructure',
      'Member-access tooling',
      'Analytics your team can act on',
    ],
  },
  {
    index: '03',
    label: 'BUSINESS',
    name: 'Business Creator',
    range: 'Brand / company',
    desc: 'Corporate content teams and brand accounts with audiences need owned-channel software. We build it — white-labelled, integrated, and yours.',
    features: [
      'Enterprise-grade infrastructure',
      'CRM and stack integration',
      'White-label deployment',
      'Multi-seat team access',
    ],
  },
]

export function AudienceSection() {
  return (
    <section className="section">
      <div className="section-head">
        <span className="section-eyebrow">
          <span className="accent-dot" />
          {'// WHO WE BUILD FOR'}
        </span>
        <span className="section-num">
          01 / 06 · <span className="v">CREATOR TIERS</span>
        </span>
      </div>

      <div className="audience-intro">
        <h2>
          Built for creators at <span className="accent-text">every scale.</span>
        </h2>
        <p>
          Whether you&rsquo;re growing a niche community or running a creator business at scale, S7
          Labs builds the product that lives between you and your audience.
        </p>
      </div>

      <div className="tiers-grid">
        {TIERS.map((tier) => (
          <div key={tier.index} className="tier-card">
            <span className="tier-corner tl" />
            <span className="tier-corner br" />

            <div>
              <div className="tier-index">{tier.index}</div>
              <div className="tier-badge" style={{ marginTop: 12 }}>
                <span className="tier-badge-dot" />
                <span className="tier-badge-label">{tier.label}</span>
              </div>
            </div>

            <div>
              <h3 className="tier-name">{tier.name}</h3>
              <p className="tier-range">{tier.range}</p>
            </div>

            <p className="tier-desc">{tier.desc}</p>

            <ul className="tier-features">
              {tier.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

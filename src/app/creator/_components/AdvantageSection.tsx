const ADVANTAGES = [
  {
    num: '01',
    icon: '⚡',
    title: 'Speed',
    desc: "We've shipped creator products before. Our stack is opinionated and fast — no reinventing foundations, just building your thing.",
  },
  {
    num: '02',
    icon: '🔑',
    title: 'Full Ownership',
    desc: "You own the code, the infrastructure, and the product. No rev-share, no vendor lock-in. It's yours on day one.",
  },
  {
    num: '03',
    icon: '🔗',
    title: 'Ecosystem Fit',
    desc: 'We integrate with the tools your audience already uses — payment providers, community platforms, analytics stacks.',
  },
  {
    num: '04',
    icon: '∞',
    title: 'Scale-Ready',
    desc: "Built to handle growth from 100 to 100,000 users. You won't hit a wall when the launch goes bigger than expected.",
  },
]

export function AdvantageSection() {
  return (
    <section className="section">
      <div className="section-head">
        <span className="section-eyebrow">
          <span className="accent-dot" />
          {'// THE S7 ADVANTAGE'}
        </span>
        <span className="section-num">04 / 06</span>
      </div>

      <div className="advantage-header">
        <h2>
          Why creators choose <span className="accent-text">S7 Labs.</span>
        </h2>
      </div>

      <div className="advantage-grid">
        {ADVANTAGES.map((adv) => (
          <div key={adv.num} className="adv-card">
            <span className="adv-corner tl" />
            <span className="adv-corner br" />

            <div className="adv-num">{adv.num}</div>
            <span className="adv-icon" aria-hidden="true">
              {adv.icon}
            </span>
            <h3 className="adv-title">{adv.title}</h3>
            <p className="adv-desc">{adv.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

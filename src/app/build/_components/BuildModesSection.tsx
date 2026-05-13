const MODES = [
  {
    tag: 'MODE_01',
    title: 'Prototype',
    desc: 'A fast, focused version to test the concept, interface or technical path before a larger build.',
  },
  {
    tag: 'MODE_02',
    title: 'MVP',
    desc: 'A usable first product with the core workflows, data and user experience required to prove value.',
  },
  {
    tag: 'MODE_03',
    title: 'Product Sprint',
    desc: 'A defined build window for a specific product, feature set or internal system.',
  },
  {
    tag: 'MODE_04',
    title: 'Embedded Build Team',
    desc: 'System7 works as an extension of the client team to design, build and improve software over time.',
  },
  {
    tag: 'MODE_05',
    title: 'Continuous Improvement',
    desc: 'Ongoing product iteration, new features, integrations and refinements after launch.',
  },
]

export function BuildModesSection() {
  return (
    <section className="sec reveal">
      <div className="sec-tag">
        <span className="n">04</span>
        <span className="lbl">
          <span>{"// 04 / 06"}</span>
          <span className="v">MODES</span>
        </span>
      </div>
      <div className="sec-head">
        <div className="left">
          <h2>Pick your entry point.</h2>
          <p>Not every project starts the same way. Choose the shape that fits your problem.</p>
        </div>
        <div className="right">
          <span>5 MODES</span>
        </div>
      </div>

      <div className="modes">
        {MODES.map((m) => (
          <div key={m.tag} className="mode" data-mode>
            <div className="tag">{m.tag}</div>
            <h4>{m.title}</h4>
            <p className="desc">{m.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

const COMPONENTS = [
  {
    meta: '// interface',
    bin: '01010110',
    title: 'Interface',
    desc: 'The screens, portals, dashboards and user journeys people interact with.',
  },
  {
    meta: '// backend',
    bin: '01000010',
    title: 'Backend Logic',
    desc: 'The rules, calculations, permissions and workflows that make the product operate correctly.',
  },
  {
    meta: '// data',
    bin: '01000100',
    title: 'Data Layer',
    desc: 'The structure, storage and movement of the information the product depends on.',
  },
  {
    meta: '// permissions',
    bin: '01010000',
    title: 'Permissions',
    desc: 'Role-based access, user types, approval rights and safe operating boundaries.',
  },
  {
    meta: '// integrations',
    bin: '01001001',
    title: 'Integrations',
    desc: 'Connections into APIs, databases, SaaS tools and existing business systems.',
  },
  {
    meta: '// ai',
    bin: '01000001',
    title: 'AI Layer',
    desc: 'AI features embedded where they improve the product, not added for novelty.',
  },
  {
    meta: '// analytics',
    bin: '01001110',
    title: 'Analytics',
    desc: 'Reporting, usage visibility, performance tracking and operational insight.',
  },
  {
    meta: '// deployment',
    bin: '01000100',
    title: 'Deployment',
    desc: 'Launch, testing, iteration and support so the product can be used reliably.',
  },
]

export function SoftwareComponentsSection() {
  return (
    <section className="sec reveal">
      <div className="sec-tag">
        <span className="n">03</span>
        <span className="lbl">
          <span>{"// 03 / 06"}</span>
          <span className="v">ANATOMY</span>
        </span>
      </div>
      <div className="sec-head">
        <div className="left">
          <h2>The anatomy of a System7 product.</h2>
          <p>
            Every product we ship is built from the same components — designed to work together,
            scoped to your problem.
          </p>
        </div>
        <div className="right">
          <span>8 COMPONENTS</span>
        </div>
      </div>

      <div className="anatomy">
        {COMPONENTS.map((c) => (
          <div key={c.title} className="acomp" data-acomp>
            <div className="meta">
              <span>{c.meta}</span>
              <span className="bin">{c.bin}</span>
            </div>
            <h4 className="ttl">{c.title}</h4>
            <p className="desc">{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

const STAGES = [
  {
    num: '01',
    eye: '// DEFINE',
    title: 'Define',
    desc: 'We clarify the user, problem, requirements, constraints and desired output before the build begins.',
  },
  {
    num: '02',
    eye: '// DESIGN',
    title: 'Design',
    desc: 'We shape the interface, user journey, data flow and product logic so the software is usable from day one.',
  },
  {
    num: '03',
    eye: '// BUILD',
    title: 'Build',
    desc: 'We engineer the core product: the screens, backend logic, data layer, AI features and system behaviours.',
  },
  {
    num: '04',
    eye: '// CONNECT',
    title: 'Connect',
    desc: 'We integrate the product with the databases, APIs, SaaS tools and internal systems it needs to work.',
  },
  {
    num: '05',
    eye: '// SHIP',
    title: 'Ship',
    desc: 'We launch, test, refine and improve the product so it becomes part of the way the business operates.',
  },
]

export function ProductBuildSystemSection() {
  return (
    <section className="sec reveal">
      <div className="sec-tag">
        <span className="n">02</span>
        <span className="lbl">
          <span>{"// 02 / 06"}</span>
          <span className="v">BUILD SYSTEM</span>
        </span>
      </div>
      <div className="sec-head">
        <div className="left">
          <h2>How a build moves from idea to shipped.</h2>
          <p>
            Define → Design → Build → Connect → Ship. Every project moves through the same five
            stages — sharp scope, working software, real launch.
          </p>
        </div>
        <div className="right">
          <span className="pd" />
          <span>5 STAGES</span>
        </div>
      </div>

      <div className="pipe" id="pipe">
        {STAGES.map((s) => (
          <div key={s.num} className="stage" data-stage>
            <span className="num">{s.num}</span>
            <div className="eye">{s.eye}</div>
            <h3 className="ttl">{s.title}</h3>
            <p className="desc">{s.desc}</p>
          </div>
        ))}
      </div>
      <p className="pipe-note">
        We don&rsquo;t just design concepts or wire together temporary tools. We build
        production-ready software systems with the interface, logic, data and integrations needed
        to work in the real world.
      </p>
    </section>
  )
}

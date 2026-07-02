const STAGES = [
  {
    num: '01',
    eye: '// SCOPE',
    title: 'Scope',
    desc: 'We scope the problem with the people who live it, so the build is shaped around how your team already works.',
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
    desc: 'We build with code and low-code where it makes sense: the screens, logic, data layer and AI features.',
  },
  {
    num: '04',
    eye: '// CONNECT',
    title: 'Connect',
    desc: 'We connect it to your systems - the databases, APIs, SaaS tools and internal systems it needs to work.',
  },
  {
    num: '05',
    eye: '// SHIP',
    title: 'Ship',
    desc: 'We ship something your team actually uses, then test, refine and improve it in the real world.',
  },
]

export function ProductBuildSystemSection() {
  return (
    <section className="sec reveal">
      <div className="sec-tag">
        <span className="n">02</span>
        <span className="lbl">
          <span>{"// 02 / 06"}</span>
          <span className="v">HOW IT WORKS</span>
        </span>
      </div>
      <div className="sec-head">
        <div className="left">
          <h2>From a described problem to working software.</h2>
          <p>
            We scope the problem with the people who live it, build with code and low-code where it
            makes sense, connect it to your systems, and ship something your team actually uses.
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
        to work in the real world - built with code and low-code where it makes sense.
      </p>
    </section>
  )
}

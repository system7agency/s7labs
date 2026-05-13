const STEPS = [
  {
    num: '01',
    eye: '// DISCOVERY',
    ttl: 'Discovery',
    time: 'Weeks 1–2',
    desc: 'We listen. Understand your audience, content, and ambitions.',
  },
  {
    num: '02',
    eye: '// ANALYSIS',
    ttl: 'Analysis',
    time: 'Weeks 2–4',
    desc: 'Audience and product fit modeled with data. Not vibes.',
  },
  {
    num: '03',
    eye: '// BUILD',
    ttl: 'Build',
    time: 'Weeks 4–12',
    desc: 'Design, build, and ship the product. AI-native engineering.',
  },
  {
    num: '04',
    eye: '// LAUNCH',
    ttl: 'Launch',
    time: 'Weeks 12–26',
    desc: 'Go to market. Iterate. Compound.',
  },
] as const

export function ProcessSection() {
  return (
    <section className="section reveal">
      <div className="section-head">
        <span className="section-eyebrow">
          <span className="accent-dot" />
          {'// 03 / 05 · PROCESS'}
        </span>
        <span className="section-num">
          03 / 05 · <span className="v">6 MONTHS</span>
        </span>
      </div>

      <div className="copy process-intro">
        <h2>From audience to product to exit.</h2>
        <p>
          A 6-month cycle from first conversation to launched product. Each stage de-risks the next.
        </p>
      </div>

      <div className="pipeline" id="pipeline">
        {STEPS.map((step) => (
          <div key={step.num} className="pstep" data-step>
            <span className="num">{step.num}</span>
            <div className="eye">{step.eye}</div>
            <h3 className="ttl">{step.ttl}</h3>
            <span className="time">{step.time}</span>
            <p className="desc">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

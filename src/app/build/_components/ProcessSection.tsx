const COMMITS = [
  {
    hash: 'commit · 0x01',
    week: 'WEEK 1',
    branch: 'scope',
    title: 'Scope',
    bodyBefore: 'We define the problem. Sharp brief, narrow target, real users. ',
    code: '--no-vibes',
    bodyAfter: '',
  },
  {
    hash: 'commit · 0x02',
    week: 'WEEKS 1–2',
    branch: 'prototype',
    title: 'Prototype',
    bodyBefore:
      'Working prototype, not slides. We show before we build. You touch it before we scale it.',
    code: '',
    bodyAfter: '',
  },
  {
    hash: 'commit · 0x03',
    week: 'WEEKS 2–6',
    branch: 'build',
    title: 'Build',
    bodyBefore:
      'Engineering team ships. You see weekly progress. Pull-request demos, not status meetings.',
    code: '',
    bodyAfter: '',
  },
  {
    hash: 'commit · 0x04',
    week: 'WEEK 6+',
    branch: 'launch',
    title: 'Launch',
    bodyBefore: 'Live. Real users. Real feedback. We iterate.',
    code: '',
    bodyAfter: '',
  },
] as const

export function ProcessSection() {
  return (
    <section className="sec reveal">
      <div className="sec-tag">
        <span className="n">03</span>
        <span className="lbl">
          <span>{'// 03 / 04'}</span>
          <span className="v">PROCESS</span>
        </span>
      </div>
      <div className="sec-head">
        <div className="left">
          <h2>Idea to shipped, in weeks not quarters.</h2>
          <p>
            Most builds ship in 4–8 weeks. Some faster. We start with a problem worth solving, and
            you see weekly progress against the spec.
          </p>
        </div>
        <div className="right">
          <span>4 — 8 WEEK CYCLE</span>
        </div>
      </div>

      <div className="gitlog">
        {COMMITS.map((c) => (
          <div key={c.hash} className="commit" data-commit>
            <div className="meta">
              <span className="hash">{c.hash}</span>
              <span className="week">{c.week}</span>
              <span className="branch">{c.branch}</span>
            </div>
            <h3>{c.title}</h3>
            <p className="body">
              {c.bodyBefore}
              {c.code ? <code>{c.code}</code> : null}
              {c.bodyAfter}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

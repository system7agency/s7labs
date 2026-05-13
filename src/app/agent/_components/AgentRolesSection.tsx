type Role = {
  rk: string
  tag: string
  title: string
  spark: string
  tags: string[]
}

const ROLES: Role[] = [
  {
    rk: '01',
    tag: 'RESEARCHER',
    title: 'Gathers, compares and structures information from approved sources.',
    spark: '0,18 12,14 24,16 36,10 48,12 60,6 72,8 84,4 100,2',
    tags: ['briefs', 'market scans', 'company profiles', 'source-backed notes'],
  },
  {
    rk: '02',
    tag: 'ANALYST',
    title:
      'Reads data, documents or activity and identifies patterns, exceptions or recommendations.',
    spark: '0,12 10,8 20,14 30,6 40,16 50,8 60,10 70,4 80,12 90,6 100,8',
    tags: ['summaries', 'scorecards', 'exception lists', 'risk flags'],
  },
  {
    rk: '03',
    tag: 'OPERATOR',
    title: 'Executes repeatable system work using connected tools and defined permissions.',
    spark:
      '0,16 12,16 12,8 24,8 24,14 36,14 36,6 48,6 48,12 60,12 60,4 72,4 72,10 84,10 84,8 100,8',
    tags: ['record updates', 'task creation', 'routing', 'scheduled actions'],
  },
  {
    rk: '04',
    tag: 'REVIEWER',
    title: 'Checks work against rules, criteria or standards before it moves forward.',
    spark: '0,12 14,12 14,4 28,4 28,12 42,12 56,12 70,12 70,18 84,18 84,12 100,12',
    tags: ['QA checks', 'compliance flags', 'missing-field reports', 'approval requests'],
  },
  {
    rk: '05',
    tag: 'COORDINATOR',
    title: 'Moves work between agents, tools and people across a multi-step process.',
    spark: '0,12 12,8 24,12 36,6 48,12 60,4 72,12 84,8 100,12',
    tags: ['handoffs', 'escalations', 'next steps', 'status updates'],
  },
  {
    rk: '06',
    tag: 'REPORTER',
    title: 'Turns activity, system changes and outcomes into visibility.',
    spark: '0,20 14,18 28,14 42,12 56,8 70,6 84,4 100,2',
    tags: ['daily briefs', 'audit logs', 'management summaries', 'reporting snapshots'],
  },
]

export function AgentRolesSection() {
  return (
    <section className="sec reveal" data-sec="03">
      <div className="sec-tag">
        <span className="n">03</span>
        <span className="lbl">
          <span>{'// 03 / 06'}</span>
          <span className="v">ROLES</span>
        </span>
      </div>
      <div className="sec-head">
        <div className="left">
          <h2>Six roles agents play.</h2>
          <p>
            Different agents do different work. These roles apply across any business function —
            support, operations, compliance, finance, knowledge, reporting.
          </p>
        </div>
        <div className="right">
          <span className="pd" />
          <span>
            06 ROLES · <span className="v">CROSS-FUNCTION</span>
          </span>
        </div>
      </div>

      <div className="roles">
        {ROLES.map((r) => (
          <article key={r.rk} className="role">
            <div className="role-head">
              <span className="rk">{r.rk}</span>
              <span className="tag">{r.tag}</span>
            </div>
            <h4>{r.title}</h4>
            <div className="role-spark">
              <svg viewBox="0 0 100 24" preserveAspectRatio="none">
                <polyline points={r.spark} fill="none" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </div>
            <div className="tags">
              {r.tags.map((t) => (
                <span key={t} className="x">
                  {t}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

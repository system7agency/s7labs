type Gov = {
  lbl: string
  title: string
  desc: string
  w: string
  amber?: boolean
}

const TILES: Gov[] = [
  {
    lbl: '01 · PERMISSIONS',
    title: 'Permissions',
    desc: 'Define which tools, records and actions each agent can access.',
    w: '72%',
  },
  {
    lbl: '02 · HUMAN GATES',
    title: 'Human gates',
    desc: 'Require approval before sensitive actions are completed.',
    w: '60%',
    amber: true,
  },
  {
    lbl: '03 · CONFIDENCE',
    title: 'Confidence thresholds',
    desc: 'Escalate or pause work when the agent is uncertain.',
    w: '88%',
  },
  {
    lbl: '04 · AUDIT',
    title: 'Audit logs',
    desc: 'Track inputs, reasoning, tool calls, decisions and outputs.',
    w: '96%',
  },
  {
    lbl: '05 · FALLBACKS',
    title: 'Fallbacks',
    desc: 'Route edge cases, errors and exceptions to the right person or process.',
    w: '48%',
  },
  {
    lbl: '06 · MONITORING',
    title: 'Monitoring',
    desc: 'See what agents are doing, where they are blocked and what outcomes they create.',
    w: '84%',
  },
]

export function GovernanceConsoleSection() {
  return (
    <section className="sec reveal" data-sec="06">
      <div className="sec-tag">
        <span className="n">06</span>
        <span className="lbl">
          <span>{'// 06 / 06'}</span>
          <span className="v">GOVERNANCE</span>
        </span>
      </div>
      <div className="sec-head">
        <div className="left">
          <h2>
            Controlled autonomy, <span className="accent-text">not black-box AI.</span>
          </h2>
          <p>
            Every important action has permissions, logs, confidence thresholds and human escalation
            routes.
          </p>
        </div>
        <div className="right">
          <span className="pd" />
          <span>
            06 SAFEGUARDS · <span className="v">ALWAYS-ON</span>
          </span>
        </div>
      </div>

      <div className="gov">
        {TILES.map((t) => (
          <article key={t.lbl} className={t.amber ? 'gcard amber' : 'gcard'}>
            <div className="lbl">{t.lbl}</div>
            <h4>{t.title}</h4>
            <p className="desc">{t.desc}</p>
            <div className="gauge">
              <i style={{ ['--w' as string]: t.w }} />
            </div>
          </article>
        ))}
      </div>

      <div className="log-strip" id="logStrip">
        <span className="ls-head">AUDIT.STREAM</span>
        <span className="log-line">
          <span className="ts">[12:04:18]</span> <span className="ag">agent.research</span>
          <span className="arr">→</span>tool.brave_search ·{' '}
          <span className="v">query.dispatched</span>
        </span>
        <span className="log-line">
          <span className="ts">[12:04:21]</span> <span className="ag">agent.research</span>
          <span className="arr">→</span>context.brief.draft ·{' '}
          <span className="v">confidence=0.92</span>
        </span>
        <span className="log-line">
          <span className="ts">[12:04:23]</span> <span className="amb">human.gate</span>
          <span className="arr">→</span>approval.requested · <span className="amb">pending</span>
        </span>
        <span className="log-line">
          <span className="ts">[12:04:47]</span> <span className="amb">human.gate</span>
          <span className="arr">→</span>approved · <span className="gr">action.logged</span>
        </span>
        <span className="log-line">
          <span className="ts">[12:04:51]</span> <span className="ag">agent.operator</span>
          <span className="arr">→</span>tool.crm.update · <span className="v">record.synced</span>
        </span>
        <span className="log-line">
          <span className="ts">[12:04:56]</span> <span className="ag">agent.report</span>
          <span className="arr">→</span>summary.published · <span className="gr">ok</span>
        </span>
      </div>
    </section>
  )
}

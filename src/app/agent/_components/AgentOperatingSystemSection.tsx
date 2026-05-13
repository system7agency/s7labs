const STRATA = [
  {
    num: '01',
    nm: 'TRIGGER',
    thk: 'surface · 0.2u',
    fill: 'fill-1',
    stat: 'event.detected',
    head: '01 / TRIGGER',
    desc: 'The event, request, schedule or signal that starts the agent. A file arrives, a ticket changes, a report is due or a system detects something that needs action.',
  },
  {
    num: '02',
    nm: 'CONTEXT',
    thk: 'depth · 1.0u',
    fill: 'fill-2',
    stat: 'docs · db · rules',
    head: '02 / CONTEXT',
    desc: 'The knowledge the agent needs to work properly: documents, databases, previous decisions, business rules, customer records and internal knowledge.',
  },
  {
    num: '03',
    nm: 'REASONING',
    thk: 'depth · 1.4u',
    fill: 'fill-3',
    stat: 'analyse · decide',
    head: '03 / REASONING',
    desc: 'The thinking layer where the agent analyses, compares, classifies, plans, summarises, decides, drafts or recommends.',
  },
  {
    num: '04',
    nm: 'TOOLS',
    thk: 'depth · 0.8u',
    fill: 'fill-4',
    stat: 'apis · saas · mcps',
    head: '04 / TOOLS',
    desc: 'The systems the agent can use, including SaaS tools, APIs, browsers, databases, internal systems and custom MCPs.',
  },
  {
    num: '05',
    nm: 'CONTROL',
    thk: 'depth · 0.6u',
    fill: 'fill-5',
    stat: 'permissions · gates',
    head: '05 / CONTROL',
    desc: 'The safety layer: permissions, confidence thresholds, human gates, logs, approvals, fallbacks and escalation paths.',
    amber: true,
  },
  {
    num: '06',
    nm: 'ACTION',
    thk: 'surface · 0.4u',
    fill: 'fill-6',
    stat: 'send · update · route',
    head: '06 / ACTION',
    desc: 'The useful output: update, send, create, route, escalate, report, schedule, notify, approve or hand off.',
  },
]

export function AgentOperatingSystemSection() {
  return (
    <section className="sec reveal" id="agent-os" data-sec="02">
      <div className="sec-tag">
        <span className="n">02</span>
        <span className="lbl">
          <span>{'// 02 / 06'}</span>
          <span className="v">AGENT OS</span>
        </span>
      </div>
      <div className="sec-head">
        <div className="left">
          <h2>
            The operating environment for <span className="accent-text">working agents.</span>
          </h2>
          <p>
            Trigger → Context → Reasoning → Tools → Control → Action. Six layers that turn an AI
            model into an agent that can actually do useful work.
          </p>
        </div>
        <div className="right">
          <span className="pd" />
          <span>
            06 LAYERS · <span className="v">DEPTH SECTION</span>
          </span>
        </div>
      </div>

      <div className="xsec">
        <div className="xsec-grid">
          <div className="xsec-stack" id="xsecStack">
            {STRATA.map((s, idx) => (
              <div key={s.num} className="stratum" data-lyr={idx}>
                <div className={`strat-fill ${s.fill}`} />
                <div className="strat-lbl">
                  <span className="num">{s.num}</span>
                  <span className="nm">{s.nm}</span>
                  <span className="thk">{s.thk}</span>
                </div>
                <div className={s.amber ? 'strat-stat amb' : 'strat-stat'}>{s.stat}</div>
              </div>
            ))}
          </div>

          <div className="xsec-callouts" id="xsecCallouts">
            {STRATA.map((s, idx) => (
              <div key={s.num} className="callout" data-lyr={idx}>
                <div className={s.amber ? 'co-head amb' : 'co-head'}>
                  <span className="ix">{s.head}</span>
                  <span className="st">{s.amber ? '· gated' : '· active'}</span>
                </div>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="xsec-note">
          Agents become useful when they can operate inside a designed system. We define what starts
          them, what they know, what they can use, what they are allowed to do and where a human
          stays in control.
        </div>
      </div>
    </section>
  )
}

type Conn = {
  tag: string
  title: string
  desc: string
  foot: string
  amber?: boolean
}

const CONNS: Conn[] = [
  {
    tag: '01 · CONNECTOR',
    title: 'Standard tool connections',
    desc: 'Agents can connect to the SaaS tools, databases and communication systems your team already uses.',
    foot: 'CRM · DOCS · SLACK · NOTION · DRIVE',
  },
  {
    tag: '02 · CONNECTOR',
    title: 'API integrations',
    desc: 'Agents can read from and write to systems through structured, reliable interfaces.',
    foot: 'REST · GRAPHQL · WEBHOOKS · OAUTH',
  },
  {
    tag: '03 · CONNECTOR',
    title: 'Custom MCPs',
    desc: 'When a workflow needs deeper, safer or more precise tool access, System7 can build the custom connector layer agents need.',
    foot: 'SCOPED · TYPED · AUDIT-READY',
  },
  {
    tag: '04 · GATE',
    title: 'Human gates',
    desc: 'Critical actions can require approval before anything is sent, changed, published, escalated or finalised.',
    foot: 'APPROVE · DEFER · OVERRIDE · LOG',
    amber: true,
  },
]

export function ToolUniverseSection() {
  return (
    <section className="sec reveal" data-sec="05">
      <div className="sec-tag">
        <span className="n">05</span>
        <span className="lbl">
          <span>{'// 05 / 06'}</span>
          <span className="v">TOOL ACCESS</span>
        </span>
      </div>
      <div className="sec-head">
        <div className="left">
          <h2>
            Give agents the tools. <span className="accent-text">Give humans the control.</span>
          </h2>
          <p>
            Agents need to use systems, not just talk about them. We connect agents to the SaaS
            tools, APIs, databases and custom MCPs your business runs on — with permission
            boundaries, approval gates and audit logs designed in.
          </p>
        </div>
        <div className="right">
          <span className="pd" />
          <span>
            04 CONNECTORS · <span className="v">PERMISSIONED</span>
          </span>
        </div>
      </div>

      <div className="connectors">
        {CONNS.map((c) => (
          <article key={c.tag} className={c.amber ? 'conn amber' : 'conn'}>
            <div className="conn-port">
              <span className={c.amber ? 'port-dot amb' : 'port-dot'} />
              <span className={c.amber ? 'port-dot amb' : 'port-dot'} />
              <span className={c.amber ? 'port-dot amb' : 'port-dot'} />
              <span className={c.amber ? 'port-dot amb' : 'port-dot'} />
            </div>
            <div className="tag">{c.tag}</div>
            <h4>{c.title}</h4>
            <p className="desc">{c.desc}</p>
            <div className="conn-foot">{c.foot}</div>
          </article>
        ))}
      </div>
    </section>
  )
}

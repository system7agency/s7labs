const CAPS = [
  {
    n: '01',
    ttl: 'Agents',
    desc:
      'Conversational and task-oriented agents. Voice, chat, email, multi-channel — designed to act, not just answer.',
    bin: '01010110',
  },
  {
    n: '02',
    ttl: 'Workflows',
    desc:
      'Automation pipelines. Scraping, enrichment, inference, delivery — orchestrated end-to-end.',
    bin: '01001110',
  },
  {
    n: '03',
    ttl: 'Dashboards',
    desc:
      'Real-time data products. Visualization, signals, alerts — instrument panels operators can actually steer.',
    bin: '01000100',
  },
  {
    n: '04',
    ttl: 'Integrations',
    desc:
      'API-first. Slots into your CRM, your Slack, your existing stack — without ripping anything out.',
    bin: '01001001',
  },
] as const

export function CapabilitiesSection() {
  return (
    <section className="sec reveal">
      <div className="sec-tag">
        <span className="n">02</span>
        <span className="lbl">
          <span>{'// 02 / 04'}</span>
          <span className="v">SCOPE</span>
        </span>
      </div>
      <div className="sec-head">
        <div className="left">
          <h2>AI-native, built to ship.</h2>
          <p>
            Not chatbots wrapped around a database. Real products, real workflows, real users. We
            build AI tools that solve specific problems for specific teams — and ship them as
            standalone businesses, internal tools, or embedded features.
          </p>
        </div>
        <div className="right">
          <span>4 SURFACES</span>
        </div>
      </div>

      <div className="cap-stack">
        {CAPS.map((c) => (
          <div key={c.n} className="cap-row" data-cap>
            <span className="n">{c.n}</span>
            <span className="ttl">{c.ttl}</span>
            <p className="desc">{c.desc}</p>
            <span className="bin" aria-hidden="true">
              {c.bin}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

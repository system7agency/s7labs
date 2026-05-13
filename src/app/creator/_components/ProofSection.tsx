/*
 * NOTE: "Dr Gains" naming — Nicolas's permission to use this name publicly
 * is pending confirmation. Keep the placeholder copy as-is until confirmed.
 * The three dimmed pending cards are by design per the brief.
 */

export function ProofSection() {
  return (
    <section className="section">
      <div className="section-head">
        <span className="section-eyebrow">
          <span className="accent-dot" />
          {'// CASE STUDIES'}
        </span>
        <span className="section-num">
          05 / 06 · <span className="v">01 OF 04 LIVE</span>
        </span>
      </div>

      <div className="proof-intro">
        <h2>
          Creators who <span className="accent-text">own their platform.</span>
        </h2>
        <p>Early results from the first cohort. More case studies added as engagements complete.</p>
      </div>

      <div className="proof-grid">
        {/* Dr Gains — live case study. Naming permission pending: see note above. */}
        <div className="proof-card">
          <span className="proof-corner tl" />
          <span className="proof-corner br" />

          <div className="proof-eyebrow">
            <span className="status-dot" />
            LIVE · CASE 01
          </div>

          <h3 className="proof-name">Dr Gains</h3>
          <p className="proof-handle">@drgains</p>
          <p className="proof-desc">
            Fitness creator with an audience of highly-engaged followers. S7 Labs shipped a
            membership platform for personalised training programmes — no app store, no rev-share.
          </p>

          <div className="proof-divider" />

          <div className="proof-stat-row">
            <div className="proof-stat">
              <span className="stat-key">Platform</span>
              <span className="stat-val">
                Owned membership software — <span className="v">live</span>
              </span>
            </div>
            <div className="proof-stat">
              <span className="stat-key">Status</span>
              <span className="stat-val">
                <span className="v">Operational</span>
              </span>
            </div>
            <div className="proof-stat">
              <span className="stat-key">Timeline</span>
              <span className="stat-val">Discovery → Launch in 10 weeks</span>
            </div>
          </div>
        </div>

        {/* Pending case study slots — kept dimmed per design spec */}
        {(['02', '03', '04'] as const).map((n) => (
          <div key={n} className="proof-card pending">
            <span className="proof-corner tl" />
            <span className="proof-corner br" />

            <div className="proof-eyebrow">
              <span className="status-dot" />
              {`PENDING · CASE ${n}`}
            </div>

            <div className="proof-pending-label">{'// pending'}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

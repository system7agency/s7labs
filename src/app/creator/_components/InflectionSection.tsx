const RENTED = [
  { icn: 'IG', name: 'Instagram', arr: 'algorithm' },
  { icn: 'TT', name: 'TikTok', arr: 'ad spend' },
  { icn: 'YT', name: 'YouTube', arr: 'throttled' },
  { icn: 'X', name: 'X / Twitter', arr: 'reach decay' },
] as const

const OWNED = [
  { icn: '▢', name: 'Product', arr: 'recurring' },
  { icn: '▢', name: 'Brand', arr: 'compounding' },
  { icn: '▢', name: 'Audience node', arr: 'directly reachable' },
  { icn: '↗', name: 'Revenue', arr: 'retained' },
] as const

export function InflectionSection() {
  return (
    <section className="section reveal">
      <div className="section-head">
        <span className="section-eyebrow">
          <span className="accent-dot" />
          {'// 02 / 05 · THE INFLECTION'}
        </span>
        <span className="section-num">
          02 / 05 · <span className="v">SHIFT</span>
        </span>
      </div>

      <div className="grid-2 reverse">
        <div className="copy">
          <h2>From rented audience to owned audience.</h2>
          <p>
            Social platforms throttle organic reach. Ad models mature. Most creators rent their
            audience — and that rental is getting more expensive every year.
          </p>
          <p>
            The creators who win the next decade are the ones who turn that rented audience into
            something they own: a product, a brand, a business with recurring revenue. We build that
            business with you.
          </p>
        </div>
        <div className="visual">
          <div className="rent-own">
            <div className="col rented">
              <div className="col-head">RENTED</div>
              <h3 className="col-title">Platform-dependent</h3>
              <div className="platforms">
                {RENTED.map((r) => (
                  <div key={r.name} className="row">
                    <span className="icn">{r.icn}</span>
                    <span>{r.name}</span>
                    <span className="arr">{r.arr}</span>
                  </div>
                ))}
              </div>
              <div className="meta">{'// reach diminishes over time'}</div>
            </div>
            <div className="divider" aria-hidden="true" />
            <div className="col owned">
              <div className="col-head">OWNED</div>
              <h3 className="col-title">Equity in your audience</h3>
              <div className="owned-grid">
                {OWNED.map((r) => (
                  <div key={r.name} className="row">
                    <span className="icn">{r.icn}</span>
                    <span>{r.name}</span>
                    <span className="arr">{r.arr}</span>
                  </div>
                ))}
              </div>
              <div className="meta">{'// value compounds with reach'}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const RENTED = [
  { icon: '⚡', text: 'Algorithm controls your reach' },
  { icon: '📉', text: 'Revenue tied to post performance' },
  { icon: '🔒', text: 'No direct access to your audience' },
  { icon: '🚫', text: 'Platform can deplatform overnight' },
]

const OWNED = [
  { icon: '✓', text: 'Direct line to every subscriber' },
  { icon: '✓', text: 'Revenue independent of content cycle' },
  { icon: '✓', text: 'You own the data — full portability' },
  { icon: '✓', text: 'Software compounds over time' },
]

export function InflectionSection() {
  return (
    <section className="section">
      <div className="section-head">
        <span className="section-eyebrow">
          <span className="accent-dot" />
          {'// THE INFLECTION POINT'}
        </span>
        <span className="section-num">02 / 06</span>
      </div>

      <div className="inflection-wrap">
        <div className="inflection-copy">
          <h2>
            Stop renting your&nbsp;<span className="accent-text">audience.</span>
          </h2>
          <p>
            Every follower you have lives on rented land. Platforms change, algorithms shift, and
            the revenue that came with them disappears.
          </p>
          <p>
            The inflection point is a product — software that creates a direct, owned relationship
            between you and the people who care about your work.
          </p>
        </div>

        <div className="inflection-compare">
          <div className="compare-row">
            <div className="compare-cell rented">
              <div className="compare-label">Rented audience</div>
              {RENTED.map((item) => (
                <div key={item.text} className="compare-item">
                  <span className="ci-icon">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            <div className="compare-cell owned">
              <div className="compare-label">Owned platform</div>
              {OWNED.map((item) => (
                <div key={item.text} className="compare-item">
                  <span className="ci-icon">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

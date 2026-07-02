const CAPS = [
  {
    tag: 'built fast',
    title: 'Built fast',
    desc: 'Bespoke software is now fast to build - not the slow, expensive luxury it used to be.',
  },
  {
    tag: 'fitted exactly',
    title: 'Fitted exactly',
    desc: 'Shaped around where work breaks down, what is missing and what would make your team faster.',
  },
  {
    tag: 'easy to change',
    title: 'Easy to change',
    desc: 'When the business moves, the software moves with it - because you own how it works.',
  },
  {
    tag: 'yours to own',
    title: 'Yours to own',
    desc: 'Working tools and automation you own, turned from your knowledge into real software.',
  },
]

export function SupportingCapabilitiesSection() {
  return (
    <section className="sec reveal">
      <div className="sec-tag">
        <span className="n">05</span>
        <span className="lbl">
          <span>{"// 05 / 06"}</span>
          <span className="v">THE ADVANTAGE</span>
        </span>
      </div>
      <div className="sec-head">
        <div className="left">
          <h2>You know your business better than any vendor ever will.</h2>
          <p>
            Your team can already describe where work breaks down, what is missing and what would
            make them faster. And now that bespoke software is fast to build - not the slow,
            expensive luxury it used to be - we can turn that knowledge into working tools and
            automation you own.
          </p>
        </div>
        <div className="right">
          <span>SECONDARY</span>
        </div>
      </div>

      <div className="support">
        {CAPS.map((c) => (
          <div key={c.tag} className="supp" data-supp>
            <div className="tag">{c.tag}</div>
            <h4>{c.title}</h4>
            <p className="desc">{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

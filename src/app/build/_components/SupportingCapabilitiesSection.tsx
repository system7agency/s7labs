const CAPS = [
  {
    tag: 'integrations',
    title: 'Integrations',
    desc: 'We connect the software to the tools, databases and systems already used by the business.',
  },
  {
    tag: 'automation',
    title: 'Automation',
    desc: 'We automate repetitive actions around the product, including notifications, handoffs, approvals, updates and scheduled actions. The software stays central; automation makes it faster and easier to run.',
  },
  {
    tag: 'data handling',
    title: 'Data Handling',
    desc: 'We structure, clean, transform and move the data the product needs to operate.',
  },
  {
    tag: 'ai features',
    title: 'AI Features',
    desc: 'We embed AI where it improves the product experience, from search and summarisation to classification and generation.',
  },
]

export function SupportingCapabilitiesSection() {
  return (
    <section className="sec reveal">
      <div className="sec-tag">
        <span className="n">05</span>
        <span className="lbl">
          <span>{"// 05 / 06"}</span>
          <span className="v">SUPPORTING</span>
        </span>
      </div>
      <div className="sec-head">
        <div className="left">
          <h2>Layers around the product.</h2>
          <p>Software stays central. These capabilities make it work harder.</p>
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

type BuildCard = {
  pill: string
  title: string
  desc: string
  examples: string[]
}

const CARDS: BuildCard[] = [
  {
    pill: 'BUILD_TYPE_01',
    title: 'Client-Facing Software',
    desc: 'We build digital products and interfaces for customers, partners and users.',
    examples: [
      'customer portals',
      'self-serve tools',
      'AI product experiences',
      'reporting views',
      'partner dashboards',
    ],
  },
  {
    pill: 'BUILD_TYPE_02',
    title: 'Internal Platforms',
    desc: 'We build bespoke systems that help teams run core operations with less friction.',
    examples: [
      'operations platforms',
      'admin systems',
      'approval tools',
      'fulfilment systems',
      'knowledge interfaces',
    ],
  },
  {
    pill: 'BUILD_TYPE_03',
    title: 'Business Tools',
    desc: 'We build focused tools that replace manual processes, fragmented spreadsheets and off-the-shelf gaps.',
    examples: [
      'quoting tools',
      'calculators',
      'review tools',
      'data utilities',
      'reporting cockpits',
      'management consoles',
    ],
  },
  {
    pill: 'BUILD_TYPE_04',
    title: 'AI-Enabled Products',
    desc: 'We embed AI into the product experience where it creates real utility.',
    examples: [
      'AI search',
      'document analysis',
      'structured generation',
      'assistant interfaces',
      'recommendation tools',
    ],
  },
]

export function WhatWeBuildSection() {
  return (
    <section className="sec reveal" id="what-we-build">
      <div className="sec-tag">
        <span className="n">01</span>
        <span className="lbl">
          <span>{"// 01 / 06"}</span>
          <span className="v">WHAT WE BUILD</span>
        </span>
      </div>
      <div className="sec-head">
        <div className="left">
          <h2>
            The software <span className="accent-text">we engineer</span>.
          </h2>
          <p>
            We build digital products that solve specific problems for specific teams —
            client-facing applications, internal platforms, business tools, and AI-enabled
            interfaces. If off-the-shelf software cannot solve it, we design and ship it.
          </p>
        </div>
        <div className="right">
          <span>4 CATEGORIES</span>
        </div>
      </div>

      <div className="build-grid">
        {CARDS.map((c) => (
          <article key={c.pill} className="build-card" data-build>
            <span className="corner tl" />
            <span className="corner br" />
            <div className="pill">{c.pill}</div>
            <h3>{c.title}</h3>
            <p className="desc">{c.desc}</p>
            <div className="examples">
              {c.examples.map((ex) => (
                <span key={ex} className="ex">
                  {ex}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

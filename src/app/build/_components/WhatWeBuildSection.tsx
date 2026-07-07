import { BuildIcon, type BuildIconType } from './BuildIcon'

type BuildCard = {
  pill: string
  title: string
  desc: string
  type: BuildIconType
  examples: string[]
}

const CARDS: BuildCard[] = [
  {
    pill: 'BUILD_TYPE_01',
    title: 'Internal tools',
    type: 'tools',
    desc: 'The tools your team uses daily, built into the systems you already run.',
    examples: [
      'Ops platforms',
      'Admin consoles',
      'Approval tools',
      'Quoting and pricing',
      'Reporting cockpits',
      'Knowledge interfaces',
    ],
  },
  {
    pill: 'BUILD_TYPE_02',
    title: 'Automation',
    type: 'automation',
    desc: 'The automation that removes the manual work between your tools.',
    examples: [
      'Routing',
      'System sync',
      'Handoffs',
      'Enrichment',
      'Notifications',
      'Scheduled actions',
    ],
  },
  {
    pill: 'BUILD_TYPE_03',
    title: 'Client-facing',
    type: 'client',
    desc: 'Products for customers and partners, when the same standard of fit matters on the outside.',
    examples: [
      'Customer portals',
      'Mobile apps',
      'Partner dashboards',
      'Self-serve tools',
      'In-product AI',
    ],
  },
  {
    pill: 'BUILD_TYPE_04',
    title: 'Integrates with',
    type: 'integrate',
    desc: 'Everything connects to the systems you already run.',
    examples: [
      'CRM',
      'Email and comms',
      'Databases',
      'Payments',
      'Internal APIs',
      'Spreadsheets',
      'Custom MCPs',
    ],
  },
]

export function WhatWeBuildSection() {
  return (
    <section className="sec reveal" id="what-we-build">
      <div className="sec-tag">
        <span className="n">04</span>
        <span className="lbl">
          <span>{'// WHAT WE BUILD'}</span>
          <span className="v">WHAT WE BUILD</span>
        </span>
      </div>
      <div className="sec-head">
        <div className="left">
          <h2>
            Internal tools and automation, <span className="accent-text">built to fit</span>.
          </h2>
          <p>
            Most of what we build runs inside your business - the tools your team uses daily and the
            automation that removes the manual work between them - built into the tools you already
            run, so everything operates as one system. We build client-facing products too, when the
            same standard of fit matters on the outside.
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
            <div className="build-viz" aria-hidden="true">
              <BuildIcon type={c.type} />
            </div>
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

'use client'

import { MotionRoot, VIEWPORT, fadeUp, m, staggerParent } from './Motion'

const GROUPS: { label: string; soft?: string; items: string[] }[] = [
  {
    label: 'Internal tools',
    items: [
      'Ops platforms',
      'Admin consoles',
      'Approval tools',
      'Quoting and pricing',
      'Reporting cockpits',
      'Knowledge interfaces',
    ],
  },
  {
    label: 'Automation',
    items: [
      'Routing',
      'System sync',
      'Handoffs',
      'Enrichment',
      'Notifications',
      'Scheduled actions',
    ],
  },
  {
    label: 'Client-facing',
    soft: '· secondary',
    items: [
      'Customer portals',
      'Mobile apps',
      'Partner dashboards',
      'Self-serve tools',
      'In-product AI',
    ],
  },
]

function iconProps() {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
}

const INTEGRATES: { label: string; icon: React.ReactNode }[] = [
  {
    label: 'CRM',
    icon: (
      <svg {...iconProps()}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Email and comms',
    icon: (
      <svg {...iconProps()}>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
  {
    label: 'Databases',
    icon: (
      <svg {...iconProps()}>
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14a9 3 0 0 0 18 0V5" />
        <path d="M3 12a9 3 0 0 0 18 0" />
      </svg>
    ),
  },
  {
    label: 'Payments',
    icon: (
      <svg {...iconProps()}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  {
    label: 'Internal APIs',
    icon: (
      <svg {...iconProps()}>
        <path d="M12 22v-5" />
        <path d="M9 8V2" />
        <path d="M15 8V2" />
        <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
      </svg>
    ),
  },
  {
    label: 'Spreadsheets',
    icon: (
      <svg {...iconProps()}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M3 15h18" />
        <path d="M9 3v18" />
      </svg>
    ),
  },
  {
    label: 'Custom MCPs',
    icon: (
      <svg {...iconProps()}>
        <circle cx="12" cy="5" r="2.2" />
        <circle cx="5" cy="19" r="2.2" />
        <circle cx="19" cy="19" r="2.2" />
        <path d="M12 7.2v4.3" />
        <path d="m10.9 13.6-4.2 3.6" />
        <path d="m13.1 13.6 4.2 3.6" />
        <circle cx="12" cy="12.6" r="1.1" />
      </svg>
    ),
  },
]

/* 04 · What we build — the work, grouped, plus the systems it plugs into. */
export function WhatWeBuildSection() {
  return (
    <MotionRoot>
    <section className="fx-sec" id="what-we-build" aria-label="What we build">
      <div className="fx-eyebrow">
        <span className="lead">
          <span className="slashes">{'//'}</span> WHAT WE BUILD
        </span>
        <span className="num">04</span>
      </div>

      <div className="wwb-head">
        <m.h2 className="fx-h2" variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT}>
          Internal tools and automation, <span className="accent-text">built to fit.</span>
        </m.h2>
        <m.p className="fx-sub" variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT}>
          Most of what we build runs inside your business - the tools your team uses daily and the
          automation that removes the manual work between them - built into the tools you already
          run, so everything operates as one system. We build client-facing products too, when the
          same standard of fit matters on the outside.
        </m.p>
      </div>

      <div className="wwb-cols">
        {GROUPS.map((g) => (
          <m.div
            key={g.label}
            variants={staggerParent(0.05)}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            <m.div className="wwb-col-label" variants={fadeUp}>
              {g.label}
              {g.soft ? <span className="soft">{g.soft}</span> : null}
            </m.div>
            <ul className="wwb-list">
              {g.items.map((item) => (
                <m.li key={item} className="wwb-item" variants={fadeUp}>
                  <span>{item}</span>
                </m.li>
              ))}
            </ul>
          </m.div>
        ))}
      </div>

      <m.div
        className="wwb-integrates"
        variants={staggerParent(0.06)}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <m.span className="k" variants={fadeUp}>
          Integrates with
        </m.span>
        <div className="wwb-int-grid" role="list" aria-label="Systems we integrate with">
          {INTEGRATES.map((item) => (
            <m.div key={item.label} className="wwb-int-tile" role="listitem" variants={fadeUp}>
              {item.icon}
              <span className="t">{item.label}</span>
            </m.div>
          ))}
        </div>
      </m.div>
    </section>
    </MotionRoot>
  )
}

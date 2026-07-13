'use client'

import { useRef } from 'react'

import { MotionRoot, VIEWPORT, fadeUp, m, staggerParent, useInView } from './Motion'

const GROUPS: { label: string; items: string[] }[] = [
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

/* Ordered APIs, CRM, Databases, Custom MCPs first (the ones that matter most),
   then the rest. Positions on the orbit follow this order clockwise from top. */
const INTEGRATES: { label: string; icon: React.ReactNode }[] = [
  {
    label: 'APIs',
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
    label: 'Payments',
    icon: (
      <svg {...iconProps()}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
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
]

/* Orb geometry: integrations sit on a ring around the built-system core,
   clockwise from the top. S is the viewBox size; ORB_R the orbit radius. */
const ORB_S = 480
const ORB_R = 168
const ORB_POS = INTEGRATES.map((_, i) => {
  const a = ((-90 + (i * 360) / INTEGRATES.length) * Math.PI) / 180
  return { x: Math.cos(a) * ORB_R, y: Math.sin(a) * ORB_R }
})

/* The integration orb: the built system at the core, the systems it plugs into
   orbiting around it, work flowing inward along each connector. */
function IntegrationOrb() {
  const ref = useRef<HTMLDivElement | null>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <div ref={ref} className={inView ? 'wwb-orb play' : 'wwb-orb'}>
      <svg
        className="wwb-orb-svg"
        viewBox={`${-ORB_S / 2} ${-ORB_S / 2} ${ORB_S} ${ORB_S}`}
        aria-hidden="true"
      >
        {/* dashed orbit ring, slowly rotating */}
        <circle className="wwb-orb-ring" cx={0} cy={0} r={ORB_R} pathLength={1} />
        {/* connectors from core out to each system */}
        {ORB_POS.map((p, i) => (
          <m.line
            key={`c-${i}`}
            x1={0}
            y1={0}
            x2={p.x}
            y2={p.y}
            className="wwb-orb-link"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.15 + i * 0.08, ease: [0.3, 0, 0.2, 1] }}
          />
        ))}
        {/* work flowing inward, from each system into the core */}
        {inView &&
          ORB_POS.map((p, i) => (
            <m.circle
              key={`p-${i}`}
              r={2.8}
              className="wwb-orb-packet"
              initial={{ cx: p.x, cy: p.y, opacity: 0 }}
              animate={{ cx: [p.x, 0], cy: [p.y, 0], opacity: [0, 0.9, 0] }}
              transition={{
                duration: 1.5,
                delay: 1 + i * 0.4,
                repeat: Infinity,
                repeatDelay: 2.4,
                ease: 'easeInOut',
              }}
            />
          ))}
      </svg>

      <div className="wwb-orb-core" aria-hidden="true">
        <span className="pulse" />
        <span className="t">
          YOUR
          <br />
          BUILD
        </span>
      </div>

      {INTEGRATES.map((item, i) => {
        const p = ORB_POS[i]!
        return (
          <m.div
            key={item.label}
            className="wwb-orb-node"
            role="listitem"
            style={{
              left: `calc(50% + ${((p.x / ORB_S) * 100).toFixed(2)}%)`,
              top: `calc(50% + ${((p.y / ORB_S) * 100).toFixed(2)}%)`,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.45, delay: 0.3 + i * 0.08 }}
          >
            {item.icon}
            <span className="t">{item.label}</span>
          </m.div>
        )
      })}
    </div>
  )
}

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
          <m.h2
            className="fx-h2"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            Internal tools and automation, <span className="accent-text">built to fit.</span>
          </m.h2>
          <m.p
            className="fx-sub"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            Most of what we build runs inside your business, wired into the tools you already use so
            everything works as one system. We build client-facing products too, when the fit
            matters on the outside.
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

        <div className="wwb-integrates">
          <m.h3
            className="wwb-int-title"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            Connected to everything <span className="accent-text">you already run.</span>
          </m.h3>

          <div role="list" aria-label="Systems we integrate with">
            <IntegrationOrb />
          </div>

          <m.p
            className="wwb-int-cap"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            CRM, databases, APIs, custom MCPs - and pretty much anything else on the internet.
          </m.p>
        </div>
      </section>
    </MotionRoot>
  )
}

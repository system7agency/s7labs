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

/* ---------- Part A · circle knowledge-graph ----------
   Deterministic, hand-tuned layout (no Math.random / Date.now — forbidden
   here, breaks SSR). Every node is a soft circle: three larger accent HUBS
   (the categories) woven across the canvas, with their smaller item LEAVES
   placed nearby but interlaced into one connected network. Positions live in
   a fixed viewBox and are projected to % so the SVG grid + curved links and
   the DOM circles share one coordinate space. Radii and centres are tuned by
   hand so no two circles overlap and every label stays legible. */

const GRAPH_W = 1200
const GRAPH_H = 720

const HUB_R = 62 // hub circle radius (viewBox units)
const LEAF_R = 46 // leaf circle radius

type Pt = { x: number; y: number }

/* Short mono eyebrow tags shown above each hub's name. */
const HUB_TAGS = ['01 · INTERNAL', '02 · AUTOMATION', '03 · CLIENT'] as const

/* Hub centres — one left, one upper-right, one lower-right — spread so the
   three clusters read as a single balanced mind-map. */
const HUB_POS: Pt[] = [
  { x: 268, y: 322 }, // Internal tools
  { x: 812, y: 178 }, // Automation
  { x: 856, y: 548 }, // Client-facing
]

/* Hand-placed leaf centres per hub (indexes align with GROUPS[gi].items).
   Tuned against HUB_R / LEAF_R so gaps stay clear at every desktop width. */
const LEAF_POS: Pt[][] = [
  // Internal tools (6) — fanned around the left hub, reaching toward centre
  [
    { x: 96, y: 196 },
    { x: 108, y: 420 },
    { x: 250, y: 500 },
    { x: 452, y: 236 },
    { x: 470, y: 430 },
    { x: 300, y: 122 },
  ],
  // Automation (6) — around the upper-right hub, some pulled to the middle
  [
    { x: 632, y: 96 },
    { x: 1006, y: 118 },
    { x: 1100, y: 306 },
    { x: 636, y: 300 },
    { x: 830, y: 356 },
    { x: 958, y: 436 },
  ],
  // Client-facing (5) — around the lower-right hub
  [
    { x: 638, y: 522 },
    { x: 700, y: 660 },
    { x: 888, y: 668 },
    { x: 1086, y: 600 },
    { x: 1092, y: 458 },
  ],
]

/* A soft curved connector running from centre to centre. We deliberately do NOT
   trim to the rims: the node circles are opaque and painted above the SVG, so
   each line visibly runs INTO both circles and is covered at the ends — exactly
   how the reference graph connects. The control point is nudged perpendicular so
   links read as gentle arcs rather than straight spokes. */
function curve(a: Pt, b: Pt): string {
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  const cx = mx - (b.y - a.y) * 0.1
  const cy = my + (b.x - a.x) * 0.1
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`
}

function pct(v: number, total: number) {
  return `${((v / total) * 100).toFixed(3)}%`
}

/* Node circle diameters as a % of the box width, so circles scale with the
   projected coordinate space at every viewport size. */
function diam(r: number) {
  return `${(((r * 2) / GRAPH_W) * 100).toFixed(3)}%`
}

type LeafNode = { key: string; label: string; tag: string; pos: Pt; delay: number }
type HubNode = { key: string; label: string; tag: string; pos: Pt; leaves: LeafNode[] }

const GRAPH: HubNode[] = GROUPS.map((g, gi) => ({
  key: g.label,
  label: g.label,
  tag: HUB_TAGS[gi]!,
  pos: HUB_POS[gi]!,
  leaves: g.items.map((item, i) => ({
    key: item,
    label: item,
    // e.g. hub 1 item 0 → "01.A" ; deterministic A/B/C… from the index.
    tag: `0${gi + 1}.${String.fromCharCode(65 + i)}`,
    pos: LEAF_POS[gi]![i]!,
    delay: 0.62 + gi * 0.12 + i * 0.05,
  })),
}))

/* Cross-hub links so the three clusters chain into one network, not three
   separate fans. */
const HUB_LINKS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 0],
]

/* The two "primary" nodes that glow accent-blue: the first two hubs read as the
   spine of the graph; the rest stay dim/translucent. All three hubs glow, but
   hubs 0 and 1 carry a stronger halo (see .is-primary). */
const LINK_EASE = [0.3, 0, 0.2, 1] as const

function KnowledgeGraph() {
  const ref = useRef<HTMLDivElement | null>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <div ref={ref} className="wwb-graph" style={{ aspectRatio: `${GRAPH_W} / ${GRAPH_H}` }}>
      <svg
        className="wwb-graph-svg"
        viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <pattern id="wwbGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path className="wwb-graph-grid-line" d="M 40 0 L 0 0 0 40" />
          </pattern>
          <radialGradient id="wwbGridFade" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id="wwbGridMask">
            <rect x="0" y="0" width={GRAPH_W} height={GRAPH_H} fill="url(#wwbGridFade)" />
          </mask>
        </defs>

        {/* subtle grid backdrop, faded out toward the edges */}
        <rect
          x="0"
          y="0"
          width={GRAPH_W}
          height={GRAPH_H}
          fill="url(#wwbGrid)"
          mask="url(#wwbGridMask)"
        />

        {/* faint links between hubs */}
        {HUB_LINKS.map(([a, b]) => (
          <m.path
            key={`hl-${a}-${b}`}
            className="wwb-graph-hublink"
            d={curve(HUB_POS[a]!, HUB_POS[b]!)}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.28, ease: LINK_EASE }}
          />
        ))}
        {/* hub → leaf connectors */}
        {GRAPH.map((hub) =>
          hub.leaves.map((leaf) => (
            <m.path
              key={`c-${hub.key}-${leaf.key}`}
              className="wwb-graph-link"
              d={curve(hub.pos, leaf.pos)}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={inView ? { pathLength: 1, opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: leaf.delay - 0.14, ease: LINK_EASE }}
            />
          )),
        )}
      </svg>

      {/* Real, readable DOM. Each hub is a labelled group (role=list) with its
          leaves as list items — circles positioned over the SVG. The eyebrow
          tag is decorative; the name is the readable label. */}
      {GRAPH.map((hub, hi) => (
        <div key={hub.key} className="wwb-graph-cluster" role="list" aria-label={hub.label}>
          <m.div
            className={hi < 2 ? 'wwb-node wwb-hub is-primary' : 'wwb-node wwb-hub'}
            style={{
              left: pct(hub.pos.x, GRAPH_W),
              top: pct(hub.pos.y, GRAPH_H),
              width: diam(HUB_R),
            }}
            initial={{ opacity: 0, scale: 0.82 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.55, delay: 0.08 + hi * 0.12, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <span className="wwb-node-tag" aria-hidden="true">
              {hub.tag}
            </span>
            <span className="wwb-node-name">{hub.label}</span>
          </m.div>

          {hub.leaves.map((leaf) => (
            <m.div
              key={leaf.key}
              className="wwb-node wwb-leaf"
              role="listitem"
              aria-label={leaf.label}
              style={{
                left: pct(leaf.pos.x, GRAPH_W),
                top: pct(leaf.pos.y, GRAPH_H),
                width: diam(LEAF_R),
              }}
              initial={{ opacity: 0, scale: 0.86 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.45, delay: leaf.delay, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <span className="wwb-node-tag" aria-hidden="true">
                {leaf.tag}
              </span>
              <span className="wwb-node-name">{leaf.label}</span>
            </m.div>
          ))}
        </div>
      ))}
    </div>
  )
}

/* Mobile fallback: the same data as a clean stacked, grouped list. Rendered
   alongside the graph; CSS shows exactly one at each breakpoint. */
function GraphStack() {
  return (
    <m.div
      className="wwb-stack"
      variants={staggerParent(0.06)}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
    >
      {GROUPS.map((g) => (
        <m.div key={g.label} className="wwb-stack-group" variants={fadeUp} role="list" aria-label={g.label}>
          <div className="wwb-stack-hub">
            <span className="wwb-stack-hub-dot" aria-hidden="true" />
            <span className="wwb-stack-hub-label">{g.label}</span>
          </div>
          <div className="wwb-stack-leaves">
            {g.items.map((item) => (
              <span key={item} className="wwb-stack-leaf" role="listitem">
                {item}
              </span>
            ))}
          </div>
        </m.div>
      ))}
    </m.div>
  )
}

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

/* ---------- Part B · the systems a build connects to ----------
   A clean row of labelled blocks (CRM · Database · APIs · Custom MCPs) plus a
   softer "anything else" block, joined by a light connector line. Icons reused
   from the old orbit set. */
const BLOCKS: { label: string; icon: React.ReactNode; soft?: boolean }[] = [
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
    label: 'Database',
    icon: (
      <svg {...iconProps()}>
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14a9 3 0 0 0 18 0V5" />
        <path d="M3 12a9 3 0 0 0 18 0" />
      </svg>
    ),
  },
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
    label: 'Emails and comms',
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
  {
    label: 'Anything else on the internet',
    soft: true,
    icon: (
      <svg {...iconProps()}>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
      </svg>
    ),
  },
]

function IntegrationBlocks() {
  return (
    <m.div
      className="wwb-blocks"
      role="list"
      aria-label="Systems we connect to"
      variants={staggerParent(0.08)}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
    >
      {BLOCKS.map((b, i) => (
        <m.div
          key={b.label}
          className={b.soft ? 'wwb-block soft' : 'wwb-block'}
          role="listitem"
          variants={fadeUp}
        >
          {i > 0 && <span className="wwb-block-join" aria-hidden="true" />}
          <span className="wwb-block-icon" aria-hidden="true">
            {b.icon}
          </span>
          <span className="wwb-block-label">{b.label}</span>
        </m.div>
      ))}
    </m.div>
  )
}

/* 04 · What we build — the work as a connected network, plus the systems it
   plugs into. */
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

        <KnowledgeGraph />
        <GraphStack />

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

          <IntegrationBlocks />
        </div>
      </section>
    </MotionRoot>
  )
}

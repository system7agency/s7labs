'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import styles from './SystemisedKnowledgeSection.module.css'

/* ==========================================================================
   SystemisedKnowledgeSection - "Systemised knowledge".
   A premium GTM-engineering visual: scattered "market knowledge" signals
   drift in loosely, then on the shift they ORGANISE and snap into a clean
   structured lattice / system grid that lights up, after which pulses flow
   OUT of it continuously (the system now acting on the knowledge).
   Self-contained: React + module CSS only. Inline SVG, no libraries.
   ========================================================================== */

/* ---- Canvas geometry (SVG viewBox coordinates) -------------------------- */
const VB_W = 620
const VB_H = 460

/* The structured lattice the signals snap into: a clean N×M grid of nodes. */
const GRID_COLS = 5
const GRID_ROWS = 4
const GRID_X0 = 150
const GRID_Y0 = 120
const GRID_DX = 80
const GRID_DY = 74

type Node = {
  /** stable id */
  id: number
  /** scattered origin (loose, off-lattice) */
  sx: number
  sy: number
  /** ordered lattice target */
  gx: number
  gy: number
  /** grid column / row (for edge wiring) */
  col: number
  row: number
  /** short knowledge tag shown while scattered / on hover of the story */
  tag: string
  /** per-node stagger seconds for the snap */
  delay: number
}

/** Short "market knowledge" labels that scatter, then organise into the grid. */
const TAGS: ReadonlyArray<string> = [
  'ICP',
  'intent',
  'account',
  'territory',
  'signal',
  'pricing',
  'champion',
  'stage',
  'source',
  'segment',
  'trigger',
  'owner',
  'renewal',
  'region',
  'persona',
  'lead',
  'deal',
  'route',
  'score',
  'play',
]

/* Deterministic pseudo-random so SSR and client agree (no hydration drift). */
function seeded(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Build the node set: scattered origins + ordered lattice targets. */
const NODES: ReadonlyArray<Node> = (() => {
  const out: Node[] = []
  let i = 0
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const gx = GRID_X0 + col * GRID_DX
      const gy = GRID_Y0 + row * GRID_DY
      // Scatter loosely across the whole canvas, biased away from center.
      const rx = seeded(i * 2 + 1)
      const ry = seeded(i * 2 + 7)
      const sx = 40 + rx * (VB_W - 80)
      const sy = 40 + ry * (VB_H - 80)
      out.push({
        id: i,
        sx,
        sy,
        gx,
        gy,
        col,
        row,
        tag: TAGS[i] ?? 'node',
        // Snap staggered diagonally from top-left for a satisfying sweep.
        delay: (col + row) * 0.055,
      })
      i++
    }
  }
  return out
})()

/** Lattice edges: connect each node to its right + bottom neighbour. */
type Edge = { id: string; a: Node; b: Node; delay: number }
const EDGES: ReadonlyArray<Edge> = (() => {
  const byRC = new Map<string, Node>()
  for (const n of NODES) byRC.set(`${n.col}:${n.row}`, n)
  const out: Edge[] = []
  for (const n of NODES) {
    const right = byRC.get(`${n.col + 1}:${n.row}`)
    const down = byRC.get(`${n.col}:${n.row + 1}`)
    if (right) {
      out.push({
        id: `h-${n.col}-${n.row}`,
        a: n,
        b: right,
        delay: (n.col + n.row) * 0.055,
      })
    }
    if (down) {
      out.push({
        id: `v-${n.col}-${n.row}`,
        a: n,
        b: down,
        delay: (n.col + n.row) * 0.055,
      })
    }
  }
  return out
})()

/* Pulse emitters: pulses flow OUT of the grid's live nodes continuously.
   Each targets a point beyond the lattice edge to read as "acting outward". */
type Pulse = {
  id: number
  from: Node
  tx: number
  ty: number
  dur: number
  delay: number
}
const GRID_CX = GRID_X0 + ((GRID_COLS - 1) * GRID_DX) / 2
const GRID_CY = GRID_Y0 + ((GRID_ROWS - 1) * GRID_DY) / 2
const PULSES: ReadonlyArray<Pulse> = (() => {
  // Emit from perimeter nodes so pulses visibly leave the system.
  const perimeter = NODES.filter(
    (n) => n.col === 0 || n.row === 0 || n.col === GRID_COLS - 1 || n.row === GRID_ROWS - 1
  )
  return perimeter.map((n, k) => {
    // Direction = radial from grid center through the node, extended out.
    const dx = n.gx - GRID_CX
    const dy = n.gy - GRID_CY
    const len = Math.hypot(dx, dy) || 1
    const reach = 150
    return {
      id: n.id,
      from: n,
      tx: n.gx + (dx / len) * reach,
      ty: n.gy + (dy / len) * reach,
      dur: 2.4 + seeded(k * 3 + 2) * 1.4,
      delay: seeded(k * 5 + 4) * 2.2,
    }
  })
})()

/** px → percent for absolutely-positioned HTML tags over the SVG. */
function pctX(x: number): number {
  return (x / VB_W) * 100
}
function pctY(y: number): number {
  return (y / VB_H) * 100
}

export function SystemisedKnowledgeSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [play, setPlay] = useState(false)
  const [reduced, setReduced] = useState(false)

  // Detect reduced-motion once on mount (deferred setState so it is not a
  // synchronous-in-effect update).
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.requestAnimationFrame(() => setReduced(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  // Trigger the sequence once when scrolled into view.
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    // If reduced motion, jump straight to the final (organised) state.
    if (reduced) {
      const id = window.requestAnimationFrame(() => setPlay(true))
      return () => window.cancelAnimationFrame(id)
    }

    if (typeof IntersectionObserver === 'undefined') {
      const id = window.requestAnimationFrame(() => setPlay(true))
      return () => window.cancelAnimationFrame(id)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting) {
          setPlay(true)
          observer.unobserve(entry.target)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)

    return () => {
      observer.disconnect()
    }
  }, [reduced])

  const stateClass = reduced ? styles.reduced : play ? styles.play : ''

  // Per-node CSS custom props (scatter → lattice deltas + stagger).
  const nodeStyles = useMemo<ReadonlyArray<CSSProperties>>(
    () =>
      NODES.map(
        (n) =>
          ({
            ['--sx' as string]: `${n.sx.toFixed(1)}px`,
            ['--sy' as string]: `${n.sy.toFixed(1)}px`,
            ['--gx' as string]: `${n.gx.toFixed(1)}px`,
            ['--gy' as string]: `${n.gy.toFixed(1)}px`,
            ['--d' as string]: `${n.delay.toFixed(3)}s`,
          }) as CSSProperties
      ),
    []
  )

  return (
    <section
      ref={sectionRef}
      className={`${styles.section} ${stateClass}`}
      aria-labelledby="sysk-heading"
    >
      <div className={styles.inner}>
        {/* ---------- LEFT: copy ---------- */}
        <div className={styles.copy}>
          <span className={styles.eyebrow}>{'// GTM ENGINEERING'}</span>

          <h2 id="sysk-heading" className={`${styles.header} ${styles.reveal}`}>
            Your market knowledge is the advantage. <span className={styles.accent}>Systems</span>{' '}
            are how it scales.
          </h2>

          <p className={`${styles.subhead} ${styles.reveal}`}>
            You already know your market and where the revenue is. We turn that knowledge into the
            systems that act on it, so the manual work runs itself and your team stays on what
            actually closes.
          </p>

          <div className={`${styles.ctaRow} ${styles.reveal}`}>
            <a className={`${styles.cta} ${styles.ctaPrimary}`} href="#map">
              Map your revenue engine
              <svg className={styles.ctaArrow} viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M2 8h10M9 4l4 4-4 4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <a className={`${styles.cta} ${styles.ctaSecondary}`} href="#demo">
              See a system in action
            </a>
          </div>
        </div>

        {/* ---------- RIGHT: animation ---------- */}
        <div className={styles.viz}>
          <div className={styles.stage}>
            <div className={styles.stageHead}>
              <span className={styles.stageTitle}>Knowledge → System</span>
              <span className={styles.stageMeta}>
                <span className={styles.stageDot} aria-hidden="true" />
                SELF-RUNNING
              </span>
            </div>

            <div className={styles.canvas}>
              <svg
                className={styles.svg}
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                role="img"
                aria-label="Scattered market-knowledge signals drift in, then organise and snap into a clean structured system grid that lights up, after which pulses flow outward continuously as the system acts on the knowledge."
              >
                <defs>
                  <radialGradient id="syskGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#4f8cff" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#4f8cff" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="syskEdge" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#4f8cff" />
                    <stop offset="100%" stopColor="#04e3ee" />
                  </linearGradient>
                </defs>

                {/* System halo behind the lattice (lights up on organise) */}
                <circle
                  className={styles.systemGlow}
                  cx={GRID_CX}
                  cy={GRID_CY}
                  r={200}
                  fill="url(#syskGlow)"
                />

                {/* Lattice edges - draw in after nodes snap into place */}
                <g className={styles.edges}>
                  {EDGES.map((e) => (
                    <line
                      key={e.id}
                      className={styles.edge}
                      x1={e.a.gx}
                      y1={e.a.gy}
                      x2={e.b.gx}
                      y2={e.b.gy}
                      style={{ ['--d' as string]: `${e.delay.toFixed(3)}s` }}
                    />
                  ))}
                </g>

                {/* Outward pulses - continuous once the system is live */}
                <g className={styles.pulses} aria-hidden="true">
                  {!reduced &&
                    PULSES.map((p) => (
                      <line
                        key={`pl-${p.id}`}
                        className={styles.pulse}
                        x1={p.from.gx}
                        y1={p.from.gy}
                        x2={p.tx}
                        y2={p.ty}
                        style={{
                          ['--pdur' as string]: `${p.dur.toFixed(2)}s`,
                          ['--pdelay' as string]: `${p.delay.toFixed(2)}s`,
                        }}
                      />
                    ))}
                </g>

                {/* Nodes - scatter origin -> lattice target */}
                <g className={styles.nodes}>
                  {NODES.map((n, i) => (
                    <g key={n.id} className={styles.node} style={nodeStyles[i]}>
                      <circle className={styles.nodeHalo} r={11} />
                      <circle className={styles.nodeCore} r={4.5} />
                    </g>
                  ))}
                </g>
              </svg>

              {/* Floating knowledge tags (HTML) - visible while scattered,
                  fade as the signals organise into the clean system. */}
              <div className={styles.tags} aria-hidden="true">
                {NODES.map((n) => (
                  <span
                    key={`tag-${n.id}`}
                    className={styles.tag}
                    style={{
                      left: `${pctX(n.sx)}%`,
                      top: `${pctY(n.sy)}%`,
                      ['--d' as string]: `${n.delay.toFixed(3)}s`,
                    }}
                  >
                    {n.tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Status readout beneath the canvas */}
            <div className={styles.readout}>
              <span className={`${styles.stat} ${styles.statScatter}`}>
                <span className={styles.statDot} aria-hidden="true" />
                Scattered insight
              </span>
              <span className={styles.statArrow} aria-hidden="true">
                →
              </span>
              <span className={`${styles.stat} ${styles.statSystem}`}>
                <span className={styles.statDot} aria-hidden="true" />
                Self-running system
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

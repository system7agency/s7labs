'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import styles from './TheEngineSection.module.css'

/* ==========================================================================
   TheEngineSection — "The engine" section. The signature animation.
   A living revenue pipeline: 6 connected stages from SOURCED to SYNCED.
   On scroll-in the track draws, a lead token flows through and lights each
   stage in sequence, then pulses keep flowing forever like a live engine.
   Self-contained: React + module CSS only. Inline SVG, no libraries.
   ========================================================================== */

/** Pipeline stages, in order, sourced -> synced. */
const STAGES: ReadonlyArray<{ label: string; note: string }> = [
  {
    label: 'Source & enrich',
    note: 'build and clean target lists from live data',
  },
  { label: 'Research', note: 'AI agents brief every account and contact' },
  { label: 'Signals', note: 'track intent, hiring, funding and tech changes' },
  { label: 'Verify', note: 'validate contacts for deliverability' },
  {
    label: 'Sequence',
    note: 'launch personalised outreach across email and social',
  },
  { label: 'Route', note: 'score, qualify and assign to the right rep' },
]

/* ---- Track geometry (SVG viewBox coordinates) --------------------------- */
const VB_W = 640
const VB_H = 520
/** Left inset where the SOURCED marker sits. */
const X_START = 60
/** Right inset where the SYNCED marker sits. */
const X_END = VB_W - 60
/** Vertical band the node column occupies. */
const Y_TOP = 58
const Y_BOTTOM = 416
/** Y of the SYNCED exit line + marker — sits BELOW the last node's label/note
 *  so the run-out to SYNCED never crosses the "Route" text. */
const SYNC_Y = 470
const NODE_X = 132 // node centre x (labels flow to the right)

/** Y centre of stage i. */
function nodeY(i: number): number {
  if (STAGES.length < 2) return (Y_TOP + Y_BOTTOM) / 2
  return Y_TOP + (i / (STAGES.length - 1)) * (Y_BOTTOM - Y_TOP)
}

const NODE_YS: ReadonlyArray<number> = STAGES.map((_, i) => nodeY(i))
const FIRST_Y = NODE_YS[0] ?? Y_TOP
const LAST_Y = NODE_YS[NODE_YS.length - 1] ?? Y_BOTTOM

/**
 * The spine path the lead token rides: a gentle S from the SOURCED marker,
 * down through every node, out to the SYNCED marker. Vertical segments
 * between nodes are eased with short cubic shoulders so the token banks
 * smoothly rather than snapping.
 */
const TRACK_D = (() => {
  let d = `M ${X_START} ${FIRST_Y} C ${(X_START + NODE_X) / 2} ${FIRST_Y}, ${NODE_X - 30} ${FIRST_Y}, ${NODE_X} ${FIRST_Y}`
  for (let i = 0; i < NODE_YS.length - 1; i++) {
    const y0 = NODE_YS[i]
    const y1 = NODE_YS[i + 1]
    if (y0 === undefined || y1 === undefined) continue
    const mid = (y0 + y1) / 2
    // slight lateral sway so the spine reads organic, not a dead-straight rail
    const sway = i % 2 === 0 ? NODE_X + 26 : NODE_X - 26
    d += ` C ${sway} ${mid - (mid - y0) * 0.15}, ${sway} ${mid + (y1 - mid) * 0.15}, ${NODE_X} ${y1}`
  }
  // Drop below the last node's label/note, then run right to the SYNCED marker.
  d += ` C ${NODE_X} ${LAST_Y + (SYNC_Y - LAST_Y) * 0.55}, ${NODE_X} ${SYNC_Y}, ${NODE_X + 46} ${SYNC_Y}`
  d += ` C ${(NODE_X + 46 + X_END) / 2} ${SYNC_Y}, ${(NODE_X + 46 + X_END) / 2} ${SYNC_Y}, ${X_END} ${SYNC_Y}`
  return d
})()

/** Over-long dash seed so the draw-in reveals the whole spine. */
const DASH = 2200

/** Approx. offset-distance (%) where each node sits along the spine, used to
 *  stagger each node's ignition to the moment the lead token passes it. */
const NODE_PROGRESS: ReadonlyArray<number> = STAGES.map((_, i) => {
  // node 0 sits just after the entry shoulder, node N-1 just before the exit.
  const inner = STAGES.length > 1 ? i / (STAGES.length - 1) : 0
  return 0.12 + inner * 0.72
})

/* ---- Timing (seconds) --------------------------------------------------- */
const DRAW_DELAY = 0.35
const DRAW_DUR = 1.15
const LEAD_DELAY = DRAW_DELAY + DRAW_DUR * 0.55 // token starts as spine nears done
const LEAD_DUR = 3.4 // one full pass

export function TheEngineSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [play, setPlay] = useState(false)
  const [reduced, setReduced] = useState(false)

  // Detect reduced-motion once (deferred setState — never sync in an effect).
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.requestAnimationFrame(() => setReduced(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  // Trigger the build once when scrolled into view.
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

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

  // CSS var carrying the spine path for the offset-path token + pulses.
  const trackVars = useMemo<CSSProperties>(
    () =>
      ({
        ['--track-path' as string]: `path('${TRACK_D}')`,
      }) as CSSProperties,
    []
  )

  const stateClass = reduced ? styles.reduced : play ? styles.play : ''

  return (
    <section
      ref={sectionRef}
      className={`${styles.section} ${stateClass}`}
      aria-labelledby="engine-heading"
    >
      <div className={styles.inner}>
        {/* ---------- LEFT: copy ---------- */}
        <div className={styles.copy}>
          <span className={styles.eyebrow}>{'// THE ENGINE'}</span>

          <h2 id="engine-heading" className={`${styles.header} ${styles.reveal}`}>
            One pipeline. Every step connected.
          </h2>

          <p className={`${styles.subhead} ${styles.reveal}`}>
            The capabilities above don&apos;t have to run in isolation. We wire them into an engine
            where a lead can move from sourced to synced with zero manual handoffs - your tools,
            vendors and infrastructure unified, orchestrated and handled.
          </p>

          <div className={`${styles.flowMeta} ${styles.reveal}`}>
            <span className={styles.flowMetaDot} aria-hidden="true" />
            <span className={styles.flowMetaText}>
              Lead flows sourced <span aria-hidden="true">→</span> synced, continuously
            </span>
          </div>
        </div>

        {/* ---------- RIGHT: pipeline engine ---------- */}
        <div className={styles.viz}>
          <div className={styles.engineCard}>
            <div className={styles.engineHead}>
              <span className={styles.engineTitle}>Revenue pipeline</span>
              <span className={styles.engineMeta}>
                <span className={styles.liveDot} aria-hidden="true" />
                LIVE · ORCHESTRATED
              </span>
            </div>

            <div className={styles.stageWrap}>
              <svg
                className={styles.engineSvg}
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                aria-hidden="true"
                style={trackVars}
              >
                <defs>
                  <linearGradient id="engineTrack" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#04e3ee" />
                    <stop offset="50%" stopColor="#4f8cff" />
                    <stop offset="100%" stopColor="#4f8cff" />
                  </linearGradient>
                  <filter id="engineGlow" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="3.4" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Faint under-rail so the track has a groove even before draw */}
                <path className={styles.trackBed} d={TRACK_D} />

                {/* The drawn spine */}
                <path
                  className={styles.track}
                  d={TRACK_D}
                  style={{
                    strokeDasharray: DASH,
                    strokeDashoffset: reduced ? 0 : DASH,
                  }}
                />

                {/* Start / end markers */}
                <g className={styles.marker}>
                  <circle className={styles.markerRing} cx={X_START} cy={FIRST_Y} r={7} />
                  <circle className={styles.markerCore} cx={X_START} cy={FIRST_Y} r={3} />
                  <text
                    className={styles.markerLabel}
                    x={X_START}
                    y={FIRST_Y - 16}
                    textAnchor="middle"
                  >
                    SOURCED
                  </text>
                </g>
                <g className={`${styles.marker} ${styles.markerEnd}`}>
                  <circle className={styles.markerRing} cx={X_END} cy={SYNC_Y} r={7} />
                  <circle className={styles.markerCore} cx={X_END} cy={SYNC_Y} r={3} />
                  <text
                    className={styles.markerLabel}
                    x={X_END}
                    y={SYNC_Y + 26}
                    textAnchor="middle"
                  >
                    SYNCED
                  </text>
                </g>

                {/* Stage nodes with labels + notes */}
                {STAGES.map((stage, i) => {
                  const cy = NODE_YS[i] ?? nodeY(i)
                  // ignition offset = when the lead token reaches this node
                  const progress = NODE_PROGRESS[i] ?? 0.12
                  const litDelay = LEAD_DELAY + progress * LEAD_DUR
                  const nodeStyle = {
                    ['--lit-delay' as string]: `${litDelay.toFixed(2)}s`,
                  } as CSSProperties
                  return (
                    <g key={stage.label} style={nodeStyle}>
                      <circle className={styles.nodeHalo} cx={NODE_X} cy={cy} r={16} />
                      <circle className={styles.nodeRing} cx={NODE_X} cy={cy} r={9} />
                      <circle className={styles.nodeCore} cx={NODE_X} cy={cy} r={4} />
                      <text
                        className={styles.nodeIndex}
                        x={NODE_X}
                        y={cy + 3.2}
                        textAnchor="middle"
                      >
                        {i + 1}
                      </text>
                      <text className={styles.nodeLabel} x={NODE_X + 30} y={cy - 2}>
                        {stage.label}
                      </text>
                      <text className={styles.nodeNote} x={NODE_X + 30} y={cy + 14}>
                        {stage.note}
                      </text>
                    </g>
                  )
                })}

                {/* The lead token: one pass, then continuous pulses */}
                {!reduced && (
                  <>
                    <circle className={styles.leadHalo} r={7} cx={0} cy={0} />
                    <circle className={styles.lead} r={4.5} cx={0} cy={0} />
                    {/* trailing pulses keep the engine alive after the pass */}
                    <circle className={`${styles.pulse} ${styles.pulseA}`} r={3.5} cx={0} cy={0} />
                    <circle className={`${styles.pulse} ${styles.pulseB}`} r={3} cx={0} cy={0} />
                    <circle className={`${styles.pulse} ${styles.pulseC}`} r={2.6} cx={0} cy={0} />
                  </>
                )}
              </svg>
            </div>

            <div className={styles.engineFoot}>
              <span className={styles.footItem}>
                <span
                  className={`${styles.footSwatch} ${styles.footSwatchIn}`}
                  aria-hidden="true"
                />
                Zero manual handoffs
              </span>
              <span className={styles.footItem}>
                <span
                  className={`${styles.footSwatch} ${styles.footSwatchOut}`}
                  aria-hidden="true"
                />
                Unified &amp; orchestrated
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

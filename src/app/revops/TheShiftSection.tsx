'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import styles from './TheShiftSection.module.css'

/* ==========================================================================
   TheShiftSection — "The shift" section, Concept A.
   A premium "Headcount vs Output" data-viz that animates once on scroll-in.
   Self-contained: React + module CSS only. Inline SVG, no libraries.
   ========================================================================== */

/** Comparison rows: old way of growing (hire) -> new way (engineer). */
const COMPARISONS: ReadonlyArray<{ old: string; next: string }> = [
  {
    old: 'Hire more reps for manual work',
    next: 'Build systems that do it for you',
  },
  {
    old: 'Buy another tool, hope it sticks',
    next: 'Connect the tools you already run',
  },
  { old: 'Clean the CRM by hand', next: 'Keep data accurate automatically' },
  {
    old: 'Chase follow-ups manually',
    next: 'Trigger the next action automatically',
  },
  {
    old: 'Send more, measure activity',
    next: 'Act on intent, measure outcomes',
  },
]

/* ---- Chart geometry (SVG viewBox coordinates) --------------------------- */
const VB_W = 640
const VB_H = 380
const PAD_L = 46
const PAD_R = 118 // room on the right for the value chips
const PAD_T = 26
const PAD_B = 40
const PLOT_L = PAD_L
const PLOT_R = VB_W - PAD_R
const PLOT_T = PAD_T
const PLOT_B = VB_H - PAD_B
const PLOT_W = PLOT_R - PLOT_L
const PLOT_H = PLOT_B - PLOT_T

/** Map a 0..1 (x) / 0..1 (y, 0 = bottom) point into plot pixels. */
function px(nx: number, ny: number): [number, number] {
  return [PLOT_L + nx * PLOT_W, PLOT_B - ny * PLOT_H]
}

/**
 * Build a smooth cubic-bezier path string from normalized sample points.
 * Uses a Catmull-Rom -> Bezier conversion for organic, "expensive" curves.
 */
function smoothPath(points: ReadonlyArray<readonly [number, number]>): string {
  const pts = points.map(([nx, ny]) => px(nx, ny))
  const first = pts[0]
  if (!first) return ''
  if (pts.length < 2) return `M ${first[0]} ${first[1]}`

  let d = `M ${first[0]} ${first[1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? pts[i + 1]
    if (!p0 || !p1 || !p2 || !p3) continue
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`
  }
  return d
}

/* Normalized sample points. x: 0 (left) -> 1 (right). y: 0 (bottom) -> 1 (top).
   Both start together, then HEADCOUNT flattens into a plateau while OUTPUT
   keeps compounding upward and diverges. */
const HEADCOUNT_PTS: ReadonlyArray<readonly [number, number]> = [
  [0.0, 0.12],
  [0.16, 0.32],
  [0.32, 0.46],
  [0.48, 0.53],
  [0.64, 0.56],
  [0.8, 0.575],
  [1.0, 0.58],
]
const OUTPUT_PTS: ReadonlyArray<readonly [number, number]> = [
  [0.0, 0.12],
  [0.16, 0.3],
  [0.32, 0.44],
  [0.48, 0.58],
  [0.64, 0.72],
  [0.8, 0.85],
  [1.0, 0.95],
]

const HEADCOUNT_D = smoothPath(HEADCOUNT_PTS)
const OUTPUT_D = smoothPath(OUTPUT_PTS)

/** Closed area between the two lines (the "leverage" gap). */
const GAP_D = (() => {
  const outLast = OUTPUT_PTS[OUTPUT_PTS.length - 1]
  const forward = smoothPath(OUTPUT_PTS)
  // walk headcount back to the start to close the shape
  const backPts = [...HEADCOUNT_PTS].reverse()
  const back = backPts
    .map(([nx, ny]) => {
      const [x, y] = px(nx, ny)
      return `${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' L ')
  if (!outLast) return ''
  return `${forward} L ${back} Z`
})()

/* End coordinates for chips + lead dot. */
const OUT_END = px(1, 0.95)
const HEAD_END = px(1, 0.58)

/* Approximate path length used to seed stroke-dasharray for the draw-in.
   The exact value does not matter as long as it exceeds the true length. */
const DASH = 1600

const OUTPUT_TARGET = 3.4 // "x" pipeline multiple that counts up
const HEAD_VALUE = '+1x'

export function TheShiftSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [play, setPlay] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [outputCount, setOutputCount] = useState(0)
  const rafRef = useRef<number | null>(null)

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

    // If reduced motion, jump straight to the final state.
    if (reduced) {
      const id = window.requestAnimationFrame(() => {
        setPlay(true)
        setOutputCount(OUTPUT_TARGET)
      })
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

  // Count-up for the output value chip, kicked off shortly after play begins.
  useEffect(() => {
    if (!play || reduced) return
    const COUNT_DELAY_MS = 1750
    const COUNT_DUR_MS = 900
    let startTs: number | null = null
    let started = false

    const timeout = window.setTimeout(() => {
      started = true
      const step = (ts: number) => {
        if (startTs === null) startTs = ts
        const t = Math.min(1, (ts - startTs) / COUNT_DUR_MS)
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3)
        setOutputCount(Number((eased * OUTPUT_TARGET).toFixed(2)))
        if (t < 1) {
          rafRef.current = window.requestAnimationFrame(step)
        }
      }
      rafRef.current = window.requestAnimationFrame(step)
    }, COUNT_DELAY_MS)

    return () => {
      window.clearTimeout(timeout)
      if (started && rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [play, reduced])

  // Percent conversion so chips can be positioned over the SVG responsively.
  const chipStyleOutput = useMemo<CSSProperties>(
    () => ({
      left: `${(OUT_END[0] / VB_W) * 100}%`,
      top: `${(OUT_END[1] / VB_H) * 100}%`,
      transform: 'translate(2%, -50%)',
    }),
    []
  )
  const chipStyleHeadcount = useMemo<CSSProperties>(
    () => ({
      left: `${(HEAD_END[0] / VB_W) * 100}%`,
      top: `${(HEAD_END[1] / VB_H) * 100}%`,
      transform: 'translate(2%, -50%)',
    }),
    []
  )

  // Reference the output path for the leading-edge dot's offset-path.
  const dotStyle = useMemo<CSSProperties>(
    () =>
      ({
        // offset-path takes an SVG path; CSS custom property consumed in module CSS
        ['--output-path' as string]: `path('${OUTPUT_D}')`,
      }) as CSSProperties,
    []
  )

  const stateClass = reduced ? styles.reduced : play ? styles.play : ''

  // Horizontal gridlines at quarters.
  const gridYs = [0.25, 0.5, 0.75, 1]

  return (
    <section
      ref={sectionRef}
      className={`${styles.section} ${stateClass}`}
      aria-labelledby="shift-heading"
    >
      <div className={styles.inner}>
        {/* ---------- LEFT: copy ---------- */}
        <div className={styles.copy}>
          <span className={styles.eyebrow}>{'// THE SHIFT'}</span>

          <h2 id="shift-heading" className={`${styles.header} ${styles.reveal}`}>
            The old way to grow was to <span className={styles.accentOld}>hire</span>. The new way
            is to <span className={styles.accentNew}>engineer</span>.
          </h2>

          <p className={`${styles.subhead} ${styles.reveal}`}>
            Grow faster or run leaner. Usually both. Today you do both by engineering the system,
            not by adding to the team. And with most companies still running revenue operations
            without real automation, the teams that move first pull ahead.
          </p>

          <div className={styles.rowsHead}>
            <span className={styles.colHeadOld}>Resourcing your team</span>
            <span className={styles.colHeadNew}>Engineering your team</span>
          </div>
          <div className={styles.rows}>
            {COMPARISONS.map((c) => (
              <div className={styles.row} key={c.old}>
                <span className={styles.old}>
                  <span className={styles.oldDot} aria-hidden="true" />
                  {c.old}
                </span>
                <span className={styles.arrow} aria-hidden="true">
                  <svg className={styles.arrowSvg} viewBox="0 0 26 12" fill="none">
                    <line className={styles.arrowLine} x1="1" y1="6" x2="22" y2="6" />
                    <polyline className={styles.arrowHead} points="18,2 24,6 18,10" />
                  </svg>
                </span>
                <span className={styles.new}>
                  <span className={styles.newDot} aria-hidden="true" />
                  {c.next}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ---------- RIGHT: chart ---------- */}
        <div className={styles.viz}>
          <div className={styles.chartCard}>
            <div className={styles.chartHead}>
              <span className={styles.chartTitle}>Headcount vs Output</span>
              <span className={styles.chartMeta}>SAME TEAM · OVER TIME</span>
            </div>

            <div style={{ position: 'relative' }}>
              <svg
                className={styles.chartSvg}
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                role="img"
                aria-label="Line chart: headcount and cost flatten into a plateau while output and pipeline keep climbing, widening the leverage gap between them."
              >
                <defs>
                  <linearGradient id="shiftGap" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f8cff" stopOpacity="0.28" />
                    <stop offset="55%" stopColor="#4f8cff" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#f5a623" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                {gridYs.map((gy) => {
                  const [, y] = px(0, gy)
                  return (
                    <line
                      key={`grid-${gy}`}
                      className={styles.grid}
                      x1={PLOT_L}
                      y1={y}
                      x2={PLOT_R}
                      y2={y}
                    />
                  )
                })}

                {/* Axes */}
                <line className={styles.axis} x1={PLOT_L} y1={PLOT_T} x2={PLOT_L} y2={PLOT_B} />
                <line className={styles.axis} x1={PLOT_L} y1={PLOT_B} x2={PLOT_R} y2={PLOT_B} />

                {/* Axis labels */}
                <text className={styles.axisLabel} x={PLOT_L} y={PLOT_B + 22} textAnchor="start">
                  NOW
                </text>
                <text className={styles.axisLabel} x={PLOT_R} y={PLOT_B + 22} textAnchor="end">
                  LATER
                </text>
                <text className={styles.axisLabel} x={PLOT_L - 8} y={PLOT_T + 4} textAnchor="end">
                  HIGH
                </text>

                {/* Leverage gap area */}
                <path className={styles.gap} d={GAP_D} fill="url(#shiftGap)" />

                {/* Headcount / cost line (flattens) */}
                <path
                  className={`${styles.line} ${styles.lineHeadcount}`}
                  d={HEADCOUNT_D}
                  style={{
                    strokeDasharray: DASH,
                    strokeDashoffset: reduced ? 0 : DASH,
                  }}
                />

                {/* Output / pipeline line (compounds) */}
                <path
                  className={`${styles.line} ${styles.lineOutput}`}
                  d={OUTPUT_D}
                  style={{
                    strokeDasharray: DASH,
                    strokeDashoffset: reduced ? 0 : DASH,
                  }}
                />

                {/* Leading-edge dot travelling along the output line */}
                {!reduced && (
                  <>
                    <circle className={styles.leadDotHalo} r={5} cx={0} cy={0} style={dotStyle} />
                    <circle className={styles.leadDot} r={4} cx={0} cy={0} style={dotStyle} />
                  </>
                )}
              </svg>

              {/* Value chips (HTML, positioned over the SVG) */}
              <div className={`${styles.chip} ${styles.chipOutput}`} style={chipStyleOutput}>
                <span className={styles.chipLabel}>Output / pipeline</span>
                <span className={styles.chipValue}>{outputCount.toFixed(1)}x</span>
              </div>
              <div className={`${styles.chip} ${styles.chipHeadcount}`} style={chipStyleHeadcount}>
                <span className={styles.chipLabel}>Headcount / cost</span>
                <span className={styles.chipValue}>{HEAD_VALUE}</span>
              </div>
            </div>

            {/* Legend */}
            <div className={styles.legend}>
              <span className={styles.legendItem}>
                <span
                  className={`${styles.legendSwatch} ${styles.legendSwatchOld}`}
                  aria-hidden="true"
                />
                Add people <strong>(flattens)</strong>
              </span>
              <span className={styles.legendItem}>
                <span
                  className={`${styles.legendSwatch} ${styles.legendSwatchNew}`}
                  aria-hidden="true"
                />
                Engineer the system <strong>(compounds)</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

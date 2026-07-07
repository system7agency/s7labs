'use client'

import { useEffect, useRef, useState, type ReactElement } from 'react'

import styles from './RoleViz.module.css'

/* ==========================================================================
   RoleViz — a small, LABELLED "artifact" per role: the concrete thing each
   role produces, annotated so the meaning is unmistakable.
     researcher   sources -> a titled BRIEF
     analyst      a bar chart with the flagged EXCEPTION
     operator     a checklist of named tasks ticking through
     reviewer     work with an APPROVED stamp
     coordinator  a card handed agent -> tool -> person (labelled)
     reporter     a titled REPORT filling with rows + a chart
   Shared blue language (structure #4f8cff, output #e6f0ff + glow, amber
   #f5b544 flag). Self-contained reveal + reduced-motion.
   ========================================================================== */

export type RoleKey =
  | 'researcher'
  | 'analyst'
  | 'operator'
  | 'reviewer'
  | 'coordinator'
  | 'reporter'

function Researcher() {
  return (
    <>
      <rect className={styles.srcDoc} x="12" y="16" width="14" height="18" rx="1.5" />
      <rect className={styles.srcDoc} x="19" y="11" width="14" height="18" rx="1.5" />
      <rect className={styles.srcDoc} x="26" y="6" width="14" height="18" rx="1.5" />
      <text className={styles.cap} x="12" y="46">
        3 SOURCES
      </text>
      <path className={styles.flow} d="M48 21 L68 21" />
      <path className={styles.flowHead} d="M64 18 l4 3 l-4 3" />
      <rect className={styles.frame} x="78" y="6" width="130" height="46" rx="3" />
      <text className={styles.capOut} x="87" y="18">
        BRIEF
      </text>
      <line className={styles.titleRule} x1="87" y1="22" x2="199" y2="22" />
      <line
        className={`${styles.writeLine} ${styles.w1}`}
        x1="87"
        y1="31"
        x2="188"
        y2="31"
        pathLength={100}
      />
      <line
        className={`${styles.writeLine} ${styles.w2}`}
        x1="87"
        y1="39"
        x2="199"
        y2="39"
        pathLength={100}
      />
      <line
        className={`${styles.writeLine} ${styles.w3}`}
        x1="87"
        y1="47"
        x2="174"
        y2="47"
        pathLength={100}
      />
    </>
  )
}

function Analyst() {
  const bars: [number, number][] = [
    [24, 34],
    [48, 28],
    [72, 36],
    [96, 30],
    [120, 16],
    [144, 32],
    [168, 38],
    [192, 26],
  ]
  return (
    <>
      <line className={styles.axis} x1="16" y1="50" x2="204" y2="50" />
      {bars.map(([x, top], i) => {
        const hi = i === 4
        return (
          <rect
            key={x}
            className={`${styles.bar} ${hi ? styles.barHi : ''} ${styles[`b${i}` as 'b0']}`}
            x={x}
            y={top}
            width="7"
            height={50 - top}
            rx="1"
          />
        )
      })}
      <path className={styles.amber} d="M123.5 6 l4 4 l-4 4 l-4 -4 z" />
      <text className={styles.capAmber} x="140" y="12">
        EXCEPTION
      </text>
    </>
  )
}

function Operator() {
  const tasks = [
    [12, 'record.update'],
    [26, 'task.create'],
    [40, 'route.lead'],
    [54, 'schedule'],
  ] as const
  return (
    <>
      {tasks.map(([y, label], i) => (
        <g key={label}>
          <rect className={styles.box} x="13" y={y - 5.5} width="11" height="11" rx="2" />
          <text className={styles.taskLabel} x="32" y={y + 2.4}>
            {label}
          </text>
          <text className={`${styles.checkGlyph} ${styles[`c${i}` as 'c0']}`} x="18.5" y={y + 0.5}>
            ✓
          </text>
        </g>
      ))}
    </>
  )
}

function Reviewer() {
  return (
    <>
      <rect className={styles.frame} x="22" y="10" width="94" height="40" rx="3" />
      <text className={styles.cap} x="30" y="21">
        WORK
      </text>
      <line className={styles.docLine} x1="30" y1="30" x2="106" y2="30" />
      <line className={styles.docLine} x1="30" y1="38" x2="98" y2="38" />
      <circle className={styles.stampRing} cx="164" cy="26" r="15" />
      <text className={styles.stampGlyph} x="164" y="27">
        ✓
      </text>
      <text className={`${styles.capOut} ${styles.approved}`} x="164" y="52">
        APPROVED
      </text>
    </>
  )
}

function Coordinator() {
  return (
    <>
      <line className={styles.relay} x1="34" y1="22" x2="186" y2="22" />

      {/* agent — hexagon */}
      <g className={`${styles.node} ${styles.p0}`}>
        <path d="M34 14 l7 4 v8 l-7 4 l-7 -4 v-8 z" />
      </g>
      <text className={styles.nodeLabel} x="34" y="44">
        agent
      </text>

      {/* tool — gear */}
      <g className={`${styles.node} ${styles.p1}`}>
        <circle cx="110" cy="22" r="5" />
        <path d="M110 15 v-3 M110 29 v3 M103 22 h-3 M117 22 h3 M105 17 l-2 -2 M115 17 l2 -2 M105 27 l-2 2 M115 27 l2 2" />
      </g>
      <text className={styles.nodeLabel} x="110" y="44">
        tool
      </text>

      {/* person */}
      <g className={`${styles.node} ${styles.p2}`}>
        <circle cx="186" cy="16" r="4.5" />
        <path d="M178 30 a 8 7 0 0 1 16 0" />
      </g>
      <text className={styles.nodeLabel} x="186" y="44">
        person
      </text>

      <g className={styles.card}>
        <rect x="-7" y="-5" width="14" height="10" rx="1.5" />
        <line x1="-4" y1="-1.5" x2="4" y2="-1.5" />
        <line x1="-4" y1="1.5" x2="2" y2="1.5" />
      </g>
    </>
  )
}

function Reporter() {
  return (
    <>
      <line className={styles.actTick} x1="14" y1="40" x2="14" y2="30" />
      <line className={styles.actTick} x1="22" y1="40" x2="22" y2="22" />
      <line className={styles.actTick} x1="30" y1="40" x2="30" y2="34" />
      <text className={styles.cap} x="12" y="52">
        ACTIVITY
      </text>
      <path className={styles.feed} d="M40 27 L54 27" />
      <rect className={styles.frame} x="56" y="6" width="150" height="46" rx="3" />
      <text className={styles.capOut} x="64" y="18">
        REPORT
      </text>
      <rect className={styles.repBar} x="176" y="30" width="6" height="14" rx="1" />
      <rect className={styles.repBar} x="186" y="22" width="6" height="22" rx="1" />
      <rect className={styles.repBar} x="196" y="34" width="6" height="10" rx="1" />
      <line className={styles.titleRule} x1="64" y1="22" x2="168" y2="22" />
      <line
        className={`${styles.repRow} ${styles.rr1}`}
        x1="64"
        y1="31"
        x2="160"
        y2="31"
        pathLength={100}
      />
      <line
        className={`${styles.repRow} ${styles.rr2}`}
        x1="64"
        y1="39"
        x2="150"
        y2="39"
        pathLength={100}
      />
      <line
        className={`${styles.repRow} ${styles.rr3}`}
        x1="64"
        y1="47"
        x2="158"
        y2="47"
        pathLength={100}
      />
    </>
  )
}

const RENDER: Record<RoleKey, () => ReactElement> = {
  researcher: Researcher,
  analyst: Analyst,
  operator: Operator,
  reviewer: Reviewer,
  coordinator: Coordinator,
  reporter: Reporter,
}

export function RoleViz({ role, index = 0 }: { role: RoleKey; index?: number }) {
  const ref = useRef<SVGSVGElement | null>(null)
  const [play, setPlay] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.requestAnimationFrame(() => setReduced(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced || typeof IntersectionObserver === 'undefined') {
      const id = window.requestAnimationFrame(() => setPlay(true))
      return () => window.cancelAnimationFrame(id)
    }
    let timer: ReturnType<typeof setTimeout> | undefined
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          timer = setTimeout(() => setPlay(true), index * 90)
          observer.disconnect()
        }
      },
      { threshold: 0.25 }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [reduced, index])

  const state = reduced ? styles.reduced : play ? styles.play : ''
  const Shape = RENDER[role]

  return (
    <svg
      ref={ref}
      className={`${styles.viz} ${styles[role]} ${state}`}
      viewBox="0 0 220 60"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden="true"
    >
      <Shape />
    </svg>
  )
}

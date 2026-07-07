'use client'

import { useEffect, useRef, useState, type ReactElement } from 'react'

import styles from './BuildIcon.module.css'

/* ==========================================================================
   BuildIcon — a wide, labelled animated panel per "What we build" card that
   sits in the card body (between the description and the chips), so each build
   type reads clearly:
     tools      an internal dashboard/console (rows highlight)
     automation INPUT -> process -> OUTPUT with work flowing through
     client     a mobile app delivered to customers
     integrate  a hub wired to your labelled systems (pulses flow inward)
   Shared blue language; self-contained reveal + reduced-motion.
   ========================================================================== */

export type BuildIconType = 'tools' | 'automation' | 'client' | 'integrate'

function Tools() {
  const chart: [number, number][] = [
    [88, 31],
    [98, 26],
    [108, 33],
    [118, 24],
    [128, 29],
  ]
  return (
    <>
      <rect className={styles.frame} x="8" y="6" width="224" height="42" rx="3" />
      <line className={styles.bar} x1="8" y1="15" x2="232" y2="15" />
      <circle className={styles.dot} cx="15" cy="10.5" r="1.3" />
      <circle className={styles.dot} cx="21" cy="10.5" r="1.3" />
      <circle className={styles.dot} cx="27" cy="10.5" r="1.3" />

      {/* KPI metric tile */}
      <rect className={styles.tile} x="16" y="20" width="56" height="22" rx="2" />
      <line className={styles.metricVal} x1="23" y1="29" x2="45" y2="29" />
      <path className={styles.trend} d="M49 32 l4 -4 l3 2" />
      <line className={styles.metricLbl} x1="23" y1="36" x2="58" y2="36" />

      {/* bar chart tile */}
      <rect className={styles.tile} x="80" y="20" width="64" height="22" rx="2" />
      {chart.map(([x, top], i) => (
        <rect
          key={x}
          className={`${styles.chartBar} ${styles[`cb${i}` as 'cb0']}`}
          x={x}
          y={top}
          width="5"
          height={40 - top}
          rx="1"
        />
      ))}

      {/* toggle + list tile */}
      <rect className={styles.tile} x="152" y="20" width="80" height="22" rx="2" />
      <rect className={styles.toggleTrack} x="160" y="25" width="16" height="7" rx="3.5" />
      <circle className={styles.toggleKnob} cx="164" cy="28.5" r="2.4" />
      <line className={`${styles.tRow} ${styles.tr0}`} x1="184" y1="27" x2="224" y2="27" />
      <line className={`${styles.tRow} ${styles.tr1}`} x1="184" y1="35" x2="212" y2="35" />
    </>
  )
}

function Automation() {
  return (
    <>
      <line className={styles.wire} x1="30" y1="27" x2="210" y2="27" />
      <circle className={styles.node} cx="30" cy="27" r="7" />
      <path className={styles.inArrow} d="M27 24 l3 3 l-3 3" />
      <rect className={`${styles.node} ${styles.proc}`} x="112" y="19" width="16" height="16" rx="2" />
      <path className={styles.gear} d="M120 12 v-4 M120 42 v4 M108 27 h-4 M132 27 h4" />
      <circle className={`${styles.node} ${styles.out}`} cx="210" cy="27" r="7" />
      <path className={styles.check} d="M206 27 l3 3 l5 -6" pathLength={100} />
      <circle className={styles.tok} r="3" />
      <text className={styles.cap} x="30" y="46">
        INPUT
      </text>
      <text className={styles.cap} x="120" y="46">
        PROCESS
      </text>
      <text className={styles.cap} x="210" y="46">
        OUTPUT
      </text>
    </>
  )
}

function Client() {
  const users: [number, number][] = [
    [150, 20],
    [178, 15],
    [178, 39],
    [206, 27],
  ]
  return (
    <>
      {/* mobile app */}
      <rect className={styles.device} x="26" y="6" width="34" height="42" rx="5" />
      <line className={styles.notch} x1="37" y1="11" x2="49" y2="11" />
      <rect className={styles.screenHdr} x="32" y="16" width="18" height="5" rx="1.5" />
      <line className={`${styles.screenRow} ${styles.s0}`} x1="32" y1="27" x2="54" y2="27" />
      <line className={`${styles.screenRow} ${styles.s1}`} x1="32" y1="33" x2="48" y2="33" />
      <circle className={styles.home} cx="43" cy="42" r="1.6" />
      {/* delivered to customers */}
      <path className={styles.flow} d="M66 27 L96 27" />
      <path className={styles.flowHead} d="M92 24 l4 3 l-4 3" />
      {users.map(([x, y], i) => (
        <g key={i} className={`${styles.person} ${styles[`u${i}` as 'u0']}`}>
          <circle cx={x} cy={y - 3} r="3" />
          <path d={`M${x - 5} ${y + 5} a5 4.5 0 0 1 10 0`} />
        </g>
      ))}
      <text className={styles.cap} x="43" y="46">
        APP
      </text>
      <text className={styles.cap} x="178" y="50">
        CUSTOMERS
      </text>
    </>
  )
}

function Integrate() {
  const systems: [number, number, string][] = [
    [34, 14, 'CRM'],
    [34, 42, 'EMAIL'],
    [120, 8, 'API'],
    [206, 14, 'DATA'],
    [206, 42, 'PAY'],
  ]
  return (
    <>
      {systems.map(([x, y], i) => (
        <line key={`s${i}`} className={styles.spoke} x1={x} y1={y} x2="120" y2="28" />
      ))}
      {systems.map(([x, y, label], i) => (
        <g key={`n${i}`}>
          <rect className={styles.sysNode} x={x - 8} y={y - 5} width="16" height="10" rx="2" />
          <text className={styles.sysLabel} x={x} y={y + 2.3}>
            {label}
          </text>
        </g>
      ))}
      {systems.map(([x, y], i) => (
        <circle
          key={`p${i}`}
          className={`${styles.pulse} ${styles[`sp${i}` as 'sp0']}`}
          cx={x}
          cy={y}
          r="1.8"
        />
      ))}
      <circle className={styles.hub} cx="120" cy="28" r="7" />
      <circle className={styles.hubDot} cx="120" cy="28" r="2.4" />
    </>
  )
}

const RENDER: Record<BuildIconType, () => ReactElement> = {
  tools: Tools,
  automation: Automation,
  client: Client,
  integrate: Integrate,
}

export function BuildIcon({ type }: { type: BuildIconType }) {
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
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setPlay(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [reduced])

  const state = reduced ? styles.reduced : play ? styles.play : ''
  const Shape = RENDER[type]

  return (
    <svg
      ref={ref}
      className={`${styles.icon} ${styles[type]} ${state}`}
      viewBox="0 0 240 54"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden="true"
    >
      <Shape />
    </svg>
  )
}

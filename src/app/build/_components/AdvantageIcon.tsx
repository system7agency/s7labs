'use client'

import { useEffect, useRef, useState, type ReactElement } from 'react'

import styles from './AdvantageIcon.module.css'

/* ==========================================================================
   AdvantageIcon — a small animated icon per "The advantage" card, so each
   claim reads at a glance:
     fast    build bars fill fast, with a spark  (built fast)
     fit     a custom piece snaps into its exact slot  (fitted exactly)
     change  config sliders adjust  (easy to change)
     own     a key turns  (yours to own)
   Shared blue language; self-contained reveal + reduced-motion.
   ========================================================================== */

export type AdvantageIconType = 'fast' | 'fit' | 'change' | 'own'

function Fast() {
  return (
    <>
      <rect className={styles.track} x="6" y="12" width="26" height="4" rx="2" />
      <rect className={styles.track} x="6" y="20" width="26" height="4" rx="2" />
      <rect className={styles.track} x="6" y="28" width="26" height="4" rx="2" />
      <rect className={`${styles.fill} ${styles.f0}`} x="6" y="12" width="20" height="4" rx="2" />
      <rect className={`${styles.fill} ${styles.f1}`} x="6" y="20" width="26" height="4" rx="2" />
      <rect className={`${styles.fill} ${styles.f2}`} x="6" y="28" width="15" height="4" rx="2" />
      <path className={styles.bolt} d="M38 5 L31 20 L36 20 L33 35 L42 18 L37 18 Z" />
    </>
  )
}

function Fit() {
  return (
    <>
      {/* the exact-shaped gap it fills */}
      <path
        className={styles.gap}
        d="M11 11 H18.5 A3.5 3.5 0 0 1 25.5 11 H33 V18.5 A3.5 3.5 0 0 0 33 25.5 V33 H11 Z"
      />
      {/* the custom jigsaw piece, snapping into it */}
      <path
        className={styles.jigsaw}
        d="M11 11 H18.5 A3.5 3.5 0 0 1 25.5 11 H33 V18.5 A3.5 3.5 0 0 0 33 25.5 V33 H11 Z"
      />
    </>
  )
}

function Change() {
  return (
    <>
      <line className={styles.strack} x1="8" y1="13" x2="36" y2="13" />
      <line className={styles.strack} x1="8" y1="22" x2="36" y2="22" />
      <line className={styles.strack} x1="8" y1="31" x2="36" y2="31" />
      <circle className={`${styles.handle} ${styles.h0}`} cx="18" cy="13" r="3.2" />
      <circle className={`${styles.handle} ${styles.h1}`} cx="26" cy="22" r="3.2" />
      <circle className={`${styles.handle} ${styles.h2}`} cx="14" cy="31" r="3.2" />
    </>
  )
}

function Own() {
  return (
    <g className={styles.key}>
      <circle className={styles.keyHead} cx="13" cy="22" r="6" />
      <circle className={styles.keyHole} cx="13" cy="22" r="2.2" />
      <line className={styles.keyShaft} x1="19" y1="22" x2="36" y2="22" />
      <line className={styles.keyTooth} x1="31" y1="22" x2="31" y2="27" />
      <line className={styles.keyTooth} x1="36" y1="22" x2="36" y2="26" />
    </g>
  )
}

const RENDER: Record<AdvantageIconType, () => ReactElement> = {
  fast: Fast,
  fit: Fit,
  change: Change,
  own: Own,
}

export function AdvantageIcon({ type }: { type: AdvantageIconType }) {
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
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden="true"
    >
      <Shape />
    </svg>
  )
}

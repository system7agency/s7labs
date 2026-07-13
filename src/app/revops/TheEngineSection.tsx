'use client'

import { useEffect, useRef, useState } from 'react'

import {
  MotionRoot,
  VIEWPORT,
  fadeUp,
  m,
  staggerParent,
  useInView,
  useScroll,
  useTransform,
} from '@/components/Motion'

/* Stage names and descriptors are verbatim from the copy doc. */
const STAGES = [
  { name: 'Source & enrich', cap: 'build and clean target lists from live data' },
  { name: 'Research', cap: 'AI agents brief every account and contact' },
  { name: 'Signals', cap: 'track intent, hiring, funding and tech changes' },
  { name: 'Verify', cap: 'validate contacts for deliverability' },
  { name: 'Sequence', cap: 'launch personalised outreach across email and social' },
  { name: 'Route', cap: 'score, qualify and assign to the right rep' },
]

/* Left column: eyebrow + two-line title + description. This block holds still
   (it lives in the sticky frame) while the timeline plays on the right. */
function EngineHead() {
  return (
    <div className="rv-eng-head">
      <div className="fx-eyebrow">
        <span className="lead">
          <span className="slashes">{'//'}</span> THE ENGINE
        </span>
        <span className="num">06</span>
      </div>
      <m.h2
        className="fx-h2"
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        One pipeline.
        <br />
        <span className="accent-text">Every step connected.</span>
      </m.h2>
      <m.p
        className="fx-sub"
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        The capabilities above don&rsquo;t have to run in isolation. We wire them into an engine
        where a lead can move from sourced to synced with zero manual handoffs - your tools, vendors
        and infrastructure unified, orchestrated and handled.
      </m.p>
    </div>
  )
}

function StageRow({ index, name, cap }: { index: number; name: string; cap: string }) {
  return (
    <div className="rv-eng-stage" role="listitem">
      <span className="rv-eng-node" aria-hidden="true" />
      <span className="rv-eng-idx">{String(index + 1).padStart(2, '0')}</span>
      <div className="rv-eng-name">{name}</div>
      <p className="rv-eng-cap">{cap}</p>
    </div>
  )
}

/* The full sourced → synced strip: SOURCED marker, the spine with its stages,
   then SYNCED. Shared by the pinned and flowing variants. */
function Strip() {
  return (
    <>
      <span className="rv-eng-end">SOURCED</span>
      <div className="rv-eng-track">
        <span className="rv-eng-line" aria-hidden="true" />
        <div role="list" aria-label="The pipeline">
          {STAGES.map((s, i) => (
            <StageRow key={s.name} index={i} name={s.name} cap={s.cap} />
          ))}
        </div>
      </div>
      <span className="rv-eng-end synced">SYNCED</span>
    </>
  )
}

/* Desktop: the section pins, the left heading holds still, and the right-hand
   timeline travels upward through a soft-masked window as you scroll — so the
   pipeline "keeps moving" from sourced to synced before the page continues
   (client's ask). A tall wrapper provides the scroll distance; the sticky
   child is the fixed frame; the strip's own height minus the window height is
   how far it travels. */
function PinnedEngine() {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const windowRef = useRef<HTMLDivElement | null>(null)
  const stripRef = useRef<HTMLDivElement | null>(null)
  const [travel, setTravel] = useState(0)

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ['start start', 'end end'],
  })
  const y = useTransform(scrollYProgress, [0.06, 0.94], [0, -travel])

  useEffect(() => {
    const measure = () => {
      const win = windowRef.current
      const strip = stripRef.current
      if (!win || !strip) return
      setTravel(Math.max(0, strip.scrollHeight - win.clientHeight))
    }
    measure()
    const id = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <div ref={wrapRef} className="rv-engpin">
      <div className="rv-engpin-sticky">
        <EngineHead />
        <div ref={windowRef} className="rv-eng-window">
          <m.div ref={stripRef} className="rv-eng-strip" style={{ y }}>
            <Strip />
          </m.div>
        </div>
      </div>
    </div>
  )
}

/* Mobile / reduced-motion fallback: heading then the full timeline stacked in
   normal flow, revealed once on entry instead of scroll-scrubbed. */
function FlowingEngine() {
  const ref = useRef<HTMLDivElement | null>(null)
  const inView = useInView(ref, { once: true, amount: 0.12 })

  return (
    <div className="rv-eng-flow">
      <EngineHead />
      <m.div
        ref={ref}
        className="rv-eng-strip flow"
        variants={staggerParent(0.08)}
        initial="hidden"
        animate={inView ? 'show' : 'hidden'}
      >
        <Strip />
      </m.div>
    </div>
  )
}

/* 06 · The engine — one pipeline, sourced → synced. */
export function TheEngineSection() {
  // Pin on wide desktop pointers only; phones and reduced-motion get the
  // flowing version. Decided after mount so SSR renders the safe fallback.
  const [pinned, setPinned] = useState(false)
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 981px)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setPinned(wide.matches && !reduced.matches)
    update()
    wide.addEventListener('change', update)
    reduced.addEventListener('change', update)
    return () => {
      wide.removeEventListener('change', update)
      reduced.removeEventListener('change', update)
    }
  }, [])

  return (
    <MotionRoot>
      <section className="fx-sec rv-eng-sec" aria-label="The engine">
        {pinned ? <PinnedEngine /> : <FlowingEngine />}
      </section>
    </MotionRoot>
  )
}

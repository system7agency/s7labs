'use client'

import { useEffect, useRef, useState } from 'react'

import styles from './TheModelSection.module.css'

/* ==========================================================================
   TheModelSection — Agent Section 05: "The model".
   Positioning: a build studio, not a SaaS platform. The custom AI stack is
   model-agnostic. The visual makes that literal: a provider rail whose active
   model cycles, streaming a token across a bus into the S7 stack, whose top
   layer swaps to match. Self-contained reveal + swap (own IntersectionObserver,
   not tied to PageScripts section numbering), reduced-motion aware.
   ========================================================================== */

const PROVIDERS = ['Claude', 'GPT', 'Gemini', 'Llama', 'Mistral'] as const
const SWAP_MS = 2400

export function TheModelSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [play, setPlay] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [active, setActive] = useState(0)

  // Detect reduced motion once (deferred setState so it is not synchronous-in-effect).
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.requestAnimationFrame(() => setReduced(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  // Reveal once when scrolled into view.
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    if (reduced || typeof IntersectionObserver === 'undefined') {
      const id = window.requestAnimationFrame(() => setPlay(true))
      return () => window.cancelAnimationFrame(id)
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting) {
          setPlay(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [reduced])

  // Cycle the active model while visible (the "swap").
  useEffect(() => {
    if (!play || reduced) return
    const id = window.setInterval(() => {
      setActive((a) => (a + 1) % PROVIDERS.length)
    }, SWAP_MS)
    return () => window.clearInterval(id)
  }, [play, reduced])

  const state = reduced ? styles.reduced : play ? styles.play : ''

  return (
    <section ref={sectionRef} className="sec reveal" data-sec="05">
      <div className="sec-tag">
        <span className="n">05</span>
        <span className="lbl">
          <span>{'// THE MODEL'}</span>
          <span className="v">THE MODEL</span>
        </span>
      </div>
      <div className="sec-head">
        <div className="left">
          <h2>
            You don&rsquo;t subscribe to agents. You build a{' '}
            <span className="accent-text">model-agnostic capability.</span>
          </h2>
          <p>
            Most agent tools hand you a platform and leave you to configure it. We work the other
            way - S<sup>7</sup> Labs designs, connects and scales a custom AI stack around your
            systems, your rules and your data, then grows it as the agents earn trust. The stack is
            model-agnostic, so we run whatever model leads the market and swap as that changes - you
            are never locked to one provider.
          </p>
        </div>
        <div className="right">
          <span className="pd" />
          <span>
            MODEL-AGNOSTIC · <span className="v">SWAPPABLE</span>
          </span>
        </div>
      </div>

      {/* Animated "model-agnostic stack" */}
      <div className={`${styles.viz} ${state}`} aria-hidden="true">
        <div className={styles.providers}>
          <div className={styles.railLabel}>{'// MODEL PROVIDERS'}</div>
          {PROVIDERS.map((p, i) => (
            <div key={p} className={`${styles.prov} ${i === active ? styles.provActive : ''}`}>
              <span className={styles.provDot} />
              <span className={styles.provName}>{p}</span>
              <span className={styles.provTag}>{i === active ? 'active' : 'ready'}</span>
            </div>
          ))}
        </div>

        <div className={styles.bus}>
          <div className={styles.busTrack}>
            <span className={styles.busToken} />
          </div>
          <div className={`${styles.swap} ${play && !reduced ? styles.swapActive : ''}`}>
            SWAP →
          </div>
        </div>

        <div className={styles.stack}>
          <div className={styles.stackLabel}>{'// S7 CUSTOM AI STACK'}</div>
          <div className={`${styles.layer} ${styles.layerTop}`}>
            <span className={styles.layerK}>Model</span>
            <span className={styles.layerV}>{PROVIDERS[active]}</span>
          </div>
          <div className={styles.layer}>
            <span className={styles.layerK}>Agents</span>
            <span className={styles.layerMuted}>orchestrated</span>
          </div>
          <div className={styles.layer}>
            <span className={styles.layerK}>Your data · rules · systems</span>
          </div>
        </div>
      </div>
    </section>
  )
}

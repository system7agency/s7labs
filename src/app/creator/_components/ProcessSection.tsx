'use client'

import { useEffect, useRef } from 'react'

const STEPS = [
  {
    num: '01',
    glyph: '◎',
    title: 'Discovery',
    desc: "We map your audience, what they'd pay for, and what your competitors don't offer.",
    tag: '2–3 days',
  },
  {
    num: '02',
    glyph: '◈',
    title: 'Architecture',
    desc: 'Product specification, tech stack selection, and UX blueprinting — built for your launch.',
    tag: '1 week',
  },
  {
    num: '03',
    glyph: '◉',
    title: 'Build',
    desc: 'Full-stack development with weekly check-ins. You see progress every step of the way.',
    tag: '4–8 weeks',
  },
  {
    num: '04',
    glyph: '✦',
    title: 'Launch',
    desc: 'We deploy, you announce. Ongoing support, iterations, and feature expansion included.',
    tag: 'Ongoing',
  },
]

export function ProcessSection() {
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      stepRefs.current.forEach((el) => {
        if (el) el.classList.add('lit')
      })
      return
    }

    const observers: IntersectionObserver[] = []

    stepRefs.current.forEach((el) => {
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            el.classList.add('lit')
          }
        },
        { threshold: 0.35 }
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => {
      observers.forEach((o) => o.disconnect())
    }
  }, [])

  return (
    <section className="section">
      <div className="section-head">
        <span className="section-eyebrow">
          <span className="accent-dot" />
          {'// THE BUILD PROCESS'}
        </span>
        <span className="section-num">03 / 06</span>
      </div>

      <div className="process-intro">
        <h2>
          From idea to live product in <span className="accent-text">under 90 days.</span>
        </h2>
        <p>
          We run a tight, opinionated process. Four phases, weekly visibility, and a launch-ready
          product at the end.
        </p>
      </div>

      <div className="pipeline">
        {STEPS.map((step, i) => (
          <div
            key={step.num}
            className="pipeline-step"
            ref={(el) => {
              stepRefs.current[i] = el
            }}
          >
            <div className="step-node" aria-hidden="true">
              {step.glyph}
            </div>
            <div className="step-num">{step.num}</div>
            <h3 className="step-title">{step.title}</h3>
            <p className="step-desc">{step.desc}</p>
            <span className="step-tag">{step.tag}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

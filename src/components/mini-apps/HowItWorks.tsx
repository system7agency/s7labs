'use client'

import { useEffect, useRef } from 'react'

import './HowItWorks.css'

export type HowItWorksStep = {
  title: string
  description: string
  icon: React.ReactNode
}

type Props = {
  eyebrow?: string
  title: React.ReactNode
  subtitle?: string
  steps: HowItWorksStep[]
}

export function HowItWorks({ eyebrow = 'How it works', title, subtitle, steps }: Props) {
  const rootRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const items = root.querySelectorAll<HTMLElement>('.hiw-step')
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('in-view'))
      return
    }

    const seen = new WeakSet<Element>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !seen.has(entry.target)) {
            seen.add(entry.target)
            const idx = Number((entry.target as HTMLElement).dataset.idx ?? 0)
            window.setTimeout(() => {
              entry.target.classList.add('in-view')
            }, idx * 120)
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.25, rootMargin: '0px 0px -10% 0px' }
    )
    items.forEach((el, i) => {
      el.dataset.idx = String(i)
      observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={rootRef} className="how-it-works">
      <div className="hiw-head">
        <span className="hiw-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>

      <ol className="hiw-steps">
        {steps.map((step, i) => {
          const side = i % 2 === 0 ? 'left' : 'right'
          const label = `Step ${String(i + 1).padStart(2, '0')}`
          return (
            <li className="hiw-step" data-side={side} key={i}>
              <div className="hiw-rail">
                <span className="hiw-dot" />
              </div>
              <div className="hiw-card">
                <span className="hiw-step-label">{label}</span>
                <div className="hiw-card-row">
                  <div className="hiw-icon" aria-hidden>
                    {step.icon}
                  </div>
                  <div className="hiw-text">
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default HowItWorks

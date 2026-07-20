'use client'

import { useEffect } from 'react'

/**
 * Per-page client effects.
 *
 * Background animation (aurora canvas + cursor spotlight) is handled by
 * <AuroraBackground />. This page renders its "How it works" timeline as
 * inline JSX (not the shared <HowItWorks/> component), so the scroll-triggered
 * fade-up observer still lives here.
 */
export function PageScripts() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const steps = document.querySelectorAll<HTMLElement>('.pricing-diag .hiw-step')
    if (steps.length === 0) return

    if (prefersReduced || !('IntersectionObserver' in window)) {
      steps.forEach((s) => s.classList.add('in-view'))
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
    steps.forEach((s, i) => {
      s.dataset.idx = String(i)
      observer.observe(s)
    })
    return () => observer.disconnect()
  }, [])

  return null
}

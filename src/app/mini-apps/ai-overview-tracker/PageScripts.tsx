'use client'

import { useEffect } from 'react'

export function PageScripts() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ac = new AbortController()

    if (!prefersReduced) {
      const spot = document.getElementById('aot-spotlight')
      if (spot) {
        window.addEventListener(
          'pointermove',
          (e) => {
            spot.style.setProperty('--mx', `${e.clientX}px`)
            spot.style.setProperty('--my', `${e.clientY}px`)
          },
          { signal: ac.signal, passive: true }
        )
      }
    }

    const steps = document.querySelectorAll<HTMLElement>('.ai-overview-tracker .hiw-step')
    if (prefersReduced) {
      steps.forEach((s) => s.classList.add('in-view'))
    } else if (steps.length > 0 && 'IntersectionObserver' in window) {
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
    } else {
      steps.forEach((s) => s.classList.add('in-view'))
    }

    return () => ac.abort()
  }, [])

  return null
}

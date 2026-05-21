'use client'

import { useEffect } from 'react'

export function PageScripts() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const spot = document.getElementById('or-spotlight')
    if (!spot) return

    const ac = new AbortController()
    window.addEventListener(
      'pointermove',
      (e) => {
        spot.style.setProperty('--mx', e.clientX + 'px')
        spot.style.setProperty('--my', e.clientY + 'px')
      },
      { signal: ac.signal, passive: true }
    )

    return () => ac.abort()
  }, [])

  return null
}

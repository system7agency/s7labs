'use client'

import { useEffect, useRef } from 'react'

import { useReducedMotion } from '@/hooks/useReducedMotion'

export function CursorSpotlight() {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) return
    const el = ref.current
    if (!el) return

    let pending = false
    function onMove(event: PointerEvent) {
      if (pending) return
      pending = true
      requestAnimationFrame(() => {
        el!.style.setProperty('--mx', `${event.clientX}px`)
        el!.style.setProperty('--my', `${event.clientY}px`)
        pending = false
      })
    }

    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [prefersReducedMotion])

  return <div ref={ref} className="bg-spotlight" aria-hidden="true" />
}

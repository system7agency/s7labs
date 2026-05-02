'use client'

import { useEffect, useRef, useState } from 'react'

import { useReducedMotion } from '@/hooks/useReducedMotion'

type TiltState = {
  rotateX: number
  rotateY: number
  glareX: number
  glareY: number
  active: boolean
}

const INITIAL: TiltState = {
  rotateX: 0,
  rotateY: 0,
  glareX: 50,
  glareY: 50,
  active: false,
}

export function useCardTilt<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const [tilt, setTilt] = useState<TiltState>(INITIAL)
  const prefersReducedMotion = useReducedMotion()
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (prefersReducedMotion) return
    const el = ref.current
    if (!el) return

    function onMove(event: PointerEvent) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const rect = el!.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top
        const px = x / rect.width
        const py = y / rect.height
        const rotateY = (px - 0.5) * 10
        const rotateX = -(py - 0.5) * 10
        setTilt({
          rotateX,
          rotateY,
          glareX: px * 100,
          glareY: py * 100,
          active: true,
        })
      })
    }

    function onLeave() {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      setTilt(INITIAL)
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [prefersReducedMotion])

  return { ref, tilt, prefersReducedMotion }
}

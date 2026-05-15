'use client'

import { useEffect } from 'react'

/*
 * Voice Agent — aurora, spotlight, and the persistent waveform thread.
 * The waveform is the page's signature concept: a continuous designed
 * audio signal threading top-to-bottom, modulating on scroll.
 */

type RGB = { r: number; g: number; b: number }
type Blob = {
  x: number
  y: number
  r: number
  color: RGB
  phase: number
  speed: number
}

const ACCENT_RGB: RGB = { r: 79, g: 140, b: 255 }
const WARM_RGB: RGB = { r: 4, g: 227, b: 238 }

export function PageScripts() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ac = new AbortController()
    const rafIds = new Set<number>()
    let cancelled = false

    function raf(cb: FrameRequestCallback): number {
      const id = requestAnimationFrame((t) => {
        rafIds.delete(id)
        if (cancelled) return
        cb(t)
      })
      rafIds.add(id)
      return id
    }

    // ---------- AURORA ----------
    const canvas = document.getElementById('aurora') as HTMLCanvasElement | null
    const ctx = canvas?.getContext('2d') ?? null
    let W = 0
    let H = 0
    if (canvas && ctx) {
      const cool: RGB = { r: 80, g: 140, b: 255 }
      const blobs: Blob[] = [
        { x: 0.3, y: 0.3, r: 0.45, color: ACCENT_RGB, phase: 0, speed: 0.00018 },
        { x: 0.7, y: 0.45, r: 0.42, color: cool, phase: 2.1, speed: 0.00022 },
        { x: 0.5, y: 0.75, r: 0.38, color: ACCENT_RGB, phase: 4.2, speed: 0.0002 },
        { x: 0.2, y: 0.8, r: 0.3, color: WARM_RGB, phase: 1.3, speed: 0.00025 },
        { x: 0.85, y: 0.15, r: 0.28, color: ACCENT_RGB, phase: 3.7, speed: 0.00016 },
      ]

      const resizeCanvas = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
        W = canvas.width = window.innerWidth * dpr
        H = canvas.height = window.innerHeight * dpr
        canvas.style.width = window.innerWidth + 'px'
        canvas.style.height = window.innerHeight + 'px'
      }
      resizeCanvas()
      window.addEventListener('resize', resizeCanvas, { signal: ac.signal })

      if (!prefersReduced) {
        const t0 = performance.now()
        const drawAurora = (now: number) => {
          const dt = now - t0
          // breathing pulse — blobs gently scale with the waveform's heartbeat
          const breath = 1 + Math.sin(dt * 0.0008) * 0.05
          ctx.clearRect(0, 0, W, H)
          ctx.globalCompositeOperation = 'lighter'
          for (const b of blobs) {
            const ox = Math.sin(dt * b.speed + b.phase) * 0.15
            const oy = Math.cos(dt * b.speed * 1.3 + b.phase * 1.5) * 0.12
            const cx = (b.x + ox) * W
            const cy = (b.y + oy) * H
            const r = b.r * Math.min(W, H) * breath
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
            grad.addColorStop(0, `rgba(${b.color.r},${b.color.g},${b.color.b},0.5)`)
            grad.addColorStop(0.4, `rgba(${b.color.r},${b.color.g},${b.color.b},0.18)`)
            grad.addColorStop(1, `rgba(${b.color.r},${b.color.g},${b.color.b},0)`)
            ctx.fillStyle = grad
            ctx.beginPath()
            ctx.arc(cx, cy, r, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.globalCompositeOperation = 'source-over'
          raf(drawAurora)
        }
        raf(drawAurora)
      }
    }

    // ---------- SPOTLIGHT (cursor) ----------
    const spot = document.getElementById('spotlight')
    let mx = window.innerWidth / 2
    let my = window.innerHeight / 3
    let tmx = mx
    let tmy = my
    window.addEventListener(
      'pointermove',
      (e) => {
        tmx = e.clientX
        tmy = e.clientY
      },
      { signal: ac.signal }
    )
    if (spot && !prefersReduced) {
      const spotLoop = () => {
        mx += (tmx - mx) * 0.08
        my += (tmy - my) * 0.08
        spot.style.setProperty('--mx', mx + 'px')
        spot.style.setProperty('--my', my + 'px')
        raf(spotLoop)
      }
      raf(spotLoop)
    }

    // expose a no-op global hook so the form can still call pulse() without breaking
    type VAGlobal = { pulse?: () => void }
    const g = window as unknown as { VOICE_AGENT?: VAGlobal }
    g.VOICE_AGENT = { pulse: () => {} }

    return () => {
      cancelled = true
      ac.abort()
      rafIds.forEach((id) => cancelAnimationFrame(id))
      rafIds.clear()
      const gc = window as unknown as { VOICE_AGENT?: VAGlobal }
      delete gc.VOICE_AGENT
    }
  }, [])

  return null
}

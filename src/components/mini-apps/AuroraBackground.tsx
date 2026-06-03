'use client'

import { useEffect, useRef } from 'react'

import './AuroraBackground.css'

type RGB = { r: number; g: number; b: number }
type Blob = {
  x: number
  y: number
  r: number
  color: RGB
  phase: number
  speed: number
}

/**
 * Animated aurora + dotted background + grain + cursor-tracked spotlight,
 * matching the /mini-apps and /revops pages. Drop it inside a mini-app page
 * (anywhere in the JSX tree) and the rest is handled.
 */
export function AuroraBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const spotlightRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ac = new AbortController()
    const rafIds = new Set<number>()
    let cancelled = false

    const raf = (cb: FrameRequestCallback): number => {
      const id = requestAnimationFrame((t) => {
        rafIds.delete(id)
        if (cancelled) return
        cb(t)
      })
      rafIds.add(id)
      return id
    }

    // ----- aurora canvas -----
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d') ?? null
    let W = 0
    let H = 0
    if (canvas && ctx) {
      const deep: RGB = { r: 1, g: 54, b: 252 }
      const indigo: RGB = { r: 1, g: 87, b: 249 }
      const azure: RGB = { r: 2, g: 119, b: 247 }
      const sky: RGB = { r: 3, g: 151, b: 244 }
      const teal: RGB = { r: 3, g: 184, b: 241 }
      const blobs: Blob[] = [
        { x: 0.3, y: 0.3, r: 0.45, color: deep, phase: 0, speed: 0.00018 },
        { x: 0.7, y: 0.45, r: 0.42, color: indigo, phase: 2.1, speed: 0.00022 },
        { x: 0.5, y: 0.75, r: 0.38, color: azure, phase: 4.2, speed: 0.0002 },
        { x: 0.2, y: 0.8, r: 0.3, color: teal, phase: 1.3, speed: 0.00025 },
        { x: 0.85, y: 0.15, r: 0.28, color: sky, phase: 3.7, speed: 0.00016 },
      ]
      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
        W = canvas.width = window.innerWidth * dpr
        H = canvas.height = window.innerHeight * dpr
        canvas.style.width = window.innerWidth + 'px'
        canvas.style.height = window.innerHeight + 'px'
      }
      resize()
      window.addEventListener('resize', resize, { signal: ac.signal })

      if (!prefersReduced) {
        const t0 = performance.now()
        const draw = (now: number) => {
          const dt = now - t0
          ctx.clearRect(0, 0, W, H)
          ctx.globalCompositeOperation = 'lighter'
          for (const b of blobs) {
            const ox = Math.sin(dt * b.speed + b.phase) * 0.15
            const oy = Math.cos(dt * b.speed * 1.3 + b.phase * 1.5) * 0.12
            const cx = (b.x + ox) * W
            const cy = (b.y + oy) * H
            const r = b.r * Math.min(W, H)
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
            grad.addColorStop(0, `rgba(${b.color.r},${b.color.g},${b.color.b},0.45)`)
            grad.addColorStop(0.4, `rgba(${b.color.r},${b.color.g},${b.color.b},0.16)`)
            grad.addColorStop(1, `rgba(${b.color.r},${b.color.g},${b.color.b},0)`)
            ctx.fillStyle = grad
            ctx.beginPath()
            ctx.arc(cx, cy, r, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.globalCompositeOperation = 'source-over'
          raf(draw)
        }
        raf(draw)
      } else {
        // Reduced motion: draw a single static frame so the page isn't pitch black.
        ctx.globalCompositeOperation = 'lighter'
        for (const b of blobs) {
          const cx = b.x * W
          const cy = b.y * H
          const r = b.r * Math.min(W, H)
          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
          grad.addColorStop(0, `rgba(${b.color.r},${b.color.g},${b.color.b},0.45)`)
          grad.addColorStop(0.4, `rgba(${b.color.r},${b.color.g},${b.color.b},0.16)`)
          grad.addColorStop(1, `rgba(${b.color.r},${b.color.g},${b.color.b},0)`)
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(cx, cy, r, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    // ----- cursor spotlight -----
    const spot = spotlightRef.current
    if (spot && !prefersReduced) {
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
        { signal: ac.signal, passive: true }
      )
      const loop = () => {
        mx += (tmx - mx) * 0.08
        my += (tmy - my) * 0.08
        spot.style.setProperty('--mx', mx + 'px')
        spot.style.setProperty('--my', my + 'px')
        raf(loop)
      }
      raf(loop)
    }

    return () => {
      cancelled = true
      ac.abort()
      rafIds.forEach((id) => cancelAnimationFrame(id))
      rafIds.clear()
    }
  }, [])

  return (
    <>
      <div className="aurora-bg-stack" aria-hidden="true">
        <canvas ref={canvasRef} id="aurora" />
        <div className="aurora-bg-dots" />
      </div>
      <div ref={spotlightRef} className="aurora-bg-spotlight" aria-hidden="true" />
      <div className="aurora-bg-grain" aria-hidden="true" />
    </>
  )
}

export default AuroraBackground

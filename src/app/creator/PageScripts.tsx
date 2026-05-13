'use client'

import { useEffect } from 'react'

/*
 * Creator Lab page client scripts — same aurora/spotlight pattern as
 * revops/PageScripts.tsx, plus typewriter headline animation.
 */

const ACCENT_RGB = { r: 79, g: 140, b: 255 }

type RGB = { r: number; g: number; b: number }
type Blob = {
  x: number
  y: number
  r: number
  color: RGB
  phase: number
  speed: number
}

const TYPEWRITER_PHRASES = [
  'Build software your audience pays for.',
  'Launch your platform. Own your audience.',
  'Turn followers into recurring revenue.',
]

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

    /* ── Aurora canvas ── */
    const canvas = document.getElementById('aurora') as HTMLCanvasElement | null
    const ctx = canvas?.getContext('2d') ?? null
    let W = 0
    let H = 0

    if (canvas && ctx) {
      const cool: RGB = { r: 80, g: 140, b: 255 }
      const warm: RGB = { r: 4, g: 227, b: 238 }
      const blobs: Blob[] = [
        { x: 0.3, y: 0.3, r: 0.45, color: ACCENT_RGB, phase: 0, speed: 0.00018 },
        { x: 0.7, y: 0.45, r: 0.42, color: cool, phase: 2.1, speed: 0.00022 },
        { x: 0.5, y: 0.75, r: 0.38, color: ACCENT_RGB, phase: 4.2, speed: 0.0002 },
        { x: 0.2, y: 0.8, r: 0.3, color: warm, phase: 1.3, speed: 0.00025 },
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
          ctx.clearRect(0, 0, W, H)
          ctx.globalCompositeOperation = 'lighter'
          for (const b of blobs) {
            const ox = Math.sin(dt * b.speed + b.phase) * 0.15
            const oy = Math.cos(dt * b.speed * 1.3 + b.phase * 1.5) * 0.12
            const cx = (b.x + ox) * W
            const cy = (b.y + oy) * H
            const r = b.r * Math.min(W, H)
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

    /* ── Spotlight follow ── */
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

    /* ── Typewriter headline ── */
    const target = document.getElementById('hero-type-target')
    if (target && !prefersReduced) {
      let phraseIdx = 0
      let charIdx = 0
      let deleting = false
      let timer: ReturnType<typeof setTimeout>

      const TYPE_SPEED = 48
      const DELETE_SPEED = 24
      const PAUSE_AFTER = 2400

      const tick = () => {
        if (cancelled) return
        const phrase = TYPEWRITER_PHRASES[phraseIdx]!
        if (!deleting) {
          charIdx++
          target.textContent = phrase.slice(0, charIdx)
          if (charIdx === phrase.length) {
            deleting = true
            timer = setTimeout(tick, PAUSE_AFTER)
            return
          }
          timer = setTimeout(tick, TYPE_SPEED)
        } else {
          charIdx--
          target.textContent = phrase.slice(0, charIdx)
          if (charIdx === 0) {
            deleting = false
            phraseIdx = (phraseIdx + 1) % TYPEWRITER_PHRASES.length
            timer = setTimeout(tick, 420)
            return
          }
          timer = setTimeout(tick, DELETE_SPEED)
        }
      }

      timer = setTimeout(tick, 1200)

      return () => {
        cancelled = true
        clearTimeout(timer)
        ac.abort()
        rafIds.forEach((id) => cancelAnimationFrame(id))
        rafIds.clear()
      }
    }

    return () => {
      cancelled = true
      ac.abort()
      rafIds.forEach((id) => cancelAnimationFrame(id))
      rafIds.clear()
    }
  }, [])

  return null
}

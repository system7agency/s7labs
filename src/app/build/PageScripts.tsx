'use client'

import { useEffect } from 'react'

type RGB = { r: number; g: number; b: number }
type Blob = {
  x: number
  y: number
  r: number
  color: RGB
  phase: number
  speed: number
}

export function PageScripts() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ac = new AbortController()
    const rafIds = new Set<number>()
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const intervals = new Set<ReturnType<typeof setInterval>>()
    const observers: IntersectionObserver[] = []
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
    function later(cb: () => void, ms: number) {
      const id = setTimeout(() => {
        timers.delete(id)
        if (!cancelled) cb()
      }, ms)
      timers.add(id)
      return id
    }

    /* Aurora canvas */
    const canvas = document.getElementById('aurora') as HTMLCanvasElement | null
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
            grad.addColorStop(0, `rgba(${b.color.r},${b.color.g},${b.color.b},0.45)`)
            grad.addColorStop(0.4, `rgba(${b.color.r},${b.color.g},${b.color.b},0.16)`)
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

    /* Spotlight follow */
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

    /* Typewriter (hero line 1) */
    const l1 = document.querySelector<HTMLElement>('.build-lab .hero-title .line.l1')
    const l2 = document.querySelector<HTMLElement>('.build-lab .hero-title .line.l2')
    const typed = l1?.querySelector<HTMLElement>('.typed') ?? null
    const text = typed?.dataset.text ?? ''
    if (l1 && l2 && typed) {
      if (prefersReduced) {
        typed.textContent = text
        l1.classList.add('done')
        l2.classList.add('show')
      } else {
        let i = 0
        const tick = () => {
          if (cancelled) return
          typed.textContent = text.slice(0, i)
          i++
          if (i <= text.length) {
            later(tick, 32 + Math.random() * 12)
          } else {
            later(() => {
              l1.classList.add('done')
              l2.classList.add('show')
            }, 240)
          }
        }
        later(tick, 700)
      }
    }

    /* Status strip cycler */
    const steps = document.querySelectorAll<HTMLElement>('.build-lab #statusStrip .step')
    if (steps.length && !prefersReduced) {
      let s = 0
      const id = setInterval(() => {
        steps.forEach((el) => el.classList.remove('on'))
        s = (s + 1) % steps.length
        steps[s]?.classList.add('on')
      }, 2200)
      intervals.add(id)
    }

    /* Reveal on scroll */
    const revealIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            revealIO.unobserve(e.target)
          }
        })
      },
      { threshold: 0.15 }
    )
    observers.push(revealIO)
    document.querySelectorAll('.build-lab .reveal').forEach((el) => revealIO.observe(el))

    /* Staggered sub-item reveals */
    const staggerWatch = (rootSel: string, itemSel: string, gap: number) => {
      const sio = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.querySelectorAll(itemSel).forEach((it, idx) => {
                later(() => it.classList.add('in'), idx * gap)
              })
              sio.unobserve(e.target)
            }
          })
        },
        { threshold: 0.2 }
      )
      observers.push(sio)
      document.querySelectorAll(`.build-lab ${rootSel}`).forEach((r) => sio.observe(r))
    }
    staggerWatch('.build-grid', '[data-build]', 150)
    staggerWatch('.anatomy', '[data-acomp]', 80)
    staggerWatch('.modes', '[data-mode]', 110)
    staggerWatch('.support', '[data-supp]', 100)
    staggerWatch('.examples-grid', '[data-example]', 140)

    /* Pipeline sequential illumination */
    const pipeIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const stages = e.target.querySelectorAll('[data-stage]')
            stages.forEach((s, idx) => later(() => s.classList.add('lit'), 200 + idx * 220))
            pipeIO.unobserve(e.target)
          }
        })
      },
      { threshold: 0.3 }
    )
    observers.push(pipeIO)
    const pipe = document.getElementById('pipe')
    if (pipe) pipeIO.observe(pipe)

    return () => {
      cancelled = true
      ac.abort()
      rafIds.forEach((id) => cancelAnimationFrame(id))
      rafIds.clear()
      timers.forEach((id) => clearTimeout(id))
      timers.clear()
      intervals.forEach((id) => clearInterval(id))
      intervals.clear()
      observers.forEach((o) => o.disconnect())
    }
  }, [])

  return null
}

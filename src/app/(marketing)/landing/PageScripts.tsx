'use client'

import { useEffect } from 'react'

/*
 * Direct port of the inline <script> from
 * /docs/design-reference/landing-page.html.
 *
 * Stripped: tweaks panel, postMessage edit-mode wiring, 't' shortcut.
 * Inlined: tweaks.accent (#B8FF5C), tweaks.typeSpeedMs (38),
 * tweaks.aurora (always true), tweaks.tilt (always true).
 */

const ACCENT_RGB = { r: 184, g: 255, b: 92 }
const TYPE_SPEED_MS = 38

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
    const timeouts = new Set<ReturnType<typeof setTimeout>>()
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
    function delay(ms: number): Promise<void> {
      return new Promise((resolve) => {
        const id = setTimeout(() => {
          timeouts.delete(id)
          resolve()
        }, ms)
        timeouts.add(id)
      })
    }

    // -------- AURORA --------
    const canvas = document.getElementById('aurora') as HTMLCanvasElement | null
    const ctx = canvas?.getContext('2d') ?? null
    let W = 0
    let H = 0
    if (canvas && ctx) {
      const cool: RGB = { r: 80, g: 140, b: 255 }
      const warm: RGB = { r: 255, g: 130, b: 80 }
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

    // -------- SPOTLIGHT --------
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

    // -------- 3D tilt on cards --------
    const tiltCards = document.querySelectorAll<HTMLElement>('.tiltable')
    tiltCards.forEach((card) => {
      let cardRaf = 0
      card.addEventListener(
        'pointermove',
        (e) => {
          if (prefersReduced) return
          const ev = e as PointerEvent
          const rect = card.getBoundingClientRect()
          const x = (ev.clientX - rect.left) / rect.width
          const y = (ev.clientY - rect.top) / rect.height
          const rx = (y - 0.5) * -10
          const ry = (x - 0.5) * 14
          cancelAnimationFrame(cardRaf)
          cardRaf = requestAnimationFrame(() => {
            card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`
            card.style.setProperty('--cx', x * 100 + '%')
            card.style.setProperty('--cy', y * 100 + '%')
          })
        },
        { signal: ac.signal }
      )
      card.addEventListener(
        'pointerleave',
        () => {
          cancelAnimationFrame(cardRaf)
          card.style.transform = ''
        },
        { signal: ac.signal }
      )
    })

    // -------- 3D tilt on hero title --------
    const titleWrap = document.getElementById('titleWrap')
    if (titleWrap && !prefersReduced) {
      const titleLoop = () => {
        const cx = window.innerWidth / 2
        const cy = window.innerHeight / 3
        const dx = (mx - cx) / window.innerWidth
        const dy = (my - cy) / window.innerHeight
        const rx = dy * -6
        const ry = dx * 8
        titleWrap.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`
        raf(titleLoop)
      }
      raf(titleLoop)
    }

    // -------- Typewriter --------
    function typewrite(el: Element, text: string): Promise<void> {
      return new Promise((resolve) => {
        if (prefersReduced) {
          el.textContent = text
          resolve()
          return
        }
        let i = 0
        el.textContent = ''
        const step = () => {
          if (cancelled) {
            resolve()
            return
          }
          if (i >= text.length) {
            resolve()
            return
          }
          el.textContent += text[i++]
          const id = setTimeout(
            () => {
              timeouts.delete(id)
              step()
            },
            TYPE_SPEED_MS + (Math.random() * 20 - 10)
          )
          timeouts.add(id)
        }
        step()
      })
    }

    async function runHero() {
      const sub = document.getElementById('heroSub')
      if (!sub) return
      const full = 'Introducing our innovation lab — cutting edge, forefront of tech.'
      // Clear any prior run (StrictMode dev double-mount safety).
      sub.textContent = ''
      await delay(prefersReduced ? 0 : 900)
      if (cancelled) return
      const cursor = document.createElement('span')
      cursor.className = 'cursor'
      const textNode = document.createTextNode('')
      sub.appendChild(textNode)
      sub.appendChild(cursor)
      let i = 0
      await new Promise<void>((resolve) => {
        if (prefersReduced) {
          textNode.textContent = full
          resolve()
          return
        }
        const step = () => {
          if (cancelled) {
            resolve()
            return
          }
          if (i >= full.length) {
            resolve()
            return
          }
          textNode.textContent += full[i++]
          const id = setTimeout(
            () => {
              timeouts.delete(id)
              step()
            },
            TYPE_SPEED_MS + (Math.random() * 16 - 8)
          )
          timeouts.add(id)
        }
        step()
      })
    }

    async function runRoutes() {
      const cards = document.querySelectorAll<HTMLElement>('.route-card:not(.soon)')
      await Promise.all(
        Array.from(cards).map(
          (card, idx) =>
            new Promise<void>((resolve) => {
              const id = setTimeout(async () => {
                timeouts.delete(id)
                const typedEl = card.querySelector('.typed')
                const cursorEl = card.querySelector('.type-cursor')
                if (!typedEl || !cursorEl) {
                  resolve()
                  return
                }
                await typewrite(typedEl, card.dataset.label ?? '')
                cursorEl.classList.add('done')
                resolve()
              }, idx * 300)
              timeouts.add(id)
            })
        )
      )
    }

    function revealSoon() {
      const soon = document.querySelector<HTMLElement>('.route-card.soon')
      if (!soon) return
      soon.style.opacity = '0'
      const id = setTimeout(() => {
        timeouts.delete(id)
        soon.style.transition = 'opacity 1.2s ease'
        soon.style.opacity = '0.42'
      }, 100)
      timeouts.add(id)
    }

    async function run() {
      revealSoon()
      await runHero()
      await delay(200)
      if (cancelled) return
      await runRoutes()
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        const id = setTimeout(() => {
          timeouts.delete(id)
          run()
        }, 200)
        timeouts.add(id)
      })
    } else {
      const id = setTimeout(() => {
        timeouts.delete(id)
        run()
      }, 400)
      timeouts.add(id)
    }

    return () => {
      cancelled = true
      ac.abort()
      rafIds.forEach((id) => cancelAnimationFrame(id))
      rafIds.clear()
      timeouts.forEach((id) => clearTimeout(id))
      timeouts.clear()
    }
  }, [])

  return null
}

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

const CYCLE = [
  'reading.context',
  'tool.call.ready',
  'approval.required',
  'action.logged',
  'handing.off',
  'audit.synced',
]

const AUDIT_LINES: { html: string }[] = [
  {
    html: '[12:04:18] <span class="ag">agent.research</span> → tool.brave_search · <span class="v">query.dispatched</span>',
  },
  {
    html: '[12:04:21] <span class="ag">agent.research</span> → context.brief.draft · <span class="v">confidence=0.92</span>',
  },
  {
    html: '[12:04:23] <span style="color:var(--amber)">human.gate</span> → approval.requested · <span style="color:var(--amber)">pending</span>',
  },
  {
    html: '[12:04:47] <span style="color:var(--amber)">human.gate</span> → approved · <span style="color:var(--green)">action.logged</span>',
  },
  {
    html: '[12:04:51] <span class="ag">agent.operator</span> → tool.crm.update · <span class="v">record.synced</span>',
  },
  {
    html: '[12:04:54] <span class="ag">agent.orchestrator</span> → agent.report · <span class="v">handoff</span>',
  },
  {
    html: '[12:04:56] <span class="ag">agent.report</span> → summary.published · <span style="color:var(--green)">ok</span>',
  },
]

function parseClock(s: string) {
  const [h, m, sec] = s.split(':').map(Number)
  return (h ?? 0) * 3600 + (m ?? 0) * 60 + (sec ?? 0)
}
function formatClock(total: number) {
  total = ((total % 86400) + 86400) % 86400
  const h = String(Math.floor(total / 3600)).padStart(2, '0')
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
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

    /* Aurora */
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
      }
    }

    /* Spotlight */
    const spot = document.querySelector<HTMLElement>('.agent-lab .bg-spotlight')
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

    /* Typewriter */
    const l1 = document.querySelector<HTMLElement>('.agent-lab .hero-title .line.l1')
    const l2 = document.querySelector<HTMLElement>('.agent-lab .hero-title .line.l2')
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
          typed.textContent = text.slice(0, ++i)
          if (i < text.length) later(tick, 70 + Math.random() * 30)
          else
            later(() => {
              l1.classList.add('done')
              l2.classList.add('show')
            }, 420)
        }
        later(tick, 480)
      }
    }

    /* HUD clock */
    const clockEl = document.getElementById('hudClock')
    if (clockEl && !prefersReduced) {
      const start = Date.now()
      const t0 = parseClock('04:37:18')
      const id = setInterval(() => {
        const elapsed = Math.floor((Date.now() - start) / 1000)
        clockEl.textContent = formatClock(t0 + elapsed)
      }, 1000)
      intervals.add(id)
    }

    /* HUD status cycler */
    const cycler = document.getElementById('hudCycler')
    if (cycler && !prefersReduced) {
      let i = 0
      const id = setInterval(() => {
        i = (i + 1) % CYCLE.length
        cycler.style.opacity = '0'
        later(() => {
          cycler.textContent = CYCLE[i] ?? ''
          cycler.style.opacity = '1'
        }, 260)
      }, 2200)
      intervals.add(id)
    }

    /* Gantt foot audit stream */
    const stream = document.getElementById('gfStream')
    if (stream && !prefersReduced) {
      let i = 0
      const id = setInterval(() => {
        i = (i + 1) % AUDIT_LINES.length
        const next = document.createElement('span')
        next.className = 'gl'
        next.innerHTML = AUDIT_LINES[i]?.html ?? ''
        stream.innerHTML = ''
        stream.appendChild(next)
      }, 2400)
      intervals.add(id)
    }

    /* §06 log strip rotating opacity */
    const logStrip = document.getElementById('logStrip')
    if (logStrip && !prefersReduced) {
      const lines = Array.from(logStrip.querySelectorAll<HTMLElement>('.log-line'))
      let head = 0
      const id = setInterval(() => {
        head = (head + 1) % lines.length
        lines.forEach((ln, idx) => {
          const distance = (idx - head + lines.length) % lines.length
          ln.style.opacity = String(Math.max(0.25, 1 - distance * 0.13))
        })
      }, 1800)
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
      { threshold: 0.16, rootMargin: '0px 0px -10% 0px' }
    )
    observers.push(revealIO)
    document.querySelectorAll('.agent-lab .reveal').forEach((el) => revealIO.observe(el))

    /* §01 stagger */
    const vsSec = document.querySelector<HTMLElement>('.agent-lab [data-sec="01"]')
    if (vsSec) {
      const vsObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              const bot = vsSec.querySelectorAll<HTMLLIElement>('.vs-list[data-side="bot"] li')
              const ag = vsSec.querySelectorAll<HTMLLIElement>('.vs-list[data-side="agent"] li')
              bot.forEach((li, i) => later(() => li.classList.add('in'), 120 * i))
              ag.forEach((li, i) => later(() => li.classList.add('in'), 120 * i + 200))
              vsObs.unobserve(e.target)
            }
          })
        },
        { threshold: 0.25 }
      )
      observers.push(vsObs)
      vsObs.observe(vsSec)
    }

    /* §02 strata illuminate */
    const xsec = document.getElementById('agent-os')
    if (xsec) {
      const xObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              const strata = Array.from(xsec.querySelectorAll<HTMLElement>('.stratum'))
              const callouts = Array.from(xsec.querySelectorAll<HTMLElement>('.callout'))
              strata.forEach((s, i) => {
                later(() => {
                  const amb = s.dataset.lyr === '4'
                  s.classList.add('lit')
                  if (amb) s.classList.add('amb-lit')
                  const co = callouts[i]
                  if (co) {
                    co.classList.add('lit')
                    if (amb) co.classList.add('amb-lit')
                  }
                }, 240 * i)
              })
              xObs.unobserve(e.target)
            }
          })
        },
        { threshold: 0.18 }
      )
      observers.push(xObs)
      xObs.observe(xsec)
    }

    /* §03 roles stagger */
    const rolesSec = document.querySelector<HTMLElement>('.agent-lab [data-sec="03"]')
    if (rolesSec) {
      const rObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              rolesSec
                .querySelectorAll<HTMLElement>('.role')
                .forEach((c, i) => later(() => c.classList.add('in'), 120 * i))
              rObs.unobserve(e.target)
            }
          })
        },
        { threshold: 0.18 }
      )
      observers.push(rObs)
      rObs.observe(rolesSec)
    }

    /* §05 connectors stagger */
    const connSec = document.querySelector<HTMLElement>('.agent-lab [data-sec="05"]')
    if (connSec) {
      const cObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              connSec
                .querySelectorAll<HTMLElement>('.conn')
                .forEach((c, i) => later(() => c.classList.add('in'), 120 * i))
              cObs.unobserve(e.target)
            }
          })
        },
        { threshold: 0.18 }
      )
      observers.push(cObs)
      cObs.observe(connSec)
    }

    /* §06 governance stagger + log line stream */
    const govSec = document.querySelector<HTMLElement>('.agent-lab [data-sec="06"]')
    if (govSec) {
      const gObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              govSec
                .querySelectorAll<HTMLElement>('.gcard')
                .forEach((c, i) => later(() => c.classList.add('in'), 100 * i))
              govSec
                .querySelectorAll<HTMLElement>('.log-strip .log-line')
                .forEach((l, i) => later(() => l.classList.add('in'), 700 + 220 * i))
              gObs.unobserve(e.target)
            }
          })
        },
        { threshold: 0.18 }
      )
      observers.push(gObs)
      gObs.observe(govSec)
    }

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

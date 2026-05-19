'use client'

import { useEffect, type RefObject } from 'react'

type Options = {
  active: boolean
  /** Changes to this value force the build sequence to replay. */
  replayKey: string | number
  inClassName: string
  livePulseClassName: string
  nodeClassName: string
}

const STEP_MS = 600
const FAN_STAGGER_MS = 90
const NODE_DELAY_AFTER_EDGE_MS = 200
const EDGE_DRAW_MS = 320
const TYPE_MS_PER_CHAR = 26
const LIVE_PULSE_DELAY_MS = 900

export function useFlowBuildAnimation(
  flowWrapRef: RefObject<HTMLDivElement | null>,
  { active, replayKey, inClassName, livePulseClassName, nodeClassName }: Options
) {
  useEffect(() => {
    if (!active) return
    const wrap = flowWrapRef.current
    if (!wrap) return

    const reduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Discover nodes by attribute. Each node carries data-flow-node and data-flow-level.
    const nodeEls = Array.from(wrap.querySelectorAll<Element>('[data-flow-node]'))
    if (nodeEls.length === 0) return

    for (const el of nodeEls) el.classList.add(nodeClassName)

    // Group nodes by topological level (explicit, not Y-bucketed).
    const byLevel = new Map<number, Element[]>()
    for (const el of nodeEls) {
      const lvl = Number(el.getAttribute('data-flow-level') ?? '0')
      const arr = byLevel.get(lvl) ?? []
      arr.push(el)
      byLevel.set(lvl, arr)
    }
    const levels = Array.from(byLevel.keys()).sort((a, b) => a - b)
    const rows: Element[][] = levels.map((l) => byLevel.get(l) ?? [])

    // Discover edges: any <path> with marker-end inside the wrap (skip <defs>).
    const edges = Array.from(wrap.querySelectorAll<SVGPathElement>('path')).filter((p) => {
      if (p.closest('defs')) return false
      return p.hasAttribute('marker-end') || p.hasAttribute('markerEnd')
    })

    // Bucket each edge to the row whose top is closest to (and at/below) the edge's bottom Y.
    const wrapRect = wrap.getBoundingClientRect()
    const rowTops = rows.map((r) => {
      let min = Infinity
      for (const el of r) {
        const t = el.getBoundingClientRect().top - wrapRect.top
        if (t < min) min = t
      }
      return Number.isFinite(min) ? min : 0
    })

    const edgesByRow: SVGPathElement[][] = rows.map(() => [])
    for (const p of edges) {
      const pr = p.getBoundingClientRect()
      const endY = pr.bottom - wrapRect.top
      let bestIdx = 0
      let bestDist = Infinity
      for (let i = 0; i < rowTops.length; i++) {
        const ry = rowTops[i] ?? 0
        const d = Math.abs(ry - endY) + (ry >= endY - 6 ? 0 : 800)
        if (d < bestDist) {
          bestDist = d
          bestIdx = i
        }
      }
      const bucket = edgesByRow[bestIdx]
      if (bucket) bucket.push(p)
    }

    // Cache text content for typewriter (SVG <text> and HTML [data-flow-title]).
    type TextRec = { el: Element; original: string; isComplex: boolean }
    const textRecs = new Map<Element, TextRec[]>()
    for (const node of nodeEls) {
      const recs: TextRec[] = []
      const svgTexts = Array.from(node.querySelectorAll(':scope > text')) as SVGTextElement[]
      for (const el of svgTexts) {
        const hasTspan = el.querySelector('tspan') !== null
        recs.push({
          el,
          original: hasTspan ? el.innerHTML : el.textContent || '',
          isComplex: hasTspan,
        })
      }
      const htmlTitles = Array.from(node.querySelectorAll('[data-flow-title]'))
      for (const el of htmlTitles) {
        recs.push({ el, original: el.textContent || '', isComplex: false })
      }
      textRecs.set(node, recs)
    }

    // RESET — hide everything.
    for (const p of edges) {
      let len = 0
      try {
        len = p.getTotalLength()
      } catch {
        len = 0
      }
      if (len > 0) {
        p.style.strokeDasharray = `${len}`
        p.style.strokeDashoffset = `${len}`
      }
      p.style.opacity = '0'
      p.style.transition = ''
    }
    for (const node of nodeEls) {
      node.classList.remove(inClassName)
      node.classList.remove(livePulseClassName)
      const recs = textRecs.get(node) || []
      for (const r of recs) {
        if (!r.isComplex) (r.el as HTMLElement).textContent = ''
      }
    }

    if (reduced) {
      for (const p of edges) {
        p.style.strokeDashoffset = '0'
        p.style.opacity = '1'
      }
      for (const node of nodeEls) {
        node.classList.add(inClassName)
        const recs = textRecs.get(node) || []
        for (const r of recs) {
          if (!r.isComplex) (r.el as HTMLElement).textContent = r.original
        }
      }
      const firstR = rows[0]
      const lastR = rows[rows.length - 1]
      if (firstR) for (const g of firstR) g.classList.add(livePulseClassName)
      if (lastR) for (const g of lastR) g.classList.add(livePulseClassName)
      return
    }

    const timers: number[] = []
    const at = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, ms))
    }

    const startTypewriter = (node: Element) => {
      const recs = textRecs.get(node) || []
      for (const r of recs) {
        if (r.isComplex) {
          ;(r.el as SVGTextElement).innerHTML = r.original
          ;(r.el as unknown as HTMLElement).style.opacity = '0'
          ;(r.el as unknown as HTMLElement).style.transition =
            'opacity 360ms cubic-bezier(0.16,1,0.3,1)'
          requestAnimationFrame(() => {
            ;(r.el as unknown as HTMLElement).style.opacity = '1'
          })
          continue
        }
        const text = r.original
        let i = 0
        const tick = () => {
          if (!(r.el as HTMLElement).isConnected) return
          if (i <= text.length) {
            ;(r.el as HTMLElement).textContent = text.slice(0, i)
            i++
            timers.push(window.setTimeout(tick, TYPE_MS_PER_CHAR))
          }
        }
        tick()
      }
    }

    const drawEdge = (p: SVGPathElement) => {
      p.style.transition = `stroke-dashoffset ${EDGE_DRAW_MS}ms cubic-bezier(0.16,1,0.3,1), opacity 120ms ease`
      p.style.opacity = '1'
      requestAnimationFrame(() => {
        p.style.strokeDashoffset = '0'
      })
    }

    let cursor = 200
    for (let i = 0; i < rows.length; i++) {
      const rowNodes = rows[i] ?? []
      const rowEdges = edgesByRow[i] ?? []

      rowEdges.forEach((p, idx) => {
        at(cursor + idx * 30, () => drawEdge(p))
      })

      rowNodes.forEach((node, idx) => {
        at(cursor + NODE_DELAY_AFTER_EDGE_MS + idx * FAN_STAGGER_MS, () => {
          node.classList.add(inClassName)
          startTypewriter(node)
        })
      })

      cursor += STEP_MS + Math.max(0, (rowNodes.length - 1) * FAN_STAGGER_MS)
    }

    at(cursor + LIVE_PULSE_DELAY_MS, () => {
      const first = rows[0]
      const last = rows[rows.length - 1]
      if (first) for (const g of first) g.classList.add(livePulseClassName)
      if (last) for (const g of last) g.classList.add(livePulseClassName)
    })

    return () => {
      for (const t of timers) window.clearTimeout(t)
    }
  }, [active, replayKey, flowWrapRef, inClassName, livePulseClassName, nodeClassName])
}

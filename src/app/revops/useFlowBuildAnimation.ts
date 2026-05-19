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
const ROW_TOLERANCE = 60
const EDGE_DRAW_MS = 320
const TYPE_MS_PER_CHAR = 26
const LIVE_PULSE_DELAY_MS = 900

function getNodeY(g: SVGGElement): number {
  let translateY = 0
  const t = g.getAttribute('transform')
  if (t) {
    const m = t.match(/translate\(\s*[-\d.]+[\s,]+([-\d.]+)/)
    if (m && m[1]) translateY = parseFloat(m[1])
  }
  const rect = g.querySelector(':scope > rect') as SVGRectElement | null
  if (rect) return translateY + parseFloat(rect.getAttribute('y') || '0')
  const poly = g.querySelector(':scope > polygon') as SVGPolygonElement | null
  if (poly) {
    const pts = (poly.getAttribute('points') || '').trim().split(/\s+/)
    const ys = pts.map((p) => parseFloat(p.split(',')[1] || '0')).filter((n) => Number.isFinite(n))
    if (ys.length) return translateY + Math.min(...ys)
  }
  return translateY
}

function getEdgeEndPoint(p: SVGPathElement): { x: number; y: number } | null {
  try {
    const len = p.getTotalLength()
    const pt = p.getPointAtLength(len)
    return { x: pt.x, y: pt.y }
  } catch {
    return null
  }
}

export function useFlowBuildAnimation(
  flowWrapRef: RefObject<HTMLDivElement | null>,
  { active, replayKey, inClassName, livePulseClassName, nodeClassName }: Options
) {
  useEffect(() => {
    if (!active) return
    const wrap = flowWrapRef.current
    if (!wrap) return
    const svg = wrap.querySelector('svg') as SVGSVGElement | null
    if (!svg) return

    const reduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Collect nodes: groups containing a direct rect or polygon (skip the SVG <defs>).
    const allG = Array.from(svg.querySelectorAll('g')) as SVGGElement[]
    const nodes: SVGGElement[] = []
    for (const g of allG) {
      if (g.closest('defs')) continue
      if (g.querySelector(':scope > rect, :scope > polygon')) {
        nodes.push(g)
        g.classList.add(nodeClassName)
      }
    }

    // Edges: any <path> with markerEnd that's not inside <defs>.
    const edges = (Array.from(svg.querySelectorAll('path')) as SVGPathElement[]).filter(
      (p) => !p.closest('defs') && (p.hasAttribute('marker-end') || p.hasAttribute('markerEnd'))
    )

    // Compute Y-buckets for nodes (topological rows top→bottom).
    const annotated = nodes.map((g) => ({ g, y: getNodeY(g) }))
    annotated.sort((a, b) => a.y - b.y)
    const rows: SVGGElement[][] = []
    for (const { g, y } of annotated) {
      const last = rows[rows.length - 1]
      const lastHead = last && last[0]
      const lastY = lastHead ? getNodeY(lastHead) : -Infinity
      if (last && Math.abs(y - lastY) <= ROW_TOLERANCE) last.push(g)
      else rows.push([g])
    }

    // Map each edge to the row of nodes that it terminates near.
    const edgesByRow: SVGPathElement[][] = rows.map(() => [])
    const rowYs = rows.map((r) => (r[0] ? getNodeY(r[0]) : 0))
    for (const p of edges) {
      const end = getEdgeEndPoint(p)
      if (!end) continue
      let bestIdx = 0
      let bestDist = Infinity
      for (let i = 0; i < rowYs.length; i++) {
        const ry = rowYs[i] ?? 0
        const d = Math.abs(ry - end.y) + (ry > end.y ? 0 : 1000)
        if (d < bestDist) {
          bestDist = d
          bestIdx = i
        }
      }
      const bucket = edgesByRow[bestIdx]
      if (bucket) bucket.push(p)
    }

    // Cache text content per <text> for typewriter.
    type TextRec = { el: SVGTextElement; original: string; isComplex: boolean }
    const textRecs = new Map<SVGGElement, TextRec[]>()
    for (const g of nodes) {
      const texts = Array.from(g.querySelectorAll(':scope > text')) as SVGTextElement[]
      const recs: TextRec[] = texts.map((el) => {
        const hasTspan = el.querySelector('tspan') !== null
        return {
          el,
          original: hasTspan ? el.innerHTML : el.textContent || '',
          isComplex: hasTspan,
        }
      })
      textRecs.set(g, recs)
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
      // hide marker arrowhead via opacity proxy (re-shown via class)
      p.style.transition = ''
    }
    for (const g of nodes) {
      g.classList.remove(inClassName)
      g.classList.remove(livePulseClassName)
      const recs = textRecs.get(g) || []
      for (const r of recs) {
        if (!r.isComplex) r.el.textContent = ''
      }
    }

    if (reduced) {
      // Snap to final state.
      for (const p of edges) {
        p.style.strokeDashoffset = '0'
        p.style.opacity = '1'
      }
      for (const g of nodes) {
        g.classList.add(inClassName)
        const recs = textRecs.get(g) || []
        for (const r of recs) {
          if (!r.isComplex) r.el.textContent = r.original
        }
      }
      // Add pulse to first and last rows.
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

    const startTypewriter = (g: SVGGElement) => {
      const recs = textRecs.get(g) || []
      for (const r of recs) {
        if (r.isComplex) {
          // Restore full markup and fade in.
          r.el.innerHTML = r.original
          r.el.style.opacity = '0'
          r.el.style.transition = 'opacity 360ms cubic-bezier(0.16,1,0.3,1)'
          requestAnimationFrame(() => {
            r.el.style.opacity = '1'
          })
          continue
        }
        const text = r.original
        let i = 0
        const tick = () => {
          if (!r.el.isConnected) return
          if (i <= text.length) {
            r.el.textContent = text.slice(0, i)
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

    // Orchestrate row-by-row build.
    let cursor = 200
    for (let i = 0; i < rows.length; i++) {
      const rowNodes = rows[i] ?? []
      const rowEdges = edgesByRow[i] ?? []

      rowEdges.forEach((p, idx) => {
        at(cursor + idx * 30, () => drawEdge(p))
      })

      rowNodes.forEach((g, idx) => {
        at(cursor + NODE_DELAY_AFTER_EDGE_MS + idx * FAN_STAGGER_MS, () => {
          g.classList.add(inClassName)
          startTypewriter(g)
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

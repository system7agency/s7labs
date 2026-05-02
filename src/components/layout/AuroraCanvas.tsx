'use client'

import { useEffect, useRef } from 'react'

import { useReducedMotion } from '@/hooks/useReducedMotion'

type Blob = {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  phase: number
}

export function AuroraCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = window.innerWidth * dpr
      canvas!.height = window.innerHeight * dpr
      canvas!.style.width = `${window.innerWidth}px`
      canvas!.style.height = `${window.innerHeight}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const blobs: Blob[] = [
      {
        x: window.innerWidth * 0.2,
        y: window.innerHeight * 0.3,
        vx: 0.1,
        vy: 0.05,
        radius: 600,
        color: 'rgba(184, 255, 92, 0.12)',
        phase: 0,
      },
      {
        x: window.innerWidth * 0.7,
        y: window.innerHeight * 0.5,
        vx: -0.08,
        vy: 0.06,
        radius: 700,
        color: 'rgba(80, 140, 255, 0.10)',
        phase: Math.PI / 2,
      },
      {
        x: window.innerWidth * 0.5,
        y: window.innerHeight * 0.8,
        vx: 0.05,
        vy: -0.07,
        radius: 550,
        color: 'rgba(255, 100, 140, 0.08)',
        phase: Math.PI,
      },
      {
        x: window.innerWidth * 0.85,
        y: window.innerHeight * 0.15,
        vx: -0.04,
        vy: 0.08,
        radius: 500,
        color: 'rgba(184, 255, 92, 0.08)',
        phase: (3 * Math.PI) / 2,
      },
    ]

    let isVisible = !document.hidden
    function onVisibility() {
      isVisible = !document.hidden
    }
    document.addEventListener('visibilitychange', onVisibility)

    let frameId = 0

    function render(time: number) {
      if (!isVisible) {
        frameId = requestAnimationFrame(render)
        return
      }

      ctx!.clearRect(0, 0, window.innerWidth, window.innerHeight)

      for (const blob of blobs) {
        const drift = Math.sin(time * 0.0001 + blob.phase) * 50
        const x = blob.x + drift
        const y = blob.y + Math.cos(time * 0.0001 + blob.phase) * 30

        blob.x += blob.vx
        blob.y += blob.vy
        if (blob.x < -blob.radius || blob.x > window.innerWidth + blob.radius) {
          blob.vx *= -1
        }
        if (blob.y < -blob.radius || blob.y > window.innerHeight + blob.radius) {
          blob.vy *= -1
        }

        const gradient = ctx!.createRadialGradient(x, y, 0, x, y, blob.radius)
        gradient.addColorStop(0, blob.color)
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx!.fillStyle = gradient
        ctx!.fillRect(0, 0, window.innerWidth, window.innerHeight)
      }

      frameId = requestAnimationFrame(render)
    }

    frameId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [prefersReducedMotion])

  return <canvas ref={canvasRef} className="bg-aurora" aria-hidden="true" />
}

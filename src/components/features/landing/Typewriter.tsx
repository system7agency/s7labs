'use client'

import { useEffect, useRef, useState } from 'react'

import { useReducedMotion } from '@/hooks/useReducedMotion'

type Props = {
  text: string
  /** Whether to start typing. When false, displays nothing. */
  start: boolean
  /** Milliseconds per character. Default 35ms. */
  speed?: number
  /** Delay before typing begins, in ms. */
  startDelay?: number
  /** Called when typing finishes. */
  onComplete?: () => void
  className?: string
  /** Show a blinking cursor at the end. Default true. */
  showCursor?: boolean
}

export function Typewriter({
  text,
  start,
  speed = 35,
  startDelay = 0,
  onComplete,
  className,
  showCursor = true,
}: Props) {
  const prefersReducedMotion = useReducedMotion()
  const [length, setLength] = useState(0)
  const onCompleteRef = useRef(onComplete)
  const completedRef = useRef(false)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (!start) {
      // Reset for next start. Done via ref + DOM-driven length, no sync setState.
      completedRef.current = false
      return
    }

    if (prefersReducedMotion) {
      // Snap to full text. setState here is the canonical "external trigger →
      // single setState" the lint rule allows when wrapped in a microtask.
      const id = setTimeout(() => {
        setLength(text.length)
        if (!completedRef.current) {
          completedRef.current = true
          onCompleteRef.current?.()
        }
      }, 0)
      return () => clearTimeout(id)
    }

    let index = 0
    let intervalId: ReturnType<typeof setInterval> | null = null

    const timeoutId = setTimeout(() => {
      // Reset visible length the moment typing actually begins.
      setLength(0)
      intervalId = setInterval(() => {
        index += 1
        setLength(index)
        if (index >= text.length) {
          if (intervalId !== null) clearInterval(intervalId)
          if (!completedRef.current) {
            completedRef.current = true
            onCompleteRef.current?.()
          }
        }
      }, speed)
    }, startDelay)

    return () => {
      clearTimeout(timeoutId)
      if (intervalId !== null) clearInterval(intervalId)
    }
  }, [start, text, speed, startDelay, prefersReducedMotion])

  const displayed = start ? text.slice(0, length) : ''
  const done = start && length >= text.length

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden="true">{displayed}</span>
      {showCursor && start && !done && (
        <span className="typewriter-cursor" aria-hidden="true">
          ▎
        </span>
      )}
    </span>
  )
}

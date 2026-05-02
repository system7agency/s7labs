'use client'

import { useEffect, useRef, useState } from 'react'

type Options = {
  /** Trigger when this fraction of the element is visible. Default 0.3. */
  threshold?: number
  /** Once triggered, never reset. Default true. */
  once?: boolean
}

export function useInView<T extends HTMLElement = HTMLDivElement>(options: Options = {}) {
  const { threshold = 0.3, once = true } = options
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (entry.isIntersecting) {
          setInView(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, once])

  return { ref, inView }
}

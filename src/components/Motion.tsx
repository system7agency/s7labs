'use client'

/*
 * Shared motion kit for the lab pages (pattern established on /build).
 * LazyMotion + `m` keeps the bundle to the ~15kb dom-animation feature set,
 * and MotionConfig honours the user's reduced-motion preference for every
 * animation inside.
 */

import { LazyMotion, MotionConfig, domAnimation, m } from 'motion/react'
import type { Variants } from 'motion/react'
import type { ReactNode } from 'react'

export { m }
export { useInView, useReducedMotion } from 'motion/react'

export const EASE = [0.2, 0.7, 0.2, 1] as const

/** Standard entrance: fade + rise. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

/** Container that staggers its fadeUp children. */
export function staggerParent(step = 0.08, delayChildren = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: step, delayChildren } },
  }
}

/** Default in-view trigger: play once, when a quarter of the element shows. */
export const VIEWPORT = { once: true, amount: 0.25 } as const

export function MotionRoot({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}

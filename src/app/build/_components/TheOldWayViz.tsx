'use client'

/*
 * The old way — companion graphic. A large, quiet echo of the hero's orbit
 * ring, bleeding in from the right edge of the viewport (per the client's
 * direction: "that circle could be just coming in from the side"). Concentric
 * dotted rings with a very slow drift, one orbiting accent dot, and an accent
 * arc that draws in on scroll. Ambience, not a diagram.
 */

import { useRef } from 'react'

import { useInView } from './Motion'

const S = 760
const C = S / 2

/** Arc along the outer ring: ~80° starting at the upper left. */
function arcPath(r: number, startDeg: number, sweepDeg: number) {
  const a0 = (startDeg * Math.PI) / 180
  const a1 = ((startDeg + sweepDeg) * Math.PI) / 180
  const x0 = C + r * Math.cos(a0)
  const y0 = C + r * Math.sin(a0)
  const x1 = C + r * Math.cos(a1)
  const y1 = C + r * Math.sin(a1)
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${sweepDeg > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

export function TheOldWayViz() {
  const ref = useRef<HTMLDivElement | null>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <div ref={ref} className={inView ? 'ow-orbit on' : 'ow-orbit'} aria-hidden="true">
      <svg viewBox={`0 0 ${S} ${S}`} className="ow-orbit-svg">
        <defs>
          <radialGradient id="ow-orbit-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.14" />
            <stop offset="55%" stopColor="var(--accent)" stopOpacity="0.05" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* soft core glow */}
        <circle cx={C} cy={C} r={300} fill="url(#ow-orbit-glow)" />

        {/* drifting ring group */}
        <g className="ow-orbit-drift">
          {/* outer dotted ring (hero echo) */}
          <circle
            cx={C}
            cy={C}
            r={340}
            fill="none"
            stroke="rgba(255, 255, 255, 0.16)"
            strokeWidth="1.1"
            strokeDasharray="1 7"
            strokeLinecap="round"
          />
          {/* mid dotted ring, sparser, for depth */}
          <circle
            cx={C}
            cy={C}
            r={296}
            fill="none"
            stroke="rgba(255, 255, 255, 0.07)"
            strokeWidth="1"
            strokeDasharray="1 12"
            strokeLinecap="round"
          />
          {/* inner hairline ring */}
          <circle cx={C} cy={C} r={252} fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" />

          {/* accent arc — draws in on scroll */}
          <path
            className="ow-orbit-arc"
            d={arcPath(340, 150, 80)}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.4"
            strokeLinecap="round"
            pathLength={1}
          />
        </g>

        {/* orbiting dot on the outer ring */}
        <g className="ow-orbit-carrier">
          <circle className="ow-orbit-dot" cx={C} cy={C - 340} r={3.4} fill="var(--accent)" />
        </g>

        {/* still centre mark */}
        <circle cx={C} cy={C} r={2} fill="rgba(255, 255, 255, 0.22)" />
      </svg>
    </div>
  )
}

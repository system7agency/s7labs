'use client'

import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import type { LoaderStage } from './useMiniAppLoader'

/**
 * Canonical mini-app loading UI — a thin progress bar, a MONO header
 * (`label` + percentage), and a 2-col grid of stage cards with status icons
 * (blue spinner while active → green check when done) and an animated log line.
 *
 * Pair with {@link useMiniAppLoader}, spreading its return value here. Styling
 * lives in `src/styles/mini-app-ui.css` (`.progress-track` / `.stages` / …) so
 * every app shares one definition.
 */
export function LoadingStages({
  stages,
  label,
  progressPct,
  loadingPct,
  activeStage,
  doneStages,
  stageLogs,
  waiting = false,
}: {
  stages: LoaderStage[]
  /** Header text, e.g. `Optimizing <strong>your copy</strong>`. */
  label: ReactNode
  progressPct: number
  loadingPct: string
  activeStage: number
  doneStages: number[]
  stageLogs: string[]
  /** True once progress caps at 98% (still waiting on the response). */
  waiting?: boolean
}) {
  return (
    <>
      <div className="progress-track">
        <div className={clsx('progress-bar', { waiting })} style={{ width: `${progressPct}%` }} />
      </div>
      <div className="loading-header">
        <span>{label}</span>
        <span>{loadingPct}</span>
      </div>
      <div className="stages">
        {stages.map((s, i) => {
          const isActive = activeStage === i && !doneStages.includes(i)
          const isDone = doneStages.includes(i)
          return (
            <div key={s.num} className={clsx('stage', { active: isActive, done: isDone })}>
              <div className="stage-num-row">
                <span>{s.num}</span>
                <span className="stage-status-icon">
                  <svg viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6.5l2.5 2.5L10 3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
              <div className="stage-title">{s.title}</div>
              <div className="stage-log">{stageLogs[i]}</div>
            </div>
          )
        })}
      </div>
    </>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type LoaderStage = {
  num: string
  title: string
  logs: string[]
}

/**
 * Shared mini-app loading state machine.
 *
 * Drives the canonical loading UI (progress bar + 2-col stage cards with
 * animated logs) used by every live mini-app. Extracted here so the behaviour
 * is defined once (DRY) instead of being copy-pasted into ~16 pages.
 *
 * Pass a stable (module-level) `stages` array so the returned callbacks keep a
 * stable identity.
 *
 * Two bugs that lived in the copy-pasted versions are fixed here:
 *  1. Frozen latency — the old rAF loop stopped once progress hit the 98% cap
 *     (`if (pct < 98) requestAnimationFrame(...)`), which also froze the `LAT`
 *     readout. The rAF now keeps running (and `latency` keeps increasing) until
 *     `stop()`/`reset()`/`complete()` or unmount — so the timer reflects the
 *     real wait while the model is still responding past the animation window.
 *  2. The bar looked stuck/active at 98%. The machine now exposes `waiting`
 *     (true once progress caps at 98%) so the bar can dim/pulse to signal it is
 *     still working rather than finished.
 */
export function useMiniAppLoader(stages: LoaderStage[], stageMs = 5000) {
  const [activeStage, setActiveStage] = useState(-1)
  const [doneStages, setDoneStages] = useState<number[]>([])
  const [stageLogs, setStageLogs] = useState<string[]>(() => stages.map(() => ''))
  const [progressPct, setProgressPct] = useState(0)
  const [loadingPct, setLoadingPct] = useState('0%')
  const [latency, setLatency] = useState('—')
  const [waiting, setWaiting] = useState(false)

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const rafRef = useRef<number | null>(null)

  const stop = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current = []
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  useEffect(() => () => stop(), [stop])

  const start = useCallback(() => {
    stop()
    setActiveStage(0)
    setDoneStages([])
    setStageLogs(stages.map(() => ''))
    setProgressPct(0)
    setLoadingPct('0%')
    setLatency('0.0s')
    setWaiting(false)

    const startTime = performance.now()
    const totalMs = stageMs * stages.length

    const tick = (now: number) => {
      const elapsed = now - startTime
      const raw = (elapsed / totalMs) * 100
      const pct = Math.min(98, raw)
      setProgressPct(pct)
      setLoadingPct(Math.floor(pct) + '%')
      setLatency((elapsed / 1000).toFixed(1) + 's')
      if (raw >= 98) setWaiting(true)
      // Always keep ticking — the loop is torn down by stop()/reset()/complete()
      // or on unmount. This keeps the latency readout live past the 98% cap.
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    stages.forEach((stage, i) => {
      timersRef.current.push(
        setTimeout(() => {
          setActiveStage(i)
          setStageLogs((prev) => {
            const n = [...prev]
            n[i] = stage.logs[0] ?? ''
            return n
          })
          stage.logs.forEach((log, li) => {
            if (li === 0) return
            timersRef.current.push(
              setTimeout(
                () => {
                  setStageLogs((prev) => {
                    const n = [...prev]
                    n[i] = log
                    return n
                  })
                },
                (li * stageMs) / stage.logs.length
              )
            )
          })
        }, i * stageMs)
      )
      timersRef.current.push(
        setTimeout(
          () => {
            setDoneStages((prev) => [...prev, i])
            setStageLogs((prev) => {
              const n = [...prev]
              n[i] = stage.logs[stage.logs.length - 1] ?? ''
              return n
            })
          },
          (i + 1) * stageMs
        )
      )
    })
  }, [stop, stages, stageMs])

  /**
   * Snap to 100%, mark every stage done, and stop — call when the real result
   * arrives. Apps that pause briefly before switching to the result view get a
   * clean "all stages green" beat; apps that switch immediately never see it.
   */
  const complete = useCallback(() => {
    stop()
    setActiveStage(-1)
    setDoneStages(stages.map((_, i) => i))
    setStageLogs(stages.map((s) => s.logs[s.logs.length - 1] ?? ''))
    setProgressPct(100)
    setLoadingPct('100%')
    setWaiting(false)
  }, [stop, stages])

  /** Clear everything back to idle — call on reset / error revert. */
  const reset = useCallback(() => {
    stop()
    setActiveStage(-1)
    setDoneStages([])
    setStageLogs(stages.map(() => ''))
    setProgressPct(0)
    setLoadingPct('0%')
    setLatency('—')
    setWaiting(false)
  }, [stop, stages])

  return {
    activeStage,
    doneStages,
    stageLogs,
    progressPct,
    loadingPct,
    latency,
    waiting,
    start,
    stop,
    complete,
    reset,
  }
}

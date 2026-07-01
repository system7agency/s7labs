'use client'

import { useEffect, useState } from 'react'
import { SubmitOnce } from '@/components/mini-apps/SubmitOnce'
import type { ScanFree, ScanGated } from '@/lib/mini-apps/agentic-types'
import { parseUnlockApiResponse } from '@/lib/mini-apps/agentic-types'
import { AgenticGatedDetail } from './components/AgenticGatedDetail'

type Props = {
  scanId: string
  email: string
  free: ScanFree
  leadInput: { url: string; site_name: string }
  submitToApi: (input: object, output?: object) => Promise<void>
  onTokens: (tokens: { in: number; out: number }) => void
  onGatedLoaded: (gated: ScanGated) => void
}

export function GatedBreakdown({
  scanId,
  email,
  free,
  leadInput,
  submitToApi,
  onTokens,
  onGatedLoaded,
}: Props) {
  const [gated, setGated] = useState<ScanGated | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/mini-apps/agentic-readiness/unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scanId, email }),
        })
        const parsed = parseUnlockApiResponse(await res.json())
        if (cancelled) return
        if (parsed.ok) {
          setGated(parsed.data)
          onTokens({ in: parsed.data.tokens_in, out: parsed.data.tokens_out })
          onGatedLoaded(parsed.data)
        } else {
          setLoadError(parsed.message)
        }
      } catch {
        if (!cancelled) setLoadError('Network error. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [scanId, email, onTokens, onGatedLoaded])

  if (loading) {
    return <p className="gated-loading">Loading full checklist…</p>
  }
  if (loadError) {
    return <div className="field-error">{loadError}</div>
  }
  if (!gated) return null

  return (
    <>
      <SubmitOnce submit={submitToApi} input={leadInput} output={{ free, gated }} />
      <AgenticGatedDetail gated={gated} />
    </>
  )
}

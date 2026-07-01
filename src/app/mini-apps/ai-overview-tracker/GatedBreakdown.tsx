'use client'

import { useEffect, useState } from 'react'
import { SubmitOnce } from '@/components/mini-apps/SubmitOnce'
import type { ScanFree, ScanGated } from '@/lib/mini-apps/aio-types'
import { parseUnlockApiResponse } from '@/lib/mini-apps/aio-types'
import { AioGatedDetail } from './components/AioGatedDetail'

type Props = {
  scanId: string
  free: ScanFree
  leadInput: { domain: string; keywords: string[]; location: string }
  submitToApi: (input: object, output?: object) => Promise<void>
  onTokens: (tokens: { in: number; out: number }) => void
  onGatedLoaded: (gated: ScanGated) => void
}

export function GatedBreakdown({
  scanId,
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
        const res = await fetch('/api/mini-apps/ai-overview-tracker/unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scanId }),
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
  }, [scanId, onTokens, onGatedLoaded])

  if (loading) {
    return <p className="gated-loading">Loading full breakdown…</p>
  }
  if (loadError) {
    return <div className="field-error">{loadError}</div>
  }
  if (!gated) return null

  return (
    <>
      <SubmitOnce submit={submitToApi} input={leadInput} output={{ free, gated }} />
      <AioGatedDetail free={free} gated={gated} />
    </>
  )
}

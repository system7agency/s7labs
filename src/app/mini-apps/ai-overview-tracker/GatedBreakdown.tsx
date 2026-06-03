'use client'

import { useEffect, useState } from 'react'
import { SubmitOnce } from '@/components/mini-apps/SubmitOnce'
import type { KeywordStatus, ScanFree, ScanGated } from '@/lib/mini-apps/aio-types'
import { parseUnlockApiResponse } from '@/lib/mini-apps/aio-types'

function statusLabel(status: KeywordStatus): string {
  if (status === 'blind_spot') return 'Blind spot'
  if (status === 'no_aio') return 'No AI Overview'
  if (status === 'error') return 'Error'
  if (status === 'ghost') return 'Ghost'
  return 'Cited'
}

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
      <div className="section-header">
        <span>{'// per-keyword breakdown'}</span>
      </div>
      <div className="keyword-cards">
        {gated.keywords.map((k) => (
          <article key={k.keyword} className={`keyword-card is-${k.status}`}>
            <div className="keyword-card-head">
              <h4>{k.keyword}</h4>
              <span className={`status-pill is-${k.status}`}>{statusLabel(k.status)}</span>
            </div>
            {k.status === 'ghost' && (
              <p className="ghost-note">
                You rank organically for this keyword, but the AI answer does not cite you.
              </p>
            )}
            <div className="sources-list">
              {k.sources.length > 0 ? (
                k.sources.map((s) => (
                  <div
                    key={`${k.keyword}-${s.url}`}
                    className={`source-row${s.domain === free.domain ? 'is-you' : ''}`}
                  >
                    <span className="source-domain">{s.domain}</span>
                    <span className="source-title">{s.title}</span>
                  </div>
                ))
              ) : (
                <div className="source-row is-missing">No citation sources captured.</div>
              )}
            </div>
          </article>
        ))}
      </div>
      <div className="section-header">
        <span>{'// who keeps getting cited'}</span>
      </div>
      <div className="leaders-list">
        {gated.citation_leaders.map((l, i) => (
          <div key={l.domain} className="leader-row">
            <span className="leader-rank">{String(i + 1).padStart(2, '0')}</span>
            <span className="leader-domain">{l.domain}</span>
            <span className="leader-app">{l.appearances}</span>
          </div>
        ))}
      </div>
      <div className="reco-block">
        <div className="plan-eyebrow">{'// how to start getting cited'}</div>
        <ol className="plan-list">
          {gated.recommendations.map((r, i) => (
            <li key={r} className="plan-row">
              <span className="reco-number">{String(i + 1).padStart(2, '0')}</span>
              <div className="plan-body">{r}</div>
            </li>
          ))}
        </ol>
      </div>
    </>
  )
}

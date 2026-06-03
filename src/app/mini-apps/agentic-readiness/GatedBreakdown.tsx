'use client'

import { useEffect, useState } from 'react'
import { SubmitOnce } from '@/components/mini-apps/SubmitOnce'
import type { Grade, ReadinessCheck, ScanFree, ScanGated } from '@/lib/mini-apps/agentic-types'
import { parseUnlockApiResponse } from '@/lib/mini-apps/agentic-types'

function gradeClass(g: Grade): string {
  if (g === 'A' || g === 'B') return 'grade-good'
  if (g === 'C') return 'grade-mid'
  return 'grade-bad'
}

function scoreBadgeClass(score: number): string {
  if (score >= 7) return 'score-good'
  if (score >= 4) return 'score-mid'
  return 'score-bad'
}

function CheckCard({ check }: { check: ReadinessCheck }) {
  return (
    <div className={`check-card status-${check.status}`}>
      <div className="check-card-header">
        <span className="check-card-name">{check.name}</span>
        <span className={`score-badge ${scoreBadgeClass(check.score)}`}>{check.score}/10</span>
        <span className={`grade-pill ${gradeClass(check.grade)}`}>{check.grade}</span>
        <span className={`priority-tag is-${check.priority}`}>{check.priority}</span>
      </div>
      <p className="check-finding">{check.finding}</p>
      <div className="issue-fix">
        <span className="fix-label">Fix</span>
        <span className="fix-text">{check.fix}</span>
      </div>
    </div>
  )
}

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
      {gated.quick_wins.length > 0 && (
        <div className="quick-wins-row">
          <span className="quick-wins-label">Fixable today</span>
          {gated.quick_wins.map((w) => (
            <span key={w} className="quick-win-pill">
              {w}
            </span>
          ))}
        </div>
      )}

      <div className="section-header">
        <span>{'// full checklist'}</span>
        <span>6 checks</span>
      </div>
      <div className="check-grid">
        {gated.checks.map((check) => (
          <CheckCard key={check.name} check={check} />
        ))}
      </div>

      <div className="plan-block">
        <div className="plan-eyebrow">{'// fix in this order'}</div>
        <ol className="plan-list">
          {gated.prioritised_plan.map((item) => (
            <li key={item.rank} className="plan-row">
              <span className="plan-number">{String(item.rank).padStart(2, '0')}</span>
              <div className="plan-body">
                <div className="plan-action">{item.action}</div>
                <div className="plan-meta">
                  <span>{item.impact}</span>
                  <span className={`effort-tag is-${item.effort}`}>{item.effort} effort</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </>
  )
}

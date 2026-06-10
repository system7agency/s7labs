'use client'

import type { KeywordStatus, ScanFree, ScanGated } from '@/lib/mini-apps/aio-types'
import '../page-styles.css'

export type AiOverviewTrackerInput = {
  domain?: string
  keywords?: string[]
  location?: string
  market?: string
}

/**
 * Output stored on the submission record. We persist the `free` shape from
 * the scan API (plus the `scanId` so the gated breakdown can be re-fetched
 * later). If the user unlocked the gated breakdown it's stored as `gated`.
 *
 * Note: no historical completed submissions exist for this slug yet
 * (DataForSEO isn't provisioned), so this shape is built from the route's
 * type definitions in `src/lib/mini-apps/aio-types.ts`.
 */
export type AiOverviewTrackerOutput = {
  free?: ScanFree
  scanId?: string
  gated?: ScanGated
}

type Props = {
  input: AiOverviewTrackerInput
  output: AiOverviewTrackerOutput
  /**
   * When true, render only the inner shareable block (one-liner + score row
   * + keyword strip + hook line) without the surrounding
   * `.ai-overview-tracker / .panel-wrap / .panel / .panel-body /
   * .aio-state` wrappers or any footer. The inline mini-app page provides
   * those itself and keeps the interactive `<GatedBreakdown />` + export
   * buttons at page level. The standalone `/results/[id]` route uses the
   * default (full) render.
   */
  bare?: boolean
}

export function statusLabel(status: KeywordStatus): string {
  if (status === 'blind_spot') return 'Blind spot'
  if (status === 'no_aio') return 'No AI Overview'
  if (status === 'error') return 'Error'
  if (status === 'ghost') return 'Ghost'
  return 'Cited'
}

export function buildAiOverviewTrackerPlainText(free: ScanFree, gated: ScanGated | null): string {
  const lines = [
    `AI Overview Tracker — ${free.domain}`,
    `Location: ${free.location}`,
    '='.repeat(60),
    '',
    free.one_liner,
    '',
    `Citation rate: ${free.citation_rate}%`,
    `AIO trigger rate: ${free.aio_trigger_rate}%`,
    `Blind spots: ${free.blind_spot_count}`,
    `Ghost keywords: ${free.ghost_count}`,
    '',
    '// KEYWORDS',
    ...free.keyword_statuses.map((k) => `  ${k.keyword}: ${statusLabel(k.status)}`),
  ]
  if (gated) {
    lines.push('', '// CITATION LEADERS')
    gated.citation_leaders.forEach((l) => lines.push(`  ${l.domain}: ${l.appearances}`))
    lines.push('', '// RECOMMENDATIONS')
    gated.recommendations.forEach((r, i) => lines.push(`  ${i + 1}. ${r}`))
    lines.push('', `Tokens: ${(gated.tokens_in + gated.tokens_out).toLocaleString()}`)
  }
  return lines.join('\n')
}

function ShareableBlock({ free }: { free: ScanFree }) {
  return (
    <div className="shareable-block">
      <div className="one-liner-block">
        <p className="one-liner-text">&ldquo;{free.one_liner}&rdquo;</p>
        <div className="one-liner-meta">
          <span className="project-name">{free.domain}</span>
          <span className="type-pill">{free.verdict_label}</span>
        </div>
      </div>
      <div className="score-row">
        <div className="score-card">
          <div className="sc-label">Citation rate</div>
          <div className="sc-value">
            <span className="sc-big">{free.citation_rate}%</span>
          </div>
          <div className="sc-delta">
            {free.aio_trigger_rate}% of your keywords trigger an AI Overview
          </div>
        </div>
        <div className="score-card">
          <div className="sc-label">Gap snapshot</div>
          <div className="stat-grid">
            <div>
              <span>Keywords</span>
              <strong>{free.keywords_scored}</strong>
            </div>
            <div>
              <span>AI Overviews</span>
              <strong>{Math.round((free.keywords_scored * free.aio_trigger_rate) / 100)}</strong>
            </div>
            <div>
              <span>Blind spots</span>
              <strong>{free.blind_spot_count}</strong>
            </div>
            <div>
              <span>Ghosts</span>
              <strong>{free.ghost_count}</strong>
            </div>
          </div>
        </div>
      </div>
      <div className="keyword-strip">
        {(free.keyword_statuses ?? []).map((k) => (
          <div key={k.keyword} className="keyword-row">
            <span className="keyword-label">{k.keyword}</span>
            <span className={`status-pill is-${k.status}`}>{statusLabel(k.status)}</span>
          </div>
        ))}
      </div>
      {free.top_cited_competitor && (
        <div className="hook-line">
          {free.top_cited_competitor.domain} is cited in {free.top_cited_competitor.appearances} of
          your keywords.
        </div>
      )}
    </div>
  )
}

function GatedBlock({ gated }: { gated: ScanGated }) {
  return (
    <>
      {gated.citation_leaders.length > 0 && (
        <>
          <div className="section-header">
            <span>{'// Citation leaders'}</span>
          </div>
          <div className="leader-list">
            {gated.citation_leaders.map((l) => (
              <div key={l.domain} className="leader-row">
                <span className="leader-domain">{l.domain}</span>
                <span className="leader-count">{l.appearances}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {gated.recommendations.length > 0 && (
        <>
          <div className="section-header">
            <span>{'// Recommendations'}</span>
          </div>
          <ol className="recommendations">
            {gated.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ol>
        </>
      )}
    </>
  )
}

export function AiOverviewTrackerResult({ input, output, bare = false }: Props) {
  void input
  const free = output.free
  const gated = output.gated
  if (!free) {
    return null
  }
  const body = (
    <>
      <ShareableBlock free={free} />
      {gated && <GatedBlock gated={gated} />}
    </>
  )
  if (bare) {
    return body
  }
  return (
    <div className="ai-overview-tracker">
      <div className="panel-wrap panel-wrap-wide">
        <div className="panel">
          <div className="panel-body">
            <section className="aio-state active">{body}</section>
          </div>
        </div>
      </div>
    </div>
  )
}

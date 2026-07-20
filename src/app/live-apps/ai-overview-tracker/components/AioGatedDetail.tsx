import type { KeywordStatus, ScanFree, ScanGated } from '@/lib/mini-apps/aio-types'

/**
 * Presentational gated detail (per-keyword breakdown + citation leaders +
 * recommendations).
 *
 * Extracted from GatedBreakdown so it can be rendered in two places from the
 * same markup: the live unlock flow on the mini-app page, and on restore when
 * the page is opened with `?result=<id>` and re-renders the saved output. No
 * data fetching here.
 */

function statusLabel(status: KeywordStatus): string {
  if (status === 'blind_spot') return 'Blind spot'
  if (status === 'no_aio') return 'No AI Overview'
  if (status === 'error') return 'Error'
  if (status === 'ghost') return 'Ghost'
  return 'Cited'
}

export function AioGatedDetail({ free, gated }: { free: ScanFree; gated: ScanGated }) {
  return (
    <>
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

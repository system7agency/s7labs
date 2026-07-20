import type { Grade, ReadinessCheck, ScanGated } from '@/lib/mini-apps/agentic-types'

/**
 * Presentational gated detail (quick wins + full checklist + prioritised plan).
 *
 * Extracted from GatedBreakdown so it can be rendered in two places from the
 * same markup: the live unlock flow on the mini-app page, and the standalone
 * `/results/<id>` page that re-renders the saved output. No data fetching here.
 */

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

export function AgenticGatedDetail({ gated }: { gated: ScanGated }) {
  return (
    <>
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

import { clsx } from 'clsx'

import { formatCurrency, formatRelativeTime } from '@/lib/insights/format'
import { getSubmissionsList } from '@/lib/insights/queries'

export const dynamic = 'force-dynamic'

export default async function SubmissionsPage() {
  let rows: Awaited<ReturnType<typeof getSubmissionsList>> = []
  let error = false
  try {
    rows = await getSubmissionsList(50)
  } catch (err) {
    console.error('[insights/submissions]', err)
    error = true
  }

  return (
    <>
      <header className="ins-page-head">
        <div className="ins-page-titleblock">
          <h1 className="ins-page-title">Submissions</h1>
          <p className="ins-page-subtitle">
            Every mini-app run, newest first. Showing up to {rows.length || 50}.
          </p>
        </div>
      </header>

      <article className="ins-card">
        {error ? (
          <div className="ins-placeholder-body">Data unavailable.</div>
        ) : rows.length === 0 ? (
          <div className="ins-placeholder-body">No submissions yet.</div>
        ) : (
          <div className="ins-activity" role="list">
            <div className="ins-activity-head" aria-hidden>
              <span>Time</span>
              <span>Mini-app</span>
              <span>Email</span>
              <span className="ins-activity-cost-col">Cost</span>
              <span className="ins-activity-status-col">Status</span>
            </div>
            {rows.map((r) => (
              <div className="ins-activity-row" role="listitem" key={r.id}>
                <span className="ins-activity-time" title={new Date(r.createdAt).toISOString()}>
                  {formatRelativeTime(r.createdAt)}
                </span>
                <span className="ins-activity-app">{r.miniAppName}</span>
                <span className="ins-activity-email">{r.emailRedacted}</span>
                <span className="ins-activity-cost">
                  {r.costUsd == null ? '—' : formatCurrency(r.costUsd)}
                </span>
                <span className={clsx('ins-activity-status', `is-${r.status}`)}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </article>
    </>
  )
}

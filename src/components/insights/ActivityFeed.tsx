import { clsx } from 'clsx'

import type { ActivityRow } from '@/lib/insights/queries'
import { formatCurrency, formatRelativeTime } from '@/lib/insights/format'

type Props = {
  title: string
  rows: ActivityRow[]
  error?: boolean
}

export function ActivityFeed({ title, rows, error }: Props) {
  if (error) {
    return (
      <article className="ins-card">
        <h2 className="ins-card-title">{title}</h2>
        <div className="ins-placeholder-body">Data unavailable.</div>
      </article>
    )
  }

  if (rows.length === 0) {
    return (
      <article className="ins-card">
        <h2 className="ins-card-title">{title}</h2>
        <div className="ins-placeholder-body">No submissions in this range.</div>
      </article>
    )
  }

  return (
    <article className="ins-card">
      <h2 className="ins-card-title">{title}</h2>
      <div className="ins-activity" role="list">
        {/* Desktop header */}
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
            <span className="ins-activity-app" title={r.miniAppName}>
              {r.miniAppName}
            </span>
            <span className="ins-activity-email" title={r.email}>
              {r.email}
            </span>
            <span className="ins-activity-cost">
              {r.costUsd == null ? '—' : formatCurrency(r.costUsd)}
            </span>
            <span className={clsx('ins-activity-status', `is-${r.status}`)}>{r.status}</span>
          </div>
        ))}
      </div>
    </article>
  )
}

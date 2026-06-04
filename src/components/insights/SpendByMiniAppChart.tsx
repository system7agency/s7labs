import { formatCurrency } from '@/lib/insights/format'

type Row = {
  miniAppSlug: string
  miniAppName: string
  costUsd: number
  submissionCount: number
}

type Props = {
  title: string
  data: Row[]
  error?: boolean
}

const TOP_N = 8

export function SpendByMiniAppChart({ title, data, error }: Props) {
  const hasData = !error && data.length > 0 && data.some((d) => d.costUsd > 0)

  // Top N + bucket the rest into "Other"
  const visible: Row[] = (() => {
    if (data.length <= TOP_N) return data
    const top = data.slice(0, TOP_N)
    const rest = data.slice(TOP_N)
    const other: Row = {
      miniAppSlug: '__other__',
      miniAppName: `Other (${rest.length})`,
      costUsd: rest.reduce((acc, r) => acc + r.costUsd, 0),
      submissionCount: rest.reduce((acc, r) => acc + r.submissionCount, 0),
    }
    return [...top, other]
  })()

  const max = Math.max(0.0001, ...visible.map((r) => r.costUsd))

  return (
    <article className="ins-card">
      <h2 className="ins-card-title">{title}</h2>
      {error ? (
        <div className="ins-placeholder-body">Data unavailable.</div>
      ) : !hasData ? (
        <div className="ins-placeholder-body">No spend yet.</div>
      ) : (
        <div className="ins-bars">
          {visible.map((row) => {
            const widthPct = Math.max(2, (row.costUsd / max) * 100)
            return (
              <div className="ins-bar-row" key={row.miniAppSlug}>
                <div className="ins-bar-meta">
                  <span className="ins-bar-name" title={row.miniAppName}>
                    {row.miniAppName}
                  </span>
                  <span className="ins-bar-cost">{formatCurrency(row.costUsd)}</span>
                </div>
                <div className="ins-bar-track" aria-hidden>
                  <div className="ins-bar-fill" style={{ width: `${widthPct}%` }} />
                </div>
                <div className="ins-bar-sub">
                  {row.submissionCount} submission{row.submissionCount === 1 ? '' : 's'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </article>
  )
}

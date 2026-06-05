import { formatCurrency, formatInteger, formatRelativeTime } from '@/lib/insights/format'
import { getLeadsList } from '@/lib/insights/queries'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  let rows: Awaited<ReturnType<typeof getLeadsList>> = []
  let error = false
  try {
    rows = await getLeadsList(50)
  } catch (err) {
    console.error('[insights/leads]', err)
    error = true
  }

  return (
    <>
      <header className="ins-page-head">
        <div className="ins-page-titleblock">
          <h1 className="ins-page-title">Leads</h1>
          <p className="ins-page-subtitle">
            Unique people who&apos;ve submitted, ranked by most recent. Showing up to{' '}
            {rows.length || 50}.
          </p>
        </div>
      </header>

      <article className="ins-card">
        {error ? (
          <div className="ins-placeholder-body">Data unavailable.</div>
        ) : rows.length === 0 ? (
          <div className="ins-placeholder-body">No leads yet.</div>
        ) : (
          <div className="ins-leads" role="list">
            <div className="ins-leads-head" aria-hidden>
              <span>Email</span>
              <span>First source</span>
              <span className="ins-leads-num-col">Submissions</span>
              <span className="ins-leads-num-col">Total spend</span>
              <span>Last seen</span>
            </div>
            {rows.map((l) => (
              <div className="ins-leads-row" role="listitem" key={l.id}>
                <span className="ins-leads-email">{l.emailRedacted}</span>
                <span className="ins-leads-source">{l.firstSource ?? '—'}</span>
                <span className="ins-leads-num">{formatInteger(l.submissionCount)}</span>
                <span className="ins-leads-num">
                  {l.totalCostUsd === 0 ? '—' : formatCurrency(l.totalCostUsd)}
                </span>
                <span className="ins-leads-time" title={new Date(l.lastSeenAt).toISOString()}>
                  {formatRelativeTime(l.lastSeenAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </article>
    </>
  )
}

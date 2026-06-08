import { InsightsSearch } from '@/components/insights/InsightsSearch'
import { Pagination } from '@/components/insights/Pagination'
import { SortableHeader } from '@/components/insights/SortableHeader'
import { formatCurrency, formatInteger, formatRelativeTime } from '@/lib/insights/format'
import { getLeadsList, type LeadsSortBy } from '@/lib/insights/queries'

export const dynamic = 'force-dynamic'

const VALID_SORT: ReadonlyArray<LeadsSortBy> = [
  'email',
  'firstSource',
  'submissionCount',
  'totalCost',
  'firstSeenAt',
  'lastSeenAt',
]

function parseSortBy(v: string | undefined): LeadsSortBy {
  return VALID_SORT.includes((v ?? '') as LeadsSortBy) ? (v as LeadsSortBy) : 'lastSeenAt'
}
function parseSortDir(v: string | undefined): 'asc' | 'desc' {
  return v === 'asc' ? 'asc' : 'desc'
}
function parsePage(v: string | undefined): number {
  const n = Number.parseInt(v ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}
function parsePageSize(v: string | undefined): number {
  const n = Number.parseInt(v ?? '', 10)
  if (![10, 25, 50, 100].includes(n)) return 25
  return n
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    pageSize?: string
    search?: string
    sortBy?: string
    sortDir?: string
  }>
}) {
  const sp = await searchParams
  const page = parsePage(sp.page)
  const pageSize = parsePageSize(sp.pageSize)
  const search = (sp.search ?? '').trim()
  const sortBy = parseSortBy(sp.sortBy)
  const sortDir = parseSortDir(sp.sortDir)

  let result: Awaited<ReturnType<typeof getLeadsList>> = {
    rows: [],
    total: 0,
    page,
    pageSize,
    totalPages: 1,
  }
  let error = false
  try {
    result = await getLeadsList({ page, pageSize, search, sortBy, sortDir })
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
            Unique people who&apos;ve submitted.{' '}
            {error
              ? ''
              : `${result.total.toLocaleString()} total${search ? ` matching "${search}"` : ''}.`}
          </p>
        </div>
        <InsightsSearch placeholder="Search email…" />
      </header>

      <article className="ins-card">
        {error ? (
          <div className="ins-placeholder-body">Data unavailable.</div>
        ) : result.rows.length === 0 ? (
          <div className="ins-placeholder-body">
            {search ? `No leads match "${search}".` : 'No leads yet.'}
          </div>
        ) : (
          <>
            <div className="ins-leads" role="list">
              <div className="ins-leads-head" aria-hidden>
                <SortableHeader
                  column="email"
                  label="Email"
                  activeColumn={sortBy}
                  activeDir={sortDir}
                  defaultDir="asc"
                />
                <SortableHeader
                  column="firstSource"
                  label="First source"
                  activeColumn={sortBy}
                  activeDir={sortDir}
                  defaultDir="asc"
                />
                <SortableHeader
                  column="submissionCount"
                  label="Submissions"
                  activeColumn={sortBy}
                  activeDir={sortDir}
                  className="ins-leads-num-col"
                  align="right"
                />
                <SortableHeader
                  column="totalCost"
                  label="Total spend"
                  activeColumn={sortBy}
                  activeDir={sortDir}
                  className="ins-leads-num-col"
                  align="right"
                />
                <SortableHeader
                  column="lastSeenAt"
                  label="Last seen"
                  activeColumn={sortBy}
                  activeDir={sortDir}
                />
              </div>
              {result.rows.map((l) => (
                <div className="ins-leads-row" role="listitem" key={l.id}>
                  <span className="ins-leads-email">{l.email}</span>
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
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              pageSize={result.pageSize}
              total={result.total}
            />
          </>
        )}
      </article>
    </>
  )
}

import { clsx } from 'clsx'

import { InsightsSearch } from '@/components/insights/InsightsSearch'
import { Pagination } from '@/components/insights/Pagination'
import { SortableHeader } from '@/components/insights/SortableHeader'
import { formatCurrency, formatModel, formatRelativeTime } from '@/lib/insights/format'
import { getSubmissionsList, type SubmissionsSortBy } from '@/lib/insights/queries'

export const dynamic = 'force-dynamic'

const VALID_SORT: ReadonlyArray<SubmissionsSortBy> = [
  'createdAt',
  'cost',
  'miniApp',
  'email',
  'status',
]

function parseSortBy(v: string | undefined): SubmissionsSortBy {
  return VALID_SORT.includes((v ?? '') as SubmissionsSortBy)
    ? (v as SubmissionsSortBy)
    : 'createdAt'
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

export default async function SubmissionsPage({
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

  let result: Awaited<ReturnType<typeof getSubmissionsList>> = {
    rows: [],
    total: 0,
    page,
    pageSize,
    totalPages: 1,
  }
  let error = false
  try {
    result = await getSubmissionsList({ page, pageSize, search, sortBy, sortDir })
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
            Every mini-app run.{' '}
            {error
              ? ''
              : `${result.total.toLocaleString()} total${search ? ` matching "${search}"` : ''}.`}
          </p>
        </div>
        <InsightsSearch placeholder="Search email or mini-app…" />
      </header>

      <article className="ins-card">
        {error ? (
          <div className="ins-placeholder-body">Data unavailable.</div>
        ) : result.rows.length === 0 ? (
          <div className="ins-placeholder-body">
            {search ? `No submissions match "${search}".` : 'No submissions yet.'}
          </div>
        ) : (
          <>
            <div className="ins-submissions" role="list">
              <div className="ins-submissions-head" aria-hidden>
                <SortableHeader
                  column="createdAt"
                  label="Time"
                  activeColumn={sortBy}
                  activeDir={sortDir}
                />
                <SortableHeader
                  column="miniApp"
                  label="Mini-app"
                  activeColumn={sortBy}
                  activeDir={sortDir}
                  defaultDir="asc"
                />
                <SortableHeader
                  column="email"
                  label="Email"
                  activeColumn={sortBy}
                  activeDir={sortDir}
                  defaultDir="asc"
                />
                <span>Model</span>
                <SortableHeader
                  column="cost"
                  label="Cost"
                  activeColumn={sortBy}
                  activeDir={sortDir}
                  className="ins-submissions-num-col"
                  align="right"
                />
                <SortableHeader
                  column="status"
                  label="Status"
                  activeColumn={sortBy}
                  activeDir={sortDir}
                  defaultDir="asc"
                  className="ins-submissions-status-col"
                  align="center"
                />
              </div>
              {result.rows.map((r) => (
                <div className="ins-submissions-row" role="listitem" key={r.id}>
                  <span
                    className="ins-submissions-time"
                    title={new Date(r.createdAt).toISOString()}
                  >
                    {formatRelativeTime(r.createdAt)}
                  </span>
                  <span className="ins-submissions-app">{r.miniAppName}</span>
                  <span className="ins-submissions-email">{r.email}</span>
                  <span className="ins-submissions-model" title={r.modelUsed ?? ''}>
                    {formatModel(r.modelUsed)}
                  </span>
                  <span className="ins-submissions-cost">
                    {r.costUsd == null ? '—' : formatCurrency(r.costUsd)}
                  </span>
                  <span className={clsx('ins-activity-status', `is-${r.status}`)}>{r.status}</span>
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

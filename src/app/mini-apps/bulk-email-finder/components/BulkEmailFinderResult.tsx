'use client'

import type { ReactNode } from 'react'

import '../page-styles.css'

export type BulkEmailFinderInput = {
  rows_count?: number
  job_id?: string | null
  jobId?: string
}

export type BulkEmailFinderJobResultRow = {
  row: number
  firstName: string
  lastName: string
  company: string
  email: string | null
  status: 'found' | 'not_found' | 'error'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | null
  title: string | null
  companyDomain: string
  error?: string
}

export type BulkEmailFinderOutput = {
  total?: number
  found?: number
  not_found?: number
  results?: BulkEmailFinderJobResultRow[]
  // tolerate legacy "rows" shape that the placeholder used to render
  rows?: Array<{
    name?: string
    firstName?: string
    lastName?: string
    company?: string
    email?: string | null
    confidence?: string | null
    status?: string
  }>
  stage?: string
  job_id?: string
  jobId?: string
}

type Props = {
  input: BulkEmailFinderInput
  output: BulkEmailFinderOutput
  /**
   * When true, render only the inner result body (heading + table) without
   * the surrounding `.bulk-email-finder / .bef-panel` wrappers or the
   * footer actions. The inline mini-app page provides those itself and
   * keeps its own "New run" / "Download CSV" buttons at page level, so it
   * consumes the component in bare mode. The standalone `/results/[id]`
   * route uses the default (full) render.
   */
  bare?: boolean
  /**
   * Optional override for the results rows (inline page passes its
   * locally-collected `JobResult[]`).
   */
  rows?: BulkEmailFinderJobResultRow[]
  /**
   * Optional override for the found/total summary numbers. Inline page
   * derives these from its own state.
   */
  total?: number
  found?: number
  /**
   * Optional render slot for the footer actions row (inline page renders
   * "New run" + "Download CSV").
   */
  renderFooter?: () => ReactNode
}

function normalizeRows(
  output: BulkEmailFinderOutput,
  override?: BulkEmailFinderJobResultRow[]
): BulkEmailFinderJobResultRow[] {
  if (override) return override
  if (output.results && output.results.length > 0) return output.results
  if (output.rows && output.rows.length > 0) {
    return output.rows.map((r, idx) => {
      const fullName = r.name ?? `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim()
      const [firstName, ...rest] = fullName.split(/\s+/)
      const lastName = rest.join(' ')
      const status: BulkEmailFinderJobResultRow['status'] =
        r.status === 'found' || r.status === 'not_found' || r.status === 'error'
          ? r.status
          : r.email
            ? 'found'
            : 'not_found'
      const confidence =
        r.confidence === 'HIGH' || r.confidence === 'MEDIUM' || r.confidence === 'LOW'
          ? r.confidence
          : null
      return {
        row: idx + 1,
        firstName: firstName ?? '',
        lastName,
        company: r.company ?? '',
        email: r.email ?? null,
        status,
        confidence,
        title: null,
        companyDomain: '',
      }
    })
  }
  return []
}

function ResultBody({
  output,
  rows,
  total,
  found,
  renderFooter,
}: {
  output: BulkEmailFinderOutput
  rows?: BulkEmailFinderJobResultRow[]
  total?: number
  found?: number
  renderFooter?: () => ReactNode
}) {
  const tableRows = normalizeRows(output, rows)
  const t = total ?? output.total ?? tableRows.length
  const f = found ?? output.found ?? tableRows.filter((r) => r.status === 'found').length
  return (
    <>
      <h2>
        {f}/{t} found
      </h2>
      <p>Review statuses below and export the full CSV.</p>
      <div className="preview-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => (
              <tr key={`${row.row}-${row.company}-${row.firstName}`}>
                <td>{`${row.firstName} ${row.lastName}`.trim()}</td>
                <td>{row.company}</td>
                <td>{row.email ?? '—'}</td>
                <td>
                  <span className={`chip ${row.status}`}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {renderFooter ? renderFooter() : null}
    </>
  )
}

export function BulkEmailFinderResult({
  input,
  output,
  bare = false,
  rows,
  total,
  found,
  renderFooter,
}: Props) {
  void input
  if (bare) {
    return (
      <ResultBody
        output={output}
        rows={rows}
        total={total}
        found={found}
        renderFooter={renderFooter}
      />
    )
  }
  return (
    <div className="bulk-email-finder">
      <section className="bef-panel">
        <ResultBody
          output={output}
          rows={rows}
          total={total}
          found={found}
          renderFooter={renderFooter}
        />
      </section>
    </div>
  )
}

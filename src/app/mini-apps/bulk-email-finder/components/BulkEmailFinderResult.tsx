// Not seen-in-the-wild verified: there are no completed submissions for this slug yet.
// Bulk Email Finder is a job-style mini-app and most output lives in a separate
// downloadable CSV. We render the per-row enrichment summary if present.
import { ResultCard, KeyValueGrid } from '@/app/results/[submissionId]/_components/ResultPrimitives'

export type BulkEmailFinderInput = { row_count?: number; jobId?: string }
export type BulkEmailFinderOutput = {
  jobId?: string
  total?: number
  found?: number
  not_found?: number
  rows?: Array<{
    name?: string
    company?: string
    email?: string
    confidence?: string
    status?: string
  }>
}

type Props = { input: BulkEmailFinderInput; output: BulkEmailFinderOutput }

export function BulkEmailFinderResult({ input, output }: Props) {
  void input
  return (
    <>
      <ResultCard label="// BULK EMAIL FINDER">
        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 600 }}>Enrichment summary</h1>
        <KeyValueGrid
          rows={[
            { key: 'TOTAL', value: output.total ?? '—' },
            { key: 'FOUND', value: output.found ?? '—' },
            { key: 'NOT FOUND', value: output.not_found ?? '—' },
          ]}
        />
      </ResultCard>

      {output.rows && output.rows.length > 0 && (
        <ResultCard label="// SAMPLE ROWS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {output.rows.slice(0, 20).map((r, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr auto',
                  gap: 8,
                  padding: '8px 10px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 2,
                  fontSize: 13,
                }}
              >
                <span>{r.name}</span>
                <span style={{ color: 'var(--color-fg-dim)' }}>{r.company}</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{r.email}</span>
                <span style={{ color: '#04e3ee', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  {r.confidence ?? r.status ?? ''}
                </span>
              </div>
            ))}
          </div>
        </ResultCard>
      )}
    </>
  )
}

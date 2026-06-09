import {
  ResultCard,
  BigScore,
  GradePill,
  KeyValueGrid,
} from '@/app/results/[submissionId]/_components/ResultPrimitives'

export type AgenticReadinessInput = { url?: string }
export type AgenticReadinessOutput = {
  scanId?: string
  free?: {
    url?: string
    site_name?: string
    one_liner?: string
    overall_score?: number
    overall_grade?: string
    readiness_label?: string
    total_issues?: number
    free_blockers?: Array<{ name: string; finding: string }>
    checks_summary?: Array<{ name: string; status: 'pass' | 'fail' | 'warn' | string }>
  }
}

type Props = { input: AgenticReadinessInput; output: AgenticReadinessOutput }

export function AgenticReadinessResult({ input, output }: Props) {
  const free = output.free
  if (!free) {
    return (
      <ResultCard label="// AGENTIC READINESS">
        <p>No data available.</p>
      </ResultCard>
    )
  }
  return (
    <>
      <ResultCard label="// AGENTIC READINESS">
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 600 }}>
          {free.site_name ?? 'Site'}
        </h1>
        <p style={{ margin: '0 0 12px', color: 'var(--color-fg-dim)', fontSize: 13 }}>
          {free.url ?? input.url}
        </p>
        {free.one_liner && (
          <p style={{ margin: '0 0 20px', fontStyle: 'italic' }}>“{free.one_liner}”</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <BigScore value={free.overall_score ?? '—'} suffix="/100" />
          {free.overall_grade && <GradePill grade={free.overall_grade} />}
        </div>
        {free.readiness_label && (
          <p
            style={{
              marginTop: 12,
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: '#04e3ee',
            }}
          >
            {free.readiness_label}
          </p>
        )}
      </ResultCard>

      {free.checks_summary && free.checks_summary.length > 0 && (
        <ResultCard label="// CHECKS">
          <KeyValueGrid
            rows={free.checks_summary.map((c) => ({
              key: c.name,
              value: (
                <span
                  style={{
                    color:
                      c.status === 'pass' ? '#04e3ee' : c.status === 'fail' ? '#ff6b6b' : '#f59e0b',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                  }}
                >
                  {c.status}
                </span>
              ),
            }))}
          />
        </ResultCard>
      )}

      {free.free_blockers && free.free_blockers.length > 0 && (
        <ResultCard label="// FREE BLOCKERS">
          {free.free_blockers.map((b, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <strong style={{ display: 'block', marginBottom: 4 }}>{b.name}</strong>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{b.finding}</p>
            </div>
          ))}
        </ResultCard>
      )}
    </>
  )
}

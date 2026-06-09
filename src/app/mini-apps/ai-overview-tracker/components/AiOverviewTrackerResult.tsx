// Not seen-in-the-wild verified: there are no completed submissions for this slug yet.
// Component built against the route's free output shape.
import { ResultCard, BigScore } from '@/app/results/[submissionId]/_components/ResultPrimitives'

export type AiOverviewTrackerInput = { domain?: string; keywords?: string[]; market?: string }
export type AiOverviewTrackerOutput = {
  free?: {
    domain?: string
    market?: string
    keywords_count?: number
    trigger_rate?: number
    citation_rate?: number
    one_liner?: string
    summary?: string
    citations_breakdown?: Array<{ domain: string; count: number }>
  }
  [key: string]: unknown
}

type Props = { input: AiOverviewTrackerInput; output: AiOverviewTrackerOutput }

export function AiOverviewTrackerResult({ input, output }: Props) {
  const free = output.free ?? (output as Record<string, unknown>)
  const get = (k: string) => (free as Record<string, unknown>)[k]
  return (
    <ResultCard label="// AI OVERVIEW TRACKER">
      <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 600 }}>
        {String(get('domain') ?? input.domain ?? '—')}
      </h1>
      <p style={{ margin: '0 0 16px', color: 'var(--color-fg-dim)', fontSize: 13 }}>
        {String(get('market') ?? input.market ?? '—')}
      </p>
      {typeof get('one_liner') === 'string' && (
        <p style={{ margin: '0 0 20px', fontStyle: 'italic' }}>“{String(get('one_liner'))}”</p>
      )}
      <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-fg-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
            }}
          >
            Trigger rate
          </div>
          <BigScore value={`${Number(get('trigger_rate') ?? 0)}%`} />
        </div>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-fg-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
            }}
          >
            Citation rate
          </div>
          <BigScore value={`${Number(get('citation_rate') ?? 0)}%`} />
        </div>
      </div>
      {typeof get('summary') === 'string' && (
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{String(get('summary'))}</p>
      )}
    </ResultCard>
  )
}

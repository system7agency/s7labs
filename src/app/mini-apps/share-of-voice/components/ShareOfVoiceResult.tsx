import {
  ResultCard,
  KeyValueGrid,
  BigScore,
} from '@/app/results/[submissionId]/_components/ResultPrimitives'

export type ShareOfVoiceInput = { domain?: string; competitors?: string[] }
export type ShareOfVoiceOutput = {
  free?: {
    category?: string
    your_brand?: string
    your_domain?: string
    providers_used?: string[]
    questions_count?: number
    headline?: {
      your_rank?: number
      your_share?: number
      total_brands?: number
      top_competitor?: string
      top_competitor_share?: number
    }
    scores?: Array<{
      name: string
      rank: number
      domain: string
      is_you: boolean
      share_of_voice: number
      appearances: number
      total_answers: number
    }>
  }
}

type Props = { input: ShareOfVoiceInput; output: ShareOfVoiceOutput }

export function ShareOfVoiceResult({ input, output }: Props) {
  void input
  const free = output.free
  if (!free) {
    return (
      <ResultCard label="// SHARE OF VOICE">
        <p>No data available for this submission.</p>
      </ResultCard>
    )
  }
  return (
    <>
      <ResultCard label="// SHARE OF VOICE">
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 600 }}>
          {free.your_brand ?? 'Your brand'}
        </h1>
        <p style={{ margin: '0 0 20px', color: 'var(--color-fg-dim)', fontSize: 13 }}>
          {free.your_domain} · {free.category}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <BigScore value={`${free.headline?.your_share ?? 0}%`} />
          <div style={{ fontSize: 14, color: 'var(--color-fg-dim)' }}>
            Rank {free.headline?.your_rank} of {free.headline?.total_brands}
            <br />
            Top competitor: {free.headline?.top_competitor} ({free.headline?.top_competitor_share}%)
          </div>
        </div>
      </ResultCard>

      {free.scores && free.scores.length > 0 && (
        <ResultCard label="// SCOREBOARD">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {free.scores.map((s, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  border: '1px solid var(--color-border)',
                  borderLeft: s.is_you ? '3px solid #04e3ee' : '1px solid var(--color-border)',
                  borderRadius: 2,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-fg-dim)',
                    fontSize: 13,
                    width: 24,
                  }}
                >
                  #{s.rank}
                </span>
                <span style={{ flex: 1, fontWeight: 600 }}>
                  {s.name}
                  {s.is_you && (
                    <span
                      style={{
                        marginLeft: 8,
                        color: '#04e3ee',
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      (you)
                    </span>
                  )}
                </span>
                <span style={{ color: 'var(--color-fg-dim)', fontSize: 13 }}>{s.domain}</span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: '#04e3ee',
                    fontWeight: 600,
                    minWidth: 60,
                    textAlign: 'right',
                  }}
                >
                  {s.share_of_voice}%
                </span>
              </div>
            ))}
          </div>
        </ResultCard>
      )}

      {(free.providers_used || free.questions_count) && (
        <ResultCard label="// METHODOLOGY">
          <KeyValueGrid
            rows={[
              { key: 'PROVIDERS', value: (free.providers_used ?? []).join(', ') },
              { key: 'QUESTIONS', value: free.questions_count ?? '—' },
            ]}
          />
        </ResultCard>
      )}
    </>
  )
}

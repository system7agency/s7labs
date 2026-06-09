import { ResultCard, BigScore } from '@/app/results/[submissionId]/_components/ResultPrimitives'

import type { IntentSignalsResult as IntentSignalsResultType } from '@/app/api/mini-apps/intent-signals/route'

export type IntentSignalsInput = { domain?: string }
export type IntentSignalsOutput = IntentSignalsResultType

type Props = { input: IntentSignalsInput; output: IntentSignalsOutput }

export function IntentSignalsResult({ input, output }: Props) {
  void input
  const out = output as unknown as {
    company?: string
    domain?: string
    intent_score?: number
    summary?: string
    signals?: Array<{
      label?: string
      detail?: string
      strength?: string
      source?: string
      category?: string
    }>
    outreach_angle?: string
  }
  return (
    <>
      <ResultCard label="// INTENT SIGNALS">
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 600 }}>
          {out.company ?? 'Company'}
        </h1>
        <p style={{ margin: '0 0 16px', color: 'var(--color-fg-dim)', fontSize: 13 }}>
          {out.domain ?? input.domain}
        </p>
        {typeof out.intent_score === 'number' && (
          <BigScore value={out.intent_score} suffix="/100" />
        )}
        {out.summary && (
          <p style={{ marginTop: 16, fontSize: 14, lineHeight: 1.6 }}>{out.summary}</p>
        )}
      </ResultCard>

      {out.signals && out.signals.length > 0 && (
        <ResultCard label="// SIGNALS">
          {out.signals.map((s, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <strong>{s.label}</strong>
                {s.strength && (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color:
                        s.strength === 'hot' || s.strength === 'strong'
                          ? '#ff6b6b'
                          : s.strength === 'warm' || s.strength === 'moderate'
                            ? '#f59e0b'
                            : 'var(--color-fg-dim)',
                    }}
                  >
                    {s.strength}
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{s.detail}</p>
              {s.source && (
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-fg-dim)' }}>
                  source: {s.source}
                </p>
              )}
            </div>
          ))}
        </ResultCard>
      )}

      {out.outreach_angle && (
        <ResultCard label="// OUTREACH ANGLE">
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{out.outreach_angle}</p>
        </ResultCard>
      )}
    </>
  )
}

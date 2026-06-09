import { ResultCard, BigScore } from '@/app/results/[submissionId]/_components/ResultPrimitives'

import type { RadarResult } from '@/app/api/mini-apps/outbound-radar/route'

export type OutboundRadarInput = { company?: string; domain?: string }
export type OutboundRadarOutput = RadarResult

type Props = { input: OutboundRadarInput; output: OutboundRadarOutput }

export function OutboundRadarResult({ input, output }: Props) {
  void input
  return (
    <>
      <ResultCard label="// OUTBOUND TRIGGER RADAR">
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 600 }}>{output.company}</h1>
        <p style={{ margin: '0 0 20px', color: 'var(--color-fg-dim)', fontSize: 13 }}>
          {output.domain}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <BigScore value={output.intent_score} suffix="/10" />
          <div style={{ fontSize: 14, color: 'var(--color-fg-dim)' }}>
            Urgency: {output.urgency}
            <br />
            Best persona: {output.best_persona}
          </div>
        </div>
        <p style={{ marginTop: 16, fontSize: 14, lineHeight: 1.6 }}>{output.summary}</p>
      </ResultCard>

      {output.signals && output.signals.length > 0 && (
        <ResultCard label="// SIGNALS">
          {output.signals.map((s, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <strong>{s.label}</strong>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color:
                      s.strength === 'strong'
                        ? '#04e3ee'
                        : s.strength === 'moderate'
                          ? '#f59e0b'
                          : 'var(--color-fg-dim)',
                  }}
                >
                  {s.type} · {s.strength}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{s.detail}</p>
            </div>
          ))}
        </ResultCard>
      )}

      {output.outreach_angle && (
        <ResultCard label="// OUTREACH ANGLE">
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{output.outreach_angle}</p>
        </ResultCard>
      )}
    </>
  )
}

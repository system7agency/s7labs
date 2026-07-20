import {
  ResultCard,
  BigScore,
  ImprovementCard,
} from '@/app/results/[submissionId]/_components/ResultPrimitives'

import type { EmailCopyOptimizerResult as EmailCopyOptimizerResultType } from '@/app/api/mini-apps/email-copy-optimizer/route'

export type EmailCopyOptimizerInput = { subject?: string; body?: string }
export type EmailCopyOptimizerOutput = EmailCopyOptimizerResultType

type Props = { input: EmailCopyOptimizerInput; output: EmailCopyOptimizerOutput }

export function EmailCopyOptimizerResult({ input, output }: Props) {
  void input
  // The output shape uses a few different key names depending on which model run produced it.
  // We treat the type loosely here for resilience.
  const out = output as unknown as {
    quality_score?: number
    diagnosis?: { issues?: Array<{ severity?: string; description?: string }> }
    variations?: Array<{
      angle?: string
      subject?: string
      body?: string
      changes?: Array<{ description?: string }>
    }>
  }
  return (
    <>
      <ResultCard label="// EMAIL COPY OPTIMIZER">
        <h1 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 600 }}>Optimized rewrites</h1>
        {typeof out.quality_score === 'number' && (
          <BigScore value={out.quality_score} suffix="/100" />
        )}
      </ResultCard>

      {out.diagnosis?.issues && out.diagnosis.issues.length > 0 && (
        <ResultCard label="// DIAGNOSIS">
          {out.diagnosis.issues.map((iss, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color:
                    iss.severity === 'high'
                      ? '#ff6b6b'
                      : iss.severity === 'medium'
                        ? '#f59e0b'
                        : '#04e3ee',
                  marginRight: 8,
                }}
              >
                {iss.severity}
              </span>
              <span style={{ fontSize: 14 }}>{iss.description}</span>
            </div>
          ))}
        </ResultCard>
      )}

      {out.variations && out.variations.length > 0 && (
        <ResultCard label="// VARIATIONS">
          {out.variations.map((v, i) => (
            <ImprovementCard
              key={i}
              rank={i + 1}
              title={v.angle ?? `Variation ${i + 1}`}
              description={`Subject: ${v.subject ?? ''}\n\n${v.body ?? ''}`}
            />
          ))}
        </ResultCard>
      )}
    </>
  )
}

import {
  ResultCard,
  BigScore,
  GradePill,
  KeyValueGrid,
  FlagsList,
  ImprovementCard,
} from '@/app/results/[submissionId]/_components/ResultPrimitives'

import type { DiagnosticResult } from '@/app/api/mini-apps/pricing-diagnostic/route'

export type PricingDiagnosticInput = { url: string }
export type PricingDiagnosticOutput = DiagnosticResult

type Props = { input: PricingDiagnosticInput; output: PricingDiagnosticOutput }

export function PricingDiagnosticResult({ input, output }: Props) {
  const url = output.url ?? input.url
  return (
    <>
      <ResultCard label="// PRICING DIAGNOSTIC">
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 600 }}>Pricing page teardown</h1>
        <p style={{ margin: '0 0 20px', color: 'var(--color-fg-dim)', fontSize: 13 }}>{url}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 20 }}>
          <BigScore value={output.friction_score} suffix="/10" />
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--color-fg-dim)',
              }}
            >
              Friction score
            </div>
            <div style={{ marginTop: 6 }}>
              <GradePill grade={output.clarity_grade} />
              <span style={{ marginLeft: 10, color: 'var(--color-fg-dim)', fontSize: 13 }}>
                {output.plan_legibility} legibility
              </span>
            </div>
          </div>
        </div>

        <KeyValueGrid rows={[{ key: 'BUYER INFERENCE', value: output.buyer_inference }]} />
      </ResultCard>

      {output.flags?.length > 0 && (
        <ResultCard label="// PROBLEM FLAGS">
          <FlagsList items={output.flags} />
        </ResultCard>
      )}

      {output.improvements?.length > 0 && (
        <ResultCard label="// IMPROVEMENTS">
          {output.improvements.map((imp) => (
            <ImprovementCard
              key={imp.rank}
              rank={imp.rank}
              title={imp.title}
              description={imp.description}
              impact={imp.impact}
            />
          ))}
        </ResultCard>
      )}
    </>
  )
}

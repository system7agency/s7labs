import {
  ResultCard,
  KeyValueGrid,
  BulletList,
} from '@/app/results/[submissionId]/_components/ResultPrimitives'

import type { StackResult } from '@/app/api/mini-apps/tech-stack-recommender/route'

export type TechStackRecommenderInput = { description?: string }
export type TechStackRecommenderOutput = StackResult

type Props = { input: TechStackRecommenderInput; output: TechStackRecommenderOutput }

export function TechStackRecommenderResult({ input, output }: Props) {
  void input
  return (
    <>
      <ResultCard label="// TECH STACK RECOMMENDER">
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 600 }}>{output.project_name}</h1>
        <p style={{ margin: '0 0 16px', color: 'var(--color-fg-dim)', fontSize: 13 }}>
          {output.project_type}
        </p>
        {output.one_liner && (
          <p style={{ margin: '0 0 16px', fontStyle: 'italic' }}>“{output.one_liner}”</p>
        )}
        <KeyValueGrid
          rows={[
            { key: 'COMPLEXITY', value: `${output.complexity} (${output.complexity_score}/10)` },
            { key: 'BUILD ESTIMATE', value: output.build_estimate },
            { key: 'MONTHLY COST', value: output.monthly_cost_estimate },
          ]}
        />
      </ResultCard>

      {output.layers && output.layers.length > 0 && (
        <ResultCard label="// STACK LAYERS">
          {output.layers.map((l, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    color: 'var(--color-fg-dim)',
                    textTransform: 'uppercase',
                  }}
                >
                  {l.layer}
                </span>
                <strong style={{ color: '#04e3ee' }}>{l.pick}</strong>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-fg-dim)' }}>
                  {l.monthly_cost}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>{l.why}</p>
            </div>
          ))}
        </ResultCard>
      )}

      {output.key_services && output.key_services.length > 0 && (
        <ResultCard label="// KEY SERVICES">
          {output.key_services.map((s, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <strong>{s.name}</strong>
              <p style={{ margin: '4px 0 0', fontSize: 13 }}>{s.purpose}</p>
            </div>
          ))}
        </ResultCard>
      )}

      {output.considerations && output.considerations.length > 0 && (
        <ResultCard label="// CONSIDERATIONS">
          <BulletList items={output.considerations} />
        </ResultCard>
      )}
    </>
  )
}

import {
  ResultCard,
  KeyValueGrid,
  BulletList,
} from '@/app/results/[submissionId]/_components/ResultPrimitives'

import type { ProposalResult } from '@/app/api/mini-apps/proposal-engine/route'

export type ProposalEngineInput = { brief?: string; tone?: string }
export type ProposalEngineOutput = ProposalResult

type Props = { input: ProposalEngineInput; output: ProposalEngineOutput }

export function ProposalEngineResult({ input, output }: Props) {
  void input
  return (
    <>
      <ResultCard label="// PROPOSAL DRAFT">
        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 600 }}>{output.scope?.title}</h1>
        <KeyValueGrid
          rows={[
            { key: 'TIMELINE', value: `${output.timeline_weeks} weeks` },
            { key: 'TONE', value: output.tone ?? '—' },
          ]}
        />
        {output.client_summary && (
          <p style={{ margin: '16px 0 0', fontSize: 14, lineHeight: 1.6 }}>
            {output.client_summary}
          </p>
        )}
      </ResultCard>

      {output.scope?.content && (
        <ResultCard label="// SCOPE">
          <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.6 }}>
            {output.scope.content}
          </p>
          {output.scope.bullets && output.scope.bullets.length > 0 && (
            <BulletList items={output.scope.bullets} />
          )}
        </ResultCard>
      )}

      {output.phases && output.phases.length > 0 && (
        <ResultCard label="// PHASES">
          {output.phases.map((p) => (
            <div key={p.number} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ color: '#04e3ee', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  PHASE {p.number}
                </span>
                <strong>{p.name}</strong>
                <span style={{ marginLeft: 'auto', color: 'var(--color-fg-dim)', fontSize: 13 }}>
                  {p.duration}
                </span>
              </div>
              {p.deliverables && <BulletList items={p.deliverables} />}
            </div>
          ))}
        </ResultCard>
      )}

      {output.tech_stack && output.tech_stack.length > 0 && (
        <ResultCard label="// TECH STACK">
          {output.tech_stack.map((t, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <strong>{t.name}</strong>{' '}
              <span style={{ color: 'var(--color-fg-dim)', fontSize: 12 }}>· {t.category}</span>
              <p style={{ margin: '4px 0 0', fontSize: 13 }}>{t.reason}</p>
            </div>
          ))}
        </ResultCard>
      )}

      {output.why_s7?.content && (
        <ResultCard label="// WHY S7">
          <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.6 }}>
            {output.why_s7.content}
          </p>
          {output.why_s7.bullets && <BulletList items={output.why_s7.bullets} />}
        </ResultCard>
      )}
    </>
  )
}

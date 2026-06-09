import {
  ResultCard,
  KeyValueGrid,
  BulletList,
} from '@/app/results/[submissionId]/_components/ResultPrimitives'

import type { BriefResult } from '@/app/api/mini-apps/job-brief/route'

export type JobBriefInput = { url?: string; text?: string }
export type JobBriefOutput = BriefResult

type Props = { input: JobBriefInput; output: JobBriefOutput }

export function JobBriefResult({ input, output }: Props) {
  void input
  return (
    <>
      <ResultCard label="// JOB POSTING SALES BRIEF">
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 600 }}>{output.role}</h1>
        <p style={{ margin: '0 0 16px', color: 'var(--color-fg-dim)', fontSize: 13 }}>
          {output.company} · {output.department} · {output.seniority}
        </p>
        <KeyValueGrid
          rows={[
            { key: 'URGENCY', value: output.urgency },
            { key: 'IDEAL CONTACT', value: output.ideal_contact },
          ]}
        />
        <p style={{ marginTop: 16, fontSize: 14, lineHeight: 1.6 }}>{output.summary}</p>
      </ResultCard>

      {output.pain_points && output.pain_points.length > 0 && (
        <ResultCard label="// PAIN POINTS">
          <BulletList items={output.pain_points} />
        </ResultCard>
      )}

      {output.budget_indicators && output.budget_indicators.length > 0 && (
        <ResultCard label="// BUDGET INDICATORS">
          <BulletList items={output.budget_indicators} />
        </ResultCard>
      )}

      {output.signals && output.signals.length > 0 && (
        <ResultCard label="// SIGNALS">
          {output.signals.map((s, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: '#04e3ee',
                  marginBottom: 4,
                }}
              >
                {s.category}
              </div>
              <strong>{s.label}</strong>
              <p style={{ margin: '4px 0 0', fontSize: 14, lineHeight: 1.5 }}>{s.detail}</p>
            </div>
          ))}
        </ResultCard>
      )}

      {output.best_angle && (
        <ResultCard label="// SALES ANGLE">
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{output.best_angle}</p>
        </ResultCard>
      )}
    </>
  )
}

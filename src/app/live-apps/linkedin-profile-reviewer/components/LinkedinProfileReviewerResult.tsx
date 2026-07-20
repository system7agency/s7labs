import {
  ResultCard,
  BigScore,
  GradePill,
  ImprovementCard,
} from '@/app/results/[submissionId]/_components/ResultPrimitives'

import type { ProfileReviewResult } from '@/app/api/mini-apps/linkedin-profile-reviewer/route'

export type LinkedinProfileReviewerInput = { url?: string; text?: string }
export type LinkedinProfileReviewerOutput = ProfileReviewResult

type Props = { input: LinkedinProfileReviewerInput; output: LinkedinProfileReviewerOutput }

export function LinkedinProfileReviewerResult({ input, output }: Props) {
  void input
  const out = output as unknown as {
    overall_score?: number
    overall_grade?: string
    one_liner?: string
    sections?: Array<{
      name?: string
      score?: number
      grade?: string
      verdict?: string
      suggestion?: string
    }>
    top_actions?: Array<{
      rank?: number
      title?: string
      description?: string
      impact?: string
    }>
  }
  return (
    <>
      <ResultCard label="// LINKEDIN PROFILE REVIEW">
        <h1 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 600 }}>Overall</h1>
        {out.one_liner && (
          <p style={{ margin: '0 0 16px', fontStyle: 'italic' }}>“{out.one_liner}”</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <BigScore value={out.overall_score ?? '—'} suffix="/100" />
          {out.overall_grade && <GradePill grade={out.overall_grade} />}
        </div>
      </ResultCard>

      {out.sections && out.sections.length > 0 && (
        <ResultCard label="// SECTIONS">
          {out.sections.map((s, i) => (
            <div
              key={i}
              style={{
                marginBottom: 12,
                paddingBottom: 12,
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <strong>{s.name}</strong>
                {s.grade && <GradePill grade={s.grade} />}
                <span style={{ color: 'var(--color-fg-dim)', fontSize: 13 }}>{s.score}/10</span>
              </div>
              {s.verdict && (
                <p style={{ margin: '0 0 6px', fontSize: 14, lineHeight: 1.5 }}>{s.verdict}</p>
              )}
              {s.suggestion && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: '#04e3ee',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  → {s.suggestion}
                </p>
              )}
            </div>
          ))}
        </ResultCard>
      )}

      {out.top_actions && out.top_actions.length > 0 && (
        <ResultCard label="// TOP 5 ACTIONS">
          {out.top_actions.map((a, i) => (
            <ImprovementCard
              key={i}
              rank={a.rank ?? i + 1}
              title={a.title ?? ''}
              description={a.description}
              impact={a.impact}
            />
          ))}
        </ResultCard>
      )}
    </>
  )
}

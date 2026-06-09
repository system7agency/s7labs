import {
  ResultCard,
  BigScore,
  GradePill,
  KeyValueGrid,
  BulletList,
  SubScoreCards,
} from '@/app/results/[submissionId]/_components/ResultPrimitives'

// Loose typing: AVS output is large and the route re-exports zod-inferred types.
// We type only the fields we render.
export type AiVisibilityScoreInput = { domain?: string }
export type AiVisibilityScoreOutput = {
  avs?: number
  brand?: string
  grade?: string
  domain?: string
  category?: string
  one_liner?: string
  short_read?: Array<{ diagnosis: string; sub_score: string }>
  sub_scores?: Array<{ key: string; name: string; grade: string; score: number; coverage?: string }>
  biggest_drag?: { why: string; sub_score: string }
  fix_recommendations?: string[]
}

type Props = { input: AiVisibilityScoreInput; output: AiVisibilityScoreOutput }

export function AiVisibilityScoreResult({ input, output }: Props) {
  return (
    <>
      <ResultCard label="// AI VISIBILITY SCORE">
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 600 }}>
          {output.brand ?? input.domain ?? 'Brand'}
        </h1>
        <p style={{ margin: '0 0 16px', color: 'var(--color-fg-dim)', fontSize: 13 }}>
          {output.domain ?? input.domain} · {output.category ?? '—'}
        </p>
        {output.one_liner && (
          <p style={{ margin: '0 0 20px', fontStyle: 'italic' }}>“{output.one_liner}”</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <BigScore value={output.avs ?? '—'} suffix="/100" />
          {output.grade && <GradePill grade={output.grade} />}
        </div>
      </ResultCard>

      {output.sub_scores && output.sub_scores.length > 0 && (
        <ResultCard label="// SUB-SCORES">
          <SubScoreCards
            scores={output.sub_scores.map((s) => ({
              label: s.name,
              value: `${s.score} · ${s.grade}`,
            }))}
          />
        </ResultCard>
      )}

      {output.biggest_drag && (
        <ResultCard label="// BIGGEST DRAG">
          <KeyValueGrid
            rows={[
              { key: 'SUB-SCORE', value: output.biggest_drag.sub_score },
              { key: 'WHY', value: output.biggest_drag.why },
            ]}
          />
        </ResultCard>
      )}

      {output.short_read && output.short_read.length > 0 && (
        <ResultCard label="// SHORT READ">
          {output.short_read.map((r, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#04e3ee',
                  marginBottom: 4,
                }}
              >
                {r.sub_score}
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{r.diagnosis}</p>
            </div>
          ))}
        </ResultCard>
      )}

      {output.fix_recommendations && output.fix_recommendations.length > 0 && (
        <ResultCard label="// FIX RECOMMENDATIONS">
          <BulletList items={output.fix_recommendations} />
        </ResultCard>
      )}
    </>
  )
}

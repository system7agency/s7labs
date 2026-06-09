import {
  ResultCard,
  BigScore,
  GradePill,
  KeyValueGrid,
  BulletList,
} from '@/app/results/[submissionId]/_components/ResultPrimitives'

import type { RoastResult } from '@/app/api/mini-apps/website-roast/route'

export type WebsiteRoastInput = { url: string }
export type WebsiteRoastOutput = RoastResult

type Props = { input: WebsiteRoastInput; output: WebsiteRoastOutput }

export function WebsiteRoastResult({ input, output }: Props) {
  const url = output.url ?? input.url
  return (
    <>
      <ResultCard label="// WEBSITE ROAST">
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 600 }}>
          {output.site_name ?? 'Site'} roast
        </h1>
        <p style={{ margin: '0 0 8px', color: 'var(--color-fg-dim)', fontSize: 13 }}>{url}</p>
        {output.one_liner && (
          <p style={{ margin: '0 0 20px', fontStyle: 'italic', fontSize: 15 }}>
            “{output.one_liner}”
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <BigScore value={output.overall_score} suffix="/100" />
          <GradePill grade={output.overall_grade} />
        </div>
      </ResultCard>

      {output.categories?.length > 0 && (
        <ResultCard label="// CATEGORY SCORES">
          {output.categories.map((c, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <strong style={{ fontSize: 15 }}>{c.name}</strong>
                <GradePill grade={c.grade} />
                <span style={{ color: 'var(--color-fg-dim)', fontSize: 13 }}>{c.score}/10</span>
              </div>
              <p style={{ margin: '0 0 6px', fontSize: 14, lineHeight: 1.5 }}>{c.roast}</p>
              {c.quick_fix && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: '#04e3ee',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  → {c.quick_fix}
                </p>
              )}
            </div>
          ))}
        </ResultCard>
      )}

      {output.lighthouse &&
        Object.values(output.lighthouse).some((v) => v !== null && v !== undefined) && (
          <ResultCard label="// LIGHTHOUSE">
            <KeyValueGrid
              rows={[
                { key: 'PERFORMANCE', value: output.lighthouse.performance ?? 'n/a' },
                { key: 'ACCESSIBILITY', value: output.lighthouse.accessibility ?? 'n/a' },
                { key: 'BEST PRACTICES', value: output.lighthouse.best_practices ?? 'n/a' },
                { key: 'SEO', value: output.lighthouse.seo ?? 'n/a' },
              ]}
            />
          </ResultCard>
        )}

      {output.top_3_fixes?.length > 0 && (
        <ResultCard label="// TOP 3 FIXES">
          <BulletList items={output.top_3_fixes} />
        </ResultCard>
      )}
    </>
  )
}

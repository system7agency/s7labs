import {
  ResultCard,
  BigScore,
  GradePill,
  KeyValueGrid,
  BulletList,
} from '@/app/results/[submissionId]/_components/ResultPrimitives'

import type { SanityResult } from '@/app/api/mini-apps/crm-sanity/route'

export type CrmSanityInput = { record?: string }
export type CrmSanityOutput = SanityResult

type Props = { input: CrmSanityInput; output: CrmSanityOutput }

export function CrmSanityResult({ input, output }: Props) {
  void input
  return (
    <>
      <ResultCard label="// CRM FIELD SANITY CHECK">
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 600 }}>
          {output.record_type ?? 'Record'} quality
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 20 }}>
          <BigScore value={output.quality_score} suffix="/100" />
          {output.grade && <GradePill grade={output.grade} />}
        </div>
        <KeyValueGrid
          rows={[
            { key: 'DUPLICATE RISK', value: output.duplicate_risk },
            ...(output.duplicate_reason ? [{ key: 'REASON', value: output.duplicate_reason }] : []),
          ]}
        />
      </ResultCard>

      {output.issues && output.issues.length > 0 && (
        <ResultCard label="// ISSUES">
          {output.issues.map((iss, i) => (
            <div
              key={i}
              style={{
                marginBottom: 12,
                paddingBottom: 12,
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 4,
                }}
              >
                <strong>{iss.field}</strong>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color:
                      iss.severity === 'critical'
                        ? '#ff6b6b'
                        : iss.severity === 'warning'
                          ? '#f59e0b'
                          : '#04e3ee',
                  }}
                >
                  {iss.severity}
                </span>
              </div>
              <p style={{ margin: '0 0 4px', fontSize: 14 }}>
                <span style={{ color: 'var(--color-fg-dim)' }}>Value: </span>
                <code>{String(iss.value ?? '')}</code>
              </p>
              <p style={{ margin: '0 0 4px', fontSize: 14, lineHeight: 1.5 }}>{iss.issue}</p>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: '#04e3ee',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                → {iss.fix}
              </p>
            </div>
          ))}
        </ResultCard>
      )}

      {output.clean_fields && output.clean_fields.length > 0 && (
        <ResultCard label="// CLEAN FIELDS">
          <BulletList items={output.clean_fields} />
        </ResultCard>
      )}
    </>
  )
}

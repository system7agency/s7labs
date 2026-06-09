import {
  ResultCard,
  KeyValueGrid,
  BulletList,
  PreBlock,
} from '@/app/results/[submissionId]/_components/ResultPrimitives'

import type { BlueprintResult } from '@/app/api/mini-apps/automation-blueprint/route'

export type AutomationBlueprintInput = { process_description?: string }
export type AutomationBlueprintOutput = BlueprintResult

type Props = { input: AutomationBlueprintInput; output: AutomationBlueprintOutput }

export function AutomationBlueprintResult({ input, output }: Props) {
  void input
  return (
    <>
      <ResultCard label="// AUTOMATION BLUEPRINT">
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 600 }}>{output.process_name}</h1>
        {output.one_liner && (
          <p style={{ margin: '0 0 16px', fontStyle: 'italic' }}>“{output.one_liner}”</p>
        )}
        <KeyValueGrid
          rows={[
            { key: 'RECOMMENDED TOOL', value: output.recommended_tool },
            { key: 'DIFFICULTY', value: `${output.difficulty} (${output.difficulty_score}/10)` },
            { key: 'FREQUENCY', value: output.current_state?.frequency ?? '—' },
            { key: 'TIME SAVED / WEEK', value: output.current_state?.time_saved_per_week ?? '—' },
            { key: 'TIME SAVED / YEAR', value: output.current_state?.time_saved_per_year ?? '—' },
          ]}
        />
      </ResultCard>

      {output.steps && output.steps.length > 0 && (
        <ResultCard label="// STEPS">
          {output.steps.map((s) => (
            <div
              key={s.step}
              style={{
                marginBottom: 12,
                paddingBottom: 12,
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: '#04e3ee',
                  marginBottom: 4,
                }}
              >
                STEP {s.step} · {s.action_type} · {s.tool}
              </div>
              <strong>{s.title}</strong>
              <p style={{ margin: '4px 0 0', fontSize: 14, lineHeight: 1.5 }}>{s.description}</p>
            </div>
          ))}
        </ResultCard>
      )}

      {output.tool_options && output.tool_options.length > 0 && (
        <ResultCard label="// TOOL OPTIONS">
          {output.tool_options.map((t, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <strong>{t.name}</strong>
                <span style={{ color: '#04e3ee', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  fit {t.fit_score}/10
                </span>
              </div>
              <p style={{ margin: '0 0 4px', fontSize: 14, lineHeight: 1.5 }}>{t.why}</p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-fg-dim)' }}>
                {t.best_for} · {t.pricing_note}
              </p>
            </div>
          ))}
        </ResultCard>
      )}

      {output.gotchas && output.gotchas.length > 0 && (
        <ResultCard label="// GOTCHAS">
          <BulletList items={output.gotchas} />
        </ResultCard>
      )}

      {output.starter_config?.json && (
        <ResultCard label={`// STARTER CONFIG · ${output.starter_config.platform}`}>
          {output.starter_config.note && (
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--color-fg-dim)' }}>
              {output.starter_config.note}
            </p>
          )}
          <PreBlock>{output.starter_config.json}</PreBlock>
        </ResultCard>
      )}

      {output.mermaid && (
        <ResultCard label="// MERMAID">
          <PreBlock>{output.mermaid}</PreBlock>
        </ResultCard>
      )}
    </>
  )
}

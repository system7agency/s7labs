import {
  ResultCard,
  KeyValueGrid,
  ImprovementCard,
} from '@/app/results/[submissionId]/_components/ResultPrimitives'

import type { HookResult } from '@/app/api/mini-apps/linkedin-hook/route'

export type LinkedinHookInput = { post_text: string }
export type LinkedinHookOutput = HookResult

type Props = { input: LinkedinHookInput; output: LinkedinHookOutput }

export function LinkedinHookResult({ input, output }: Props) {
  void input
  return (
    <>
      <ResultCard label="// LINKEDIN HOOK">
        <h1 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 600 }}>3 outbound hooks</h1>
        <KeyValueGrid
          rows={[
            { key: 'TRIGGER TYPE', value: output.trigger_type ?? 'n/a' },
            { key: 'TRIGGER', value: output.trigger ?? 'n/a' },
            { key: 'POST AUTHOR', value: output.post_author ?? 'n/a' },
            { key: 'POST SUMMARY', value: output.post_summary ?? 'n/a' },
            { key: 'TARGET PERSONA', value: output.target_persona ?? 'n/a' },
          ]}
        />
      </ResultCard>

      {output.hooks?.length > 0 && (
        <ResultCard label="// HOOKS">
          {output.hooks.map((h, i) => (
            <ImprovementCard
              key={i}
              rank={i + 1}
              title={`${h.tone} · ${h.channel}`}
              description={`${h.opening_line}\n\nFollow-up: ${h.follow_up}`}
              impact={i === output.best_hook_index ? 'high' : 'low'}
            />
          ))}
        </ResultCard>
      )}
    </>
  )
}

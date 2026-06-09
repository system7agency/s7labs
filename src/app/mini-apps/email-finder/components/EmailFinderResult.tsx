// Not seen-in-the-wild verified: there are no completed submissions for this slug yet.
// Component built against the route's exported EmailFinderResult type.
import { ResultCard, KeyValueGrid } from '@/app/results/[submissionId]/_components/ResultPrimitives'

import type { EmailFinderResult as EmailFinderResultType } from '@/app/api/mini-apps/email-finder/route'

export type EmailFinderInput = { name?: string; company?: string }
export type EmailFinderOutput = EmailFinderResultType | null

type Props = { input: EmailFinderInput; output: EmailFinderOutput }

export function EmailFinderResult({ input, output }: Props) {
  if (!output) {
    return (
      <ResultCard label="// EMAIL FINDER">
        <p>
          No match found for {input.name} at {input.company}.
        </p>
      </ResultCard>
    )
  }
  const o = output as unknown as Record<string, unknown>
  return (
    <ResultCard label="// EMAIL FINDER">
      <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 600 }}>
        {String(o.name ?? input.name ?? '—')}
      </h1>
      <KeyValueGrid
        rows={[
          { key: 'EMAIL', value: <code>{String(o.email ?? '—')}</code> },
          { key: 'CONFIDENCE', value: String(o.confidence ?? '—') },
          { key: 'TITLE', value: String(o.title ?? '—') },
          { key: 'COMPANY', value: String(o.company ?? input.company ?? '—') },
          { key: 'LINKEDIN', value: String(o.linkedin_url ?? '—') },
        ]}
      />
    </ResultCard>
  )
}

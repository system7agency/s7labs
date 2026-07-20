// Not seen-in-the-wild verified: there are no completed submissions for this slug yet.
// Find People is mostly interactive (filters, pagination). For the static results
// page we just render the captured roster as a list.
import { ResultCard } from '@/app/results/[submissionId]/_components/ResultPrimitives'

export type FindPeopleInput = { company?: string; domain?: string }
export type FindPeopleOutput = {
  total?: number
  people?: Array<{
    name?: string
    title?: string
    department?: string
    seniority?: string
    linkedin_url?: string
  }>
}

type Props = { input: FindPeopleInput; output: FindPeopleOutput }

export function FindPeopleResult({ input, output }: Props) {
  return (
    <ResultCard label="// FIND PEOPLE">
      <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 600 }}>
        {input.company ?? input.domain ?? 'Company'}
      </h1>
      <p style={{ margin: '0 0 16px', color: 'var(--color-fg-dim)', fontSize: 13 }}>
        {output.total ?? output.people?.length ?? 0} people
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(output.people ?? []).map((p, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr auto',
              gap: 12,
              padding: '8px 10px',
              border: '1px solid var(--color-border)',
              borderRadius: 2,
              fontSize: 13,
            }}
          >
            <span style={{ fontWeight: 600 }}>{p.name}</span>
            <span style={{ color: 'var(--color-fg-dim)' }}>{p.title}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#04e3ee' }}>
              {p.seniority} · {p.department}
            </span>
          </div>
        ))}
      </div>
    </ResultCard>
  )
}

// Not seen-in-the-wild verified: no completed submissions for this slug yet.
import { ResultCard, KeyValueGrid } from '@/app/results/[submissionId]/_components/ResultPrimitives'

export type TechStackFinderInput = { domain?: string }
export type TechStackFinderOutput = {
  domain?: string
  total?: number
  categories?: Record<string, Array<{ name: string; logo?: string }>>
}

type Props = { input: TechStackFinderInput; output: TechStackFinderOutput }

export function TechStackFinderResult({ input, output }: Props) {
  return (
    <>
      <ResultCard label="// TECH STACK FINDER">
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 600 }}>
          {output.domain ?? input.domain ?? 'Domain'}
        </h1>
        <p style={{ margin: '0 0 16px', color: 'var(--color-fg-dim)', fontSize: 13 }}>
          {output.total ?? 0} technologies detected
        </p>
      </ResultCard>

      {output.categories &&
        Object.entries(output.categories).map(([cat, items]) => (
          <ResultCard key={cat} label={`// ${cat.toUpperCase()}`}>
            <KeyValueGrid rows={items.map((it) => ({ key: it.name, value: '' }))} />
          </ResultCard>
        ))}
    </>
  )
}

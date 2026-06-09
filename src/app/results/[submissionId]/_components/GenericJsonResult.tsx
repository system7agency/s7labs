import { ResultCard, Section, PreBlock } from './ResultPrimitives'

type Props = { input: unknown; output: unknown; label?: string }

/**
 * Last-resort renderer. Used when a slug's dedicated result component
 * isn't suitable, or as a defensive fallback for malformed output rows.
 */
export function GenericJsonResult({ input, output, label }: Props) {
  return (
    <ResultCard label={label ?? '// RESULT'}>
      <Section title="OUTPUT">
        <PreBlock>{JSON.stringify(output, null, 2)}</PreBlock>
      </Section>
      <Section title="INPUT">
        <PreBlock>{JSON.stringify(input, null, 2)}</PreBlock>
      </Section>
    </ResultCard>
  )
}

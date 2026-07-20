// GTM Flywheel is an interactive canvas mini-app. Results are user-built flywheel
// snapshots rather than AI-generated output. We render the captured node/edge
// summary if present, and otherwise dump as JSON.
// Not seen-in-the-wild verified.
import { ResultCard, KeyValueGrid } from '@/app/results/[submissionId]/_components/ResultPrimitives'

export type GtmFlywheelInput = unknown
export type GtmFlywheelOutput = {
  name?: string
  nodes?: Array<{ id: string; label: string }>
  edges?: Array<{ from: string; to: string }>
  share_url?: string
}

type Props = { input: GtmFlywheelInput; output: GtmFlywheelOutput }

export function GtmFlywheelResult({ input, output }: Props) {
  void input
  return (
    <ResultCard label="// GTM FLYWHEEL">
      <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 600 }}>
        {output.name ?? 'Flywheel'}
      </h1>
      <KeyValueGrid
        rows={[
          { key: 'MOTIONS', value: output.nodes?.length ?? 0 },
          { key: 'CONNECTIONS', value: output.edges?.length ?? 0 },
          ...(output.share_url ? [{ key: 'SHARE URL', value: output.share_url }] : []),
        ]}
      />
      {output.nodes && output.nodes.length > 0 && (
        <ul style={{ marginTop: 16, paddingLeft: 18 }}>
          {output.nodes.map((n) => (
            <li key={n.id} style={{ fontSize: 14, lineHeight: 1.6 }}>
              {n.label}
            </li>
          ))}
        </ul>
      )}
    </ResultCard>
  )
}

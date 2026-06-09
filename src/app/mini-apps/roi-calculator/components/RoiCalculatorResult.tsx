// ROI Calculator is a client-side computation, not a model run. We capture the
// final input/output snapshot for the results page.
// Not seen-in-the-wild verified.
import {
  ResultCard,
  BigScore,
  KeyValueGrid,
} from '@/app/results/[submissionId]/_components/ResultPrimitives'

export type RoiCalculatorInput = {
  leads_contacted?: number
  reply_rate?: number
  meeting_conversion?: number
  close_rate?: number
  avg_deal_size?: number
  campaign_cost?: number
}
export type RoiCalculatorOutput = {
  pipeline_value?: number
  expected_revenue?: number
  roi_multiple?: number
  cost_per_meeting?: number
  cost_per_deal?: number
}

type Props = { input: RoiCalculatorInput; output: RoiCalculatorOutput }

export function RoiCalculatorResult({ input, output }: Props) {
  const fmt = (n?: number) =>
    typeof n === 'number' ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'
  return (
    <>
      <ResultCard label="// ROI CALCULATOR">
        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 600 }}>Pipeline projection</h1>
        <BigScore value={`${output.roi_multiple ?? 0}×`} />
        <p style={{ marginTop: 8, color: 'var(--color-fg-dim)', fontSize: 13 }}>ROI multiple</p>
      </ResultCard>

      <ResultCard label="// OUTPUTS">
        <KeyValueGrid
          rows={[
            { key: 'PIPELINE VALUE', value: fmt(output.pipeline_value) },
            { key: 'EXPECTED REVENUE', value: fmt(output.expected_revenue) },
            { key: 'COST PER MEETING', value: fmt(output.cost_per_meeting) },
            { key: 'COST PER DEAL', value: fmt(output.cost_per_deal) },
          ]}
        />
      </ResultCard>

      <ResultCard label="// INPUTS">
        <KeyValueGrid
          rows={[
            { key: 'LEADS CONTACTED', value: input.leads_contacted ?? '—' },
            { key: 'REPLY RATE', value: `${input.reply_rate ?? '—'}%` },
            { key: 'MEETING CONVERSION', value: `${input.meeting_conversion ?? '—'}%` },
            { key: 'CLOSE RATE', value: `${input.close_rate ?? '—'}%` },
            { key: 'AVG DEAL SIZE', value: fmt(input.avg_deal_size) },
            { key: 'CAMPAIGN COST', value: fmt(input.campaign_cost) },
          ]}
        />
      </ResultCard>
    </>
  )
}

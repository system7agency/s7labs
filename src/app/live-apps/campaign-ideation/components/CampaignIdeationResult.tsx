import {
  ResultCard,
  ImprovementCard,
} from '@/app/results/[submissionId]/_components/ResultPrimitives'

import type { CampaignIdeationResult as CampaignIdeationResultType } from '@/app/api/mini-apps/campaign-ideation/route'

export type CampaignIdeationInput = {
  product?: string
  audience?: string
  motion?: string
  goal?: string
}
export type CampaignIdeationOutput = CampaignIdeationResultType

type Props = { input: CampaignIdeationInput; output: CampaignIdeationOutput }

export function CampaignIdeationResult({ input, output }: Props) {
  void input
  return (
    <>
      <ResultCard label="// CAMPAIGN IDEATION">
        <h1 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 600 }}>Positioning</h1>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{output.summary?.positioning}</p>
      </ResultCard>

      {output.ideas && output.ideas.length > 0 && (
        <ResultCard label="// 7 CAMPAIGN IDEAS">
          {output.ideas.map((idea, i) => (
            <ImprovementCard
              key={i}
              rank={i + 1}
              title={idea.name}
              description={`Hook: ${idea.hook}\n\nChannels: ${(idea.channels ?? []).join(', ')}\nFormat: ${idea.format}\n\nFirst step: ${idea.firstStep}\nExpected: ${idea.expectedOutcome}`}
              impact={idea.effort}
            />
          ))}
        </ResultCard>
      )}
    </>
  )
}

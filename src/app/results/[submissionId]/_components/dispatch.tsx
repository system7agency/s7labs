import type { ReactElement } from 'react'

import { AgenticReadinessResult } from '@/app/live-apps/agentic-readiness/components/AgenticReadinessResult'
import { AiOverviewTrackerResult } from '@/app/live-apps/ai-overview-tracker/components/AiOverviewTrackerResult'
import { AiVisibilityScoreResult } from '@/app/live-apps/ai-visibility-score/components/AiVisibilityScoreResult'
import { AutomationBlueprintResult } from '@/app/live-apps/automation-blueprint/components/AutomationBlueprintResult'
import { BulkEmailFinderResult } from '@/app/live-apps/bulk-email-finder/components/BulkEmailFinderResult'
import { CampaignIdeationResult } from '@/app/live-apps/campaign-ideation/components/CampaignIdeationResult'
import { CrmSanityResult } from '@/app/live-apps/crm-sanity/components/CrmSanityResult'
import { EmailCopyOptimizerResult } from '@/app/live-apps/email-copy-optimizer/components/EmailCopyOptimizerResult'
import { EmailFinderResult } from '@/app/live-apps/email-finder/components/EmailFinderResult'
import { FindPeopleResult } from '@/app/live-apps/find-people/components/FindPeopleResult'
import { GtmFlywheelResult } from '@/app/live-apps/gtm-flywheel/components/GtmFlywheelResult'
import { IntentSignalsResult } from '@/app/live-apps/intent-signals/components/IntentSignalsResult'
import { JobBriefResult } from '@/app/live-apps/job-brief/components/JobBriefResult'
import { LinkedinHookResult } from '@/app/live-apps/linkedin-hook/components/LinkedinHookResult'
import { LinkedinProfileReviewerResult } from '@/app/live-apps/linkedin-profile-reviewer/components/LinkedinProfileReviewerResult'
import { OutboundRadarResult } from '@/app/live-apps/outbound-radar/components/OutboundRadarResult'
import { PricingDiagnosticResult } from '@/app/live-apps/pricing-diagnostic/components/PricingDiagnosticResult'
import { ProposalEngineResult } from '@/app/live-apps/proposal-engine/components/ProposalEngineResult'
import { RoiCalculatorResult } from '@/app/live-apps/roi-calculator/components/RoiCalculatorResult'
import { ShareOfVoiceResult } from '@/app/live-apps/share-of-voice/components/ShareOfVoiceResult'
import { TechStackFinderResult } from '@/app/live-apps/tech-stack-finder/components/TechStackFinderResult'
import { TechStackRecommenderResult } from '@/app/live-apps/tech-stack-recommender/components/TechStackRecommenderResult'
import { WebsiteRoastResult } from '@/app/live-apps/website-roast/components/WebsiteRoastResult'

import { GenericJsonResult } from './GenericJsonResult'
import { UnknownMiniAppState } from './UnknownMiniAppState'

export function renderResultForMiniApp(
  slug: string,
  input: unknown,
  output: unknown
): ReactElement {
  // Each mini-app result component owns its own loose typing on input/output;
  // we narrow at the boundary via `as` since the DB payload is untyped JSON.
  // This is the single place we accept the JSONB → typed-component transition.
  switch (slug) {
    case 'agentic-readiness':
      return (
        <AgenticReadinessResult
          input={input as Parameters<typeof AgenticReadinessResult>[0]['input']}
          output={output as Parameters<typeof AgenticReadinessResult>[0]['output']}
        />
      )
    case 'ai-overview-tracker':
      return (
        <AiOverviewTrackerResult
          input={input as Parameters<typeof AiOverviewTrackerResult>[0]['input']}
          output={output as Parameters<typeof AiOverviewTrackerResult>[0]['output']}
        />
      )
    case 'ai-visibility-score':
      return (
        <AiVisibilityScoreResult
          input={input as Parameters<typeof AiVisibilityScoreResult>[0]['input']}
          output={output as Parameters<typeof AiVisibilityScoreResult>[0]['output']}
        />
      )
    case 'automation-blueprint':
      return (
        <AutomationBlueprintResult
          input={input as Parameters<typeof AutomationBlueprintResult>[0]['input']}
          output={output as Parameters<typeof AutomationBlueprintResult>[0]['output']}
        />
      )
    case 'bulk-email-finder':
      return (
        <BulkEmailFinderResult
          input={input as Parameters<typeof BulkEmailFinderResult>[0]['input']}
          output={output as Parameters<typeof BulkEmailFinderResult>[0]['output']}
        />
      )
    case 'campaign-ideation':
      return (
        <CampaignIdeationResult
          input={input as Parameters<typeof CampaignIdeationResult>[0]['input']}
          output={output as Parameters<typeof CampaignIdeationResult>[0]['output']}
        />
      )
    case 'crm-field-sanity-check':
    case 'crm-sanity':
      return (
        <CrmSanityResult
          input={input as Parameters<typeof CrmSanityResult>[0]['input']}
          output={output as Parameters<typeof CrmSanityResult>[0]['output']}
        />
      )
    case 'email-copy-optimizer':
      return (
        <EmailCopyOptimizerResult
          input={input as Parameters<typeof EmailCopyOptimizerResult>[0]['input']}
          output={output as Parameters<typeof EmailCopyOptimizerResult>[0]['output']}
        />
      )
    case 'email-finder':
      return (
        <EmailFinderResult
          input={input as Parameters<typeof EmailFinderResult>[0]['input']}
          output={output as Parameters<typeof EmailFinderResult>[0]['output']}
        />
      )
    case 'find-people':
      return (
        <FindPeopleResult
          input={input as Parameters<typeof FindPeopleResult>[0]['input']}
          output={output as Parameters<typeof FindPeopleResult>[0]['output']}
        />
      )
    case 'gtm-flywheel':
      return (
        <GtmFlywheelResult
          input={input as Parameters<typeof GtmFlywheelResult>[0]['input']}
          output={output as Parameters<typeof GtmFlywheelResult>[0]['output']}
        />
      )
    case 'intent-signals':
      return (
        <IntentSignalsResult
          input={input as Parameters<typeof IntentSignalsResult>[0]['input']}
          output={output as Parameters<typeof IntentSignalsResult>[0]['output']}
        />
      )
    case 'job-posting-sales-brief':
    case 'job-brief':
      return (
        <JobBriefResult
          input={input as Parameters<typeof JobBriefResult>[0]['input']}
          output={output as Parameters<typeof JobBriefResult>[0]['output']}
        />
      )
    case 'linkedin-post-outbound-hook':
    case 'linkedin-hook':
      return (
        <LinkedinHookResult
          input={input as Parameters<typeof LinkedinHookResult>[0]['input']}
          output={output as Parameters<typeof LinkedinHookResult>[0]['output']}
        />
      )
    case 'linkedin-profile-reviewer':
      return (
        <LinkedinProfileReviewerResult
          input={input as Parameters<typeof LinkedinProfileReviewerResult>[0]['input']}
          output={output as Parameters<typeof LinkedinProfileReviewerResult>[0]['output']}
        />
      )
    case 'outbound-trigger-radar':
    case 'outbound-radar':
      return (
        <OutboundRadarResult
          input={input as Parameters<typeof OutboundRadarResult>[0]['input']}
          output={output as Parameters<typeof OutboundRadarResult>[0]['output']}
        />
      )
    case 'pricing-diagnostic':
      return (
        <PricingDiagnosticResult
          input={input as Parameters<typeof PricingDiagnosticResult>[0]['input']}
          output={output as Parameters<typeof PricingDiagnosticResult>[0]['output']}
        />
      )
    case 'proposal-engine':
      return (
        <ProposalEngineResult
          input={input as Parameters<typeof ProposalEngineResult>[0]['input']}
          output={output as Parameters<typeof ProposalEngineResult>[0]['output']}
        />
      )
    case 'roi-calculator':
      return (
        <RoiCalculatorResult
          input={input as Parameters<typeof RoiCalculatorResult>[0]['input']}
          output={output as Parameters<typeof RoiCalculatorResult>[0]['output']}
        />
      )
    case 'share-of-voice':
      return (
        <ShareOfVoiceResult
          input={input as Parameters<typeof ShareOfVoiceResult>[0]['input']}
          output={output as Parameters<typeof ShareOfVoiceResult>[0]['output']}
        />
      )
    case 'tech-stack-finder':
      return (
        <TechStackFinderResult
          input={input as Parameters<typeof TechStackFinderResult>[0]['input']}
          output={output as Parameters<typeof TechStackFinderResult>[0]['output']}
        />
      )
    case 'tech-stack-recommender':
      return (
        <TechStackRecommenderResult
          input={input as Parameters<typeof TechStackRecommenderResult>[0]['input']}
          output={output as Parameters<typeof TechStackRecommenderResult>[0]['output']}
        />
      )
    case 'website-roast':
      return (
        <WebsiteRoastResult
          input={input as Parameters<typeof WebsiteRoastResult>[0]['input']}
          output={output as Parameters<typeof WebsiteRoastResult>[0]['output']}
        />
      )
    default:
      // For an unrecognised slug, prefer the explicit Unknown state over a
      // generic JSON dump. The GenericJsonResult helper stays available for
      // ad-hoc debugging if it's ever needed.
      void GenericJsonResult
      return <UnknownMiniAppState slug={slug} />
  }
}

/**
 * Canonical map from a submissions.mini_app_slug value (Supabase) to the
 * launch URL of the corresponding mini-app page in the app router. A few
 * slugs differ between the DB and the folder name (kept for historical
 * reasons), so this table is the single source of truth.
 */
export const SLUG_TO_LAUNCH_PATH: Record<string, string> = {
  'agentic-readiness': '/live-apps/agentic-readiness',
  'ai-overview-tracker': '/live-apps/ai-overview-tracker',
  'ai-visibility-score': '/live-apps/ai-visibility-score',
  'automation-blueprint': '/live-apps/automation-blueprint',
  'bulk-email-finder': '/live-apps/bulk-email-finder',
  'campaign-ideation': '/live-apps/campaign-ideation',
  'crm-field-sanity-check': '/live-apps/crm-sanity',
  'email-copy-optimizer': '/live-apps/email-copy-optimizer',
  'email-finder': '/live-apps/email-finder',
  'find-people': '/live-apps/find-people',
  'gtm-flywheel': '/live-apps/gtm-flywheel',
  'intent-signals': '/live-apps/intent-signals',
  'job-posting-sales-brief': '/live-apps/job-brief',
  'linkedin-post-outbound-hook': '/live-apps/linkedin-hook',
  'linkedin-profile-reviewer': '/live-apps/linkedin-profile-reviewer',
  'outbound-trigger-radar': '/live-apps/outbound-radar',
  'pricing-diagnostic': '/live-apps/pricing-diagnostic',
  'proposal-engine': '/live-apps/proposal-engine',
  'roi-calculator': '/live-apps/roi-calculator',
  'share-of-voice': '/live-apps/share-of-voice',
  'tech-stack-finder': '/live-apps/tech-stack-finder',
  'tech-stack-recommender': '/live-apps/tech-stack-recommender',
  'website-roast': '/live-apps/website-roast',
}

export function launchPathForSlug(slug: string): string {
  return SLUG_TO_LAUNCH_PATH[slug] ?? `/live-apps/${slug}`
}

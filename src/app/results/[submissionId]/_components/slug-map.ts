/**
 * Canonical map from a submissions.mini_app_slug value (Supabase) to the
 * launch URL of the corresponding mini-app page in the app router. A few
 * slugs differ between the DB and the folder name (kept for historical
 * reasons), so this table is the single source of truth.
 */
export const SLUG_TO_LAUNCH_PATH: Record<string, string> = {
  'agentic-readiness': '/mini-apps/agentic-readiness',
  'ai-overview-tracker': '/mini-apps/ai-overview-tracker',
  'ai-visibility-score': '/mini-apps/ai-visibility-score',
  'automation-blueprint': '/mini-apps/automation-blueprint',
  'bulk-email-finder': '/mini-apps/bulk-email-finder',
  'campaign-ideation': '/mini-apps/campaign-ideation',
  'crm-field-sanity-check': '/mini-apps/crm-sanity',
  'email-copy-optimizer': '/mini-apps/email-copy-optimizer',
  'email-finder': '/mini-apps/email-finder',
  'find-people': '/mini-apps/find-people',
  'gtm-flywheel': '/mini-apps/gtm-flywheel',
  'intent-signals': '/mini-apps/intent-signals',
  'job-posting-sales-brief': '/mini-apps/job-brief',
  'linkedin-post-outbound-hook': '/mini-apps/linkedin-hook',
  'linkedin-profile-reviewer': '/mini-apps/linkedin-profile-reviewer',
  'outbound-trigger-radar': '/mini-apps/outbound-radar',
  'pricing-diagnostic': '/mini-apps/pricing-diagnostic',
  'proposal-engine': '/mini-apps/proposal-engine',
  'roi-calculator': '/mini-apps/roi-calculator',
  'share-of-voice': '/mini-apps/share-of-voice',
  'tech-stack-finder': '/mini-apps/tech-stack-finder',
  'tech-stack-recommender': '/mini-apps/tech-stack-recommender',
  'website-roast': '/mini-apps/website-roast',
}

export function launchPathForSlug(slug: string): string {
  return SLUG_TO_LAUNCH_PATH[slug] ?? `/mini-apps/${slug}`
}

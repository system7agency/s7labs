/**
 * Helpers for the marketing-email unsubscribe flow.
 *
 * `buildUnsubscribeUrl` constructs the link that goes into every marketing
 * email footer. The token comes from `leads.unsubscribe_token` (unique, set
 * at insert via the table default). Tokens never expire.
 *
 * `shouldSendMarketing` is the single guard the SYS-545 n8n webhook caller
 * will consult before posting a marketing send. Transactional emails (such
 * as mini-app results) bypass this entirely.
 */

export function buildUnsubscribeUrl(unsubscribeToken: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://s7labs.ai'
  return `${baseUrl}/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`
}

type MarketingGateLead = {
  marketing_consent: boolean
  unsubscribed_at: string | null
}

// TODO(SYS-545): invoke this before posting to the n8n marketing webhook so
// unsubscribed or unconsented leads never receive marketing mail. Result
// emails (mini-app outputs) are transactional and must not call this.
export function shouldSendMarketing(lead: MarketingGateLead): boolean {
  if (lead.unsubscribed_at !== null) return false
  return lead.marketing_consent === true
}

import { N8N_WEBHOOKS_ENABLED } from '@/lib/integrations/n8n'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export type ShareOfVoiceLeadContext = {
  interest_context: 'share-of-voice'
  email: string
  your_domain: string
  category: string
  your_share: number
  top_competitor: string
}

export type AgenticReadinessLeadContext = {
  interest_context: 'agentic-readiness'
  email: string
  url: string
  site_name: string
  overall_score: number
  overall_grade: string
}

export type MiniAppLeadContext = ShareOfVoiceLeadContext | AgenticReadinessLeadContext

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim().toLowerCase())
}

/** Posts to the n8n lead webhook (same pipeline as revops sales-insights). */
export async function captureMiniAppLead(ctx: MiniAppLeadContext): Promise<boolean> {
  // Outbound n8n webhooks are disabled deployment-wide (no emails). Return a
  // no-op success so gated unlock flows still reveal their result — we simply
  // skip the n8n sync (and therefore the email it would have triggered).
  if (!N8N_WEBHOOKS_ENABLED) return true

  const webhookUrl =
    process.env.N8N_MINI_APPS_LEAD_WEBHOOK_URL ?? process.env.N8N_SALES_INSIGHTS_WEBHOOK_URL
  if (!webhookUrl) return false

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15_000)

  const body =
    ctx.interest_context === 'agentic-readiness'
      ? {
          email: ctx.email,
          type: ctx.interest_context,
          interest_context: ctx.interest_context,
          source: 'mini-apps',
          url: ctx.url,
          site_name: ctx.site_name,
          overall_score: ctx.overall_score,
          overall_grade: ctx.overall_grade,
        }
      : {
          email: ctx.email,
          type: ctx.interest_context,
          interest_context: ctx.interest_context,
          source: 'mini-apps',
          your_domain: ctx.your_domain,
          category: ctx.category,
          your_share: ctx.your_share,
          top_competitor: ctx.top_competitor,
        }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    })
    clearTimeout(timer)
    if (!res.ok) return false
    const payload = (await res.json()) as { ok?: unknown }
    return payload.ok !== false
  } catch {
    clearTimeout(timer)
    return false
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export type ShareOfVoiceLeadContext = {
  interest_context: 'share-of-voice'
  email: string
  your_domain: string
  category: string
  your_share: number
  top_competitor: string
}

export type AiOverviewTrackerLeadContext = {
  interest_context: 'ai-overview-tracker'
  email: string
  domain: string
  aio_trigger_rate: number
  citation_rate: number
  blind_spot_count: number
}

export type MiniAppLeadContext = ShareOfVoiceLeadContext | AiOverviewTrackerLeadContext

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim().toLowerCase())
}

/** Posts to the n8n lead webhook (same pipeline as revops sales-insights). */
export async function captureMiniAppLead(ctx: MiniAppLeadContext): Promise<boolean> {
  const webhookUrl =
    process.env.N8N_MINI_APPS_LEAD_WEBHOOK_URL ?? process.env.N8N_SALES_INSIGHTS_WEBHOOK_URL
  if (!webhookUrl) return false

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15_000)

  const body =
    ctx.interest_context === 'ai-overview-tracker'
      ? {
          email: ctx.email,
          type: ctx.interest_context,
          interest_context: ctx.interest_context,
          source: 'mini-apps',
          domain: ctx.domain,
          aio_trigger_rate: ctx.aio_trigger_rate,
          citation_rate: ctx.citation_rate,
          blind_spot_count: ctx.blind_spot_count,
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

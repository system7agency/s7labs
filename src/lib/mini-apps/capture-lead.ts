const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export type ShareOfVoiceLeadContext = {
  interest_context: 'share-of-voice'
  email: string
  your_domain: string
  category: string
  your_share: number
  top_competitor: string
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim().toLowerCase())
}

/** Posts to the n8n lead webhook (same pipeline as revops sales-insights). */
export async function captureMiniAppLead(ctx: ShareOfVoiceLeadContext): Promise<boolean> {
  const webhookUrl =
    process.env.N8N_MINI_APPS_LEAD_WEBHOOK_URL ?? process.env.N8N_SALES_INSIGHTS_WEBHOOK_URL
  if (!webhookUrl) return false

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15_000)

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ctx.email,
        type: ctx.interest_context,
        interest_context: ctx.interest_context,
        source: 'mini-apps',
        your_domain: ctx.your_domain,
        category: ctx.category,
        your_share: ctx.your_share,
        top_competitor: ctx.top_competitor,
      }),
      signal: controller.signal,
      cache: 'no-store',
    })
    clearTimeout(timer)
    if (!res.ok) return false
    const body = (await res.json()) as { ok?: unknown }
    return body.ok !== false
  } catch {
    clearTimeout(timer)
    return false
  }
}

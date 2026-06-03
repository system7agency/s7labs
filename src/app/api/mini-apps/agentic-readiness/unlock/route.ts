import { NextResponse } from 'next/server'
import { loadAgenticScan } from '@/lib/mini-apps/agentic-storage'
import type { ScanGated, UnlockApiResponse } from '@/lib/mini-apps/agentic-types'
import { captureMiniAppLead, isValidEmail } from '@/lib/mini-apps/capture-lead'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function jsonResponse(body: UnlockApiResponse, status: number) {
  return NextResponse.json(body, { status })
}

export async function POST(request: Request) {
  let payload: { scanId?: unknown; email?: unknown }
  try {
    payload = (await request.json()) as { scanId?: unknown; email?: unknown }
  } catch {
    return jsonResponse({ ok: false, message: 'Invalid request.' }, 422)
  }

  const scanId = typeof payload.scanId === 'string' ? payload.scanId.trim() : ''
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : ''

  if (!email || !isValidEmail(email)) {
    return jsonResponse({ ok: false, message: 'Enter a valid email.' }, 422)
  }

  if (!scanId) {
    return jsonResponse({ ok: false, message: 'This report expired. Run the check again.' }, 410)
  }

  const record = await loadAgenticScan(scanId)
  if (!record) {
    return jsonResponse({ ok: false, message: 'This report expired. Run the check again.' }, 410)
  }

  const leadCtx = {
    interest_context: 'agentic-readiness' as const,
    email,
    url: record.lead_context.url,
    site_name: record.lead_context.site_name,
    overall_score: record.lead_context.overall_score,
    overall_grade: record.lead_context.overall_grade,
  }

  const leadOk = await captureMiniAppLead(leadCtx)
  const hasWebhook =
    Boolean(process.env.N8N_MINI_APPS_LEAD_WEBHOOK_URL) ||
    Boolean(process.env.N8N_SALES_INSIGHTS_WEBHOOK_URL)

  if (!leadOk) {
    if (process.env.NODE_ENV === 'development' && !hasWebhook) {
      console.warn('[agentic-readiness] lead capture skipped (no webhook configured)', leadCtx)
    } else {
      return jsonResponse(
        { ok: false, message: 'Could not register your email. Please try again.' },
        502
      )
    }
  }

  const data: ScanGated = record.gated
  return jsonResponse({ ok: true, data }, 200)
}

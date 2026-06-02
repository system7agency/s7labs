import { NextResponse } from 'next/server'
import { loadAioScan } from '@/lib/mini-apps/aio-storage'
import type { ScanGated, UnlockApiResponse } from '@/lib/mini-apps/aio-types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function jsonResponse(body: UnlockApiResponse, status: number) {
  return NextResponse.json(body, { status })
}

export async function POST(request: Request) {
  let payload: { scanId?: unknown }
  try {
    payload = (await request.json()) as { scanId?: unknown }
  } catch {
    return jsonResponse({ ok: false, message: 'Invalid request.' }, 422)
  }

  const scanId = typeof payload.scanId === 'string' ? payload.scanId.trim() : ''

  if (!scanId) {
    return jsonResponse({ ok: false, message: 'This report expired. Run the check again.' }, 410)
  }

  const record = await loadAioScan(scanId)
  if (!record) {
    return jsonResponse({ ok: false, message: 'This report expired. Run the check again.' }, 410)
  }

  const data: ScanGated = record.gated
  return jsonResponse({ ok: true, data }, 200)
}

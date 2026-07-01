/**
 * GET a saved submission's result by id.
 *
 * Lets a mini-app page restore a past result from the database when opened with
 * `?result=<id>` (e.g. from the result email or a reload), so the page can
 * re-render its own report in its own design without re-running the scan.
 *
 * Returns the stored `output` only for completed submissions. Keyed by the
 * submission UUID (same access model as the result link in the email).
 */
import { NextResponse } from 'next/server'

import { getSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const { submissionId } = await params
  if (!submissionId || !UUID_RE.test(submissionId)) {
    return NextResponse.json({ ok: false, error: 'Invalid id' }, { status: 400 })
  }

  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('submissions')
    .select('id, mini_app_slug, status, output')
    .eq('id', submissionId)
    .maybeSingle()

  if (error) {
    console.error('[api/results GET] lookup error', submissionId.slice(0, 8))
    return NextResponse.json({ ok: false, error: 'Lookup failed' }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    status: data.status,
    slug: data.mini_app_slug,
    output: data.status === 'completed' ? data.output : null,
  })
}

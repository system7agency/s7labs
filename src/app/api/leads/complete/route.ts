import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  submissionId: z.string().uuid(),
  output: z.record(z.string(), z.unknown()),
})

function errorResponse(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function POST(request: Request) {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return errorResponse('Invalid JSON', 400)
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return errorResponse('Invalid input', 400)
  }

  const { submissionId, output } = parsed.data
  const supabase = getSupabaseServerClient()

  const { data: existing, error: lookupErr } = await supabase
    .from('submissions')
    .select('id, status')
    .eq('id', submissionId)
    .maybeSingle()

  if (lookupErr) {
    console.error('[leads/complete] lookup error', lookupErr)
    return errorResponse('Something went wrong', 500)
  }
  if (!existing) {
    return errorResponse('Submission not found', 400)
  }
  if (existing.status !== 'pending' && existing.status !== 'processing') {
    return errorResponse('Submission already finalized', 400)
  }

  const { error: updateErr } = await supabase
    .from('submissions')
    .update({
      output,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', submissionId)

  if (updateErr) {
    console.error('[leads/complete] update error', updateErr)
    return errorResponse('Something went wrong', 500)
  }

  return NextResponse.json({ ok: true })
}

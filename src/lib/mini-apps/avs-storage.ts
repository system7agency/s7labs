import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { AVSResult, AvsScanSnapshot, SubScore } from '@/lib/mini-apps/avs-types'

export async function saveAvsScan(
  id: string,
  domain: string,
  avs: number,
  subScores: SubScore[],
  payload: AVSResult
): Promise<void> {
  const admin = getSupabaseAdmin()
  if (!admin) {
    console.warn('[avs] Supabase admin unavailable — scan not persisted')
    return
  }
  const { error } = await admin.from('avs_scans').insert({
    id,
    domain,
    avs,
    sub_scores: subScores,
    payload,
    created_at: new Date().toISOString(),
  })
  if (error) console.error('[avs] Supabase insert failed:', error.message)
}

export async function loadLatestAvsScan(domain: string): Promise<AvsScanSnapshot | null> {
  const admin = getSupabaseAdmin()
  if (!admin) return null
  const { data, error } = await admin
    .from('avs_scans')
    .select('domain, avs, sub_scores, payload, created_at')
    .eq('domain', domain)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return {
    domain: data.domain as string,
    avs: data.avs as number,
    sub_scores: data.sub_scores as SubScore[],
    payload: data.payload as AVSResult,
    created_at: data.created_at as string,
  }
}

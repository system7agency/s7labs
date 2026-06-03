import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { ScanGated } from '@/lib/mini-apps/aio-types'

const TTL_MS = 30 * 60 * 1000

export type AioScanRecord = {
  domain: string
  gated: ScanGated
  lead_context: {
    domain: string
    aio_trigger_rate: number
    citation_rate: number
    blind_spot_count: number
  }
  expires_at: string
}

type MemoryEntry = { record: AioScanRecord; expiresAt: number }

const memoryStore = new Map<string, MemoryEntry>()

function pruneMemory() {
  const now = Date.now()
  for (const [id, entry] of memoryStore) {
    if (entry.expiresAt <= now) memoryStore.delete(id)
  }
}

export async function saveAioScan(id: string, record: AioScanRecord): Promise<void> {
  const admin = getSupabaseAdmin()
  if (admin) {
    const { error } = await admin.from('aio_scans').insert({
      id,
      domain: record.domain,
      payload: record,
      created_at: new Date().toISOString(),
    })
    if (!error) return
    console.error('[aio] Supabase insert failed, falling back to memory:', error.message)
  }

  pruneMemory()
  memoryStore.set(id, { record, expiresAt: Date.now() + TTL_MS })
}

export async function loadAioScan(id: string): Promise<AioScanRecord | null> {
  const admin = getSupabaseAdmin()
  if (admin) {
    const { data, error } = await admin
      .from('aio_scans')
      .select('payload, created_at')
      .eq('id', id)
      .maybeSingle()
    if (!error && data?.payload) {
      const record = data.payload as AioScanRecord
      const created = new Date(data.created_at as string).getTime()
      if (Date.now() - created > TTL_MS) return null
      return record
    }
  }

  pruneMemory()
  const entry = memoryStore.get(id)
  if (!entry || entry.expiresAt <= Date.now()) {
    memoryStore.delete(id)
    return null
  }
  return entry.record
}

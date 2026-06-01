import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { ScanGated } from '@/lib/mini-apps/sov-types'

const TTL_MS = 30 * 60 * 1000

export type SovScanRecord = {
  gated: ScanGated
  lead_context: {
    your_domain: string
    category: string
    your_share: number
    top_competitor: string
  }
  expires_at: string
}

type MemoryEntry = { record: SovScanRecord; expiresAt: number }

const memoryStore = new Map<string, MemoryEntry>()

function pruneMemory() {
  const now = Date.now()
  for (const [id, entry] of memoryStore) {
    if (entry.expiresAt <= now) memoryStore.delete(id)
  }
}

export async function saveSovScan(id: string, record: SovScanRecord): Promise<void> {
  const admin = getSupabaseAdmin()
  if (admin) {
    const { error } = await admin.from('sov_scans').insert({
      id,
      payload: record,
      created_at: new Date().toISOString(),
    })
    if (!error) return
    console.error('[sov] Supabase insert failed, falling back to memory:', error.message)
  }

  pruneMemory()
  memoryStore.set(id, { record, expiresAt: Date.now() + TTL_MS })
}

export async function loadSovScan(id: string): Promise<SovScanRecord | null> {
  const admin = getSupabaseAdmin()
  if (admin) {
    const { data, error } = await admin
      .from('sov_scans')
      .select('payload, created_at')
      .eq('id', id)
      .maybeSingle()
    if (!error && data?.payload) {
      const record = data.payload as SovScanRecord
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

import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { ScanGated } from '@/lib/mini-apps/agentic-types'

const TTL_MS = 30 * 60 * 1000

export type AgenticScanRecord = {
  gated: ScanGated
  lead_context: {
    url: string
    site_name: string
    overall_score: number
    overall_grade: string
  }
  expires_at: string
}

type MemoryEntry = { record: AgenticScanRecord; expiresAt: number }

const memoryStore = new Map<string, MemoryEntry>()

function pruneMemory() {
  const now = Date.now()
  for (const [id, entry] of memoryStore) {
    if (entry.expiresAt <= now) memoryStore.delete(id)
  }
}

export async function saveAgenticScan(id: string, record: AgenticScanRecord): Promise<void> {
  const admin = getSupabaseAdmin()
  if (admin) {
    const { error } = await admin.from('agentic_scans').insert({
      id,
      payload: record,
      created_at: new Date().toISOString(),
    })
    if (!error) return
    console.error('[agentic] Supabase insert failed, falling back to memory:', error.message)
  }

  pruneMemory()
  memoryStore.set(id, { record, expiresAt: Date.now() + TTL_MS })
}

export async function loadAgenticScan(id: string): Promise<AgenticScanRecord | null> {
  const admin = getSupabaseAdmin()
  if (admin) {
    const { data, error } = await admin
      .from('agentic_scans')
      .select('payload, created_at')
      .eq('id', id)
      .maybeSingle()
    if (!error && data?.payload) {
      const record = data.payload as AgenticScanRecord
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

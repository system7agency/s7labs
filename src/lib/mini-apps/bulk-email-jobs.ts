import { getSupabaseAdmin } from '@/lib/supabase/admin'

const TTL_MS = 24 * 60 * 60 * 1000

export type BulkEmailJobStatus = 'processing' | 'completed' | 'failed'

export type BulkEmailJobResult = {
  row: number
  firstName: string
  lastName: string
  company: string
  email: string | null
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | null
  title: string | null
  linkedinUrl: string | null
  companyDomain: string
  companyName: string
  source: 'Apollo'
  verifiedAt: string | null
  status: 'found' | 'not_found' | 'error'
  error?: string
}

export type BulkEmailJobRecord = {
  id: string
  status: BulkEmailJobStatus
  total: number
  completed: number
  results: BulkEmailJobResult[]
  created_at: string
}

type MemoryEntry = { record: BulkEmailJobRecord; expiresAt: number }

const memoryStore = new Map<string, MemoryEntry>()

function isExpired(createdAt: string): boolean {
  const created = new Date(createdAt).getTime()
  if (Number.isNaN(created)) return true
  return Date.now() - created > TTL_MS
}

function pruneMemoryStore() {
  const now = Date.now()
  for (const [id, entry] of memoryStore) {
    if (entry.expiresAt <= now || isExpired(entry.record.created_at)) {
      memoryStore.delete(id)
    }
  }
}

export async function purgeExpiredBulkEmailJobs(): Promise<void> {
  const admin = getSupabaseAdmin()
  if (admin) {
    const threshold = new Date(Date.now() - TTL_MS).toISOString()
    const { error } = await admin.from('bulk_email_jobs').delete().lt('created_at', threshold)
    if (error) console.error('[bulk-email-jobs] purge failed:', error.message)
  }
  pruneMemoryStore()
}

export async function createBulkEmailJob(input: {
  id: string
  total: number
  completed?: number
  status?: BulkEmailJobStatus
  results?: BulkEmailJobResult[]
}): Promise<BulkEmailJobRecord> {
  const record: BulkEmailJobRecord = {
    id: input.id,
    status: input.status ?? 'processing',
    total: input.total,
    completed: input.completed ?? 0,
    results: input.results ?? [],
    created_at: new Date().toISOString(),
  }

  await purgeExpiredBulkEmailJobs()

  const admin = getSupabaseAdmin()
  if (admin) {
    const { error } = await admin.from('bulk_email_jobs').insert(record)
    if (!error) return record
    console.error('[bulk-email-jobs] insert failed, falling back to memory:', error.message)
  }

  memoryStore.set(record.id, { record, expiresAt: Date.now() + TTL_MS })
  return record
}

export async function loadBulkEmailJob(jobId: string): Promise<BulkEmailJobRecord | null> {
  await purgeExpiredBulkEmailJobs()

  const admin = getSupabaseAdmin()
  if (admin) {
    const { data, error } = await admin
      .from('bulk_email_jobs')
      .select('id, status, total, completed, results, created_at')
      .eq('id', jobId)
      .maybeSingle()

    if (!error && data) {
      const record = data as BulkEmailJobRecord
      if (isExpired(record.created_at)) {
        await admin.from('bulk_email_jobs').delete().eq('id', jobId)
        return null
      }
      return record
    }
  }

  const entry = memoryStore.get(jobId)
  if (!entry) return null
  if (entry.expiresAt <= Date.now() || isExpired(entry.record.created_at)) {
    memoryStore.delete(jobId)
    return null
  }
  return entry.record
}

export async function updateBulkEmailJob(
  jobId: string,
  patch: {
    status?: BulkEmailJobStatus
    completed?: number
    results?: BulkEmailJobResult[]
  }
): Promise<void> {
  await purgeExpiredBulkEmailJobs()

  const admin = getSupabaseAdmin()
  if (admin) {
    const { error } = await admin.from('bulk_email_jobs').update(patch).eq('id', jobId)
    if (!error) return
    console.error('[bulk-email-jobs] update failed, falling back to memory:', error.message)
  }

  const entry = memoryStore.get(jobId)
  if (!entry) return
  entry.record = {
    ...entry.record,
    ...patch,
    results: patch.results ?? entry.record.results,
    completed: patch.completed ?? entry.record.completed,
    status: patch.status ?? entry.record.status,
  }
}

import 'server-only'

// Insights queries are NOT cached — the dashboard is admin-only and low-traffic,
// so we'd rather pay the DB round-trip on every render than show stale rows.
// Shim mirrors unstable_cache's call shape so the existing structure stays.
function noCache<T>(
  fn: () => Promise<T>,
  _keyParts?: ReadonlyArray<string>,
  _opts?: { revalidate?: number; tags?: string[] }
): () => Promise<T> {
  return fn
}
const unstable_cache = noCache

import { getSupabaseServerClient } from '@/lib/supabase/server'

import { type DateRange, getRangeBounds, listDaysInRange, toYmd } from './date-ranges'

// ----- shared types -----

export type MetricDelta = {
  current: number
  previous: number
  deltaPercent: number
}

export type ConversionMetric = {
  currentPercent: number
  previousPercent: number
  deltaPoints: number
}

export type DailySpendPoint = { date: string; costUsd: number }

export type MiniAppSpend = {
  miniAppSlug: string
  miniAppName: string
  costUsd: number
  submissionCount: number
}

// Display status. Adds `abandoned` (derived) for pending rows that never
// completed within a reasonable window — most often the user closed the
// tab between leads/submit and leads/complete, or the model call failed.
export type DisplayStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'abandoned'

const ABANDONED_AFTER_MS = 5 * 60 * 1000

function deriveDisplayStatus(
  raw: 'pending' | 'processing' | 'completed' | 'failed',
  createdAt: string
): DisplayStatus {
  if (raw !== 'pending') return raw
  const ageMs = Date.now() - new Date(createdAt).getTime()
  return ageMs > ABANDONED_AFTER_MS ? 'abandoned' : 'pending'
}

export type ActivityRow = {
  id: string
  miniAppSlug: string
  miniAppName: string
  email: string
  costUsd: number | null
  status: DisplayStatus
  createdAt: string
}

// ----- low-level fetch (shared) -----

type SubmissionRow = {
  id: string
  lead_id: string | null
  email: string | null
  mini_app_slug: string
  cost_usd: number | string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
}

async function fetchSubmissions(
  start: string | null,
  end: string | null
): Promise<SubmissionRow[]> {
  const supabase = getSupabaseServerClient()
  let q = supabase
    .from('submissions')
    .select('id, lead_id, email, mini_app_slug, cost_usd, status, created_at')
    .order('created_at', { ascending: false })
  if (start) q = q.gte('created_at', start)
  if (end) q = q.lt('created_at', end)
  const { data, error } = await q
  if (error) throw new Error(`fetchSubmissions: ${error.message}`)
  return (data ?? []) as SubmissionRow[]
}

function asNumber(v: number | string | null | undefined): number {
  if (v == null) return 0
  if (typeof v === 'number') return v
  const n = Number.parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

function pctDelta(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100
  return ((current - previous) / previous) * 100
}

// ----- public queries (each wrapped in unstable_cache) -----

export const getTotalSpend = (range: DateRange) =>
  unstable_cache(
    async (): Promise<MetricDelta> => {
      const { currentStart, currentEnd, prevStart, prevEnd } = getRangeBounds(range)
      const [curRows, prevRows] = await Promise.all([
        fetchSubmissions(currentStart, currentEnd),
        prevStart ? fetchSubmissions(prevStart, prevEnd) : Promise.resolve([] as SubmissionRow[]),
      ])
      const current = curRows.reduce((acc, r) => acc + asNumber(r.cost_usd), 0)
      const previous = prevRows.reduce((acc, r) => acc + asNumber(r.cost_usd), 0)
      return { current, previous, deltaPercent: pctDelta(current, previous) }
    },
    ['insights:total-spend', range],
    { revalidate: 30, tags: ['insights'] }
  )()

export const getTotalLeads = (range: DateRange) =>
  unstable_cache(
    async (): Promise<MetricDelta> => {
      const { currentStart, currentEnd, prevStart, prevEnd } = getRangeBounds(range)
      const [curRows, prevRows] = await Promise.all([
        fetchSubmissions(currentStart, currentEnd),
        prevStart ? fetchSubmissions(prevStart, prevEnd) : Promise.resolve([] as SubmissionRow[]),
      ])
      const current = new Set(curRows.map((r) => r.lead_id).filter((id): id is string => !!id)).size
      const previous = new Set(prevRows.map((r) => r.lead_id).filter((id): id is string => !!id))
        .size
      return { current, previous, deltaPercent: pctDelta(current, previous) }
    },
    ['insights:total-leads', range],
    { revalidate: 30, tags: ['insights'] }
  )()

export const getTotalSubmissions = (range: DateRange) =>
  unstable_cache(
    async (): Promise<MetricDelta> => {
      const { currentStart, currentEnd, prevStart, prevEnd } = getRangeBounds(range)
      const [curRows, prevRows] = await Promise.all([
        fetchSubmissions(currentStart, currentEnd),
        prevStart ? fetchSubmissions(prevStart, prevEnd) : Promise.resolve([] as SubmissionRow[]),
      ])
      const current = curRows.length
      const previous = prevRows.length
      return { current, previous, deltaPercent: pctDelta(current, previous) }
    },
    ['insights:total-submissions', range],
    { revalidate: 30, tags: ['insights'] }
  )()

export const getConversionRate = (range: DateRange) =>
  unstable_cache(
    async (): Promise<ConversionMetric> => {
      const { currentStart, currentEnd, prevStart, prevEnd } = getRangeBounds(range)
      const [curRows, prevRows] = await Promise.all([
        fetchSubmissions(currentStart, currentEnd),
        prevStart ? fetchSubmissions(prevStart, prevEnd) : Promise.resolve([] as SubmissionRow[]),
      ])
      const pct = (rows: SubmissionRow[]) => {
        if (rows.length === 0) return 0
        const completed = rows.filter((r) => r.status === 'completed').length
        return (completed / rows.length) * 100
      }
      const currentPercent = pct(curRows)
      const previousPercent = pct(prevRows)
      return {
        currentPercent,
        previousPercent,
        deltaPoints: currentPercent - previousPercent,
      }
    },
    ['insights:conversion-rate', range],
    { revalidate: 30, tags: ['insights'] }
  )()

export const getDailySpend = (range: DateRange) =>
  unstable_cache(
    async (): Promise<DailySpendPoint[]> => {
      const { currentStart, currentEnd } = getRangeBounds(range)
      const rows = await fetchSubmissions(currentStart, currentEnd)
      const byDay = new Map<string, number>()
      for (const r of rows) {
        const day = toYmd(new Date(r.created_at))
        byDay.set(day, (byDay.get(day) ?? 0) + asNumber(r.cost_usd))
      }
      // For bounded ranges, fill missing days with 0 for a continuous chart.
      // For 'all', return only the days that actually have data, sorted asc.
      if (range === 'all') {
        return [...byDay.entries()]
          .map(([date, costUsd]) => ({ date, costUsd }))
          .sort((a, b) => (a.date < b.date ? -1 : 1))
      }
      return listDaysInRange(range).map((date) => ({
        date,
        costUsd: byDay.get(date) ?? 0,
      }))
    },
    ['insights:daily-spend', range],
    { revalidate: 30, tags: ['insights'] }
  )()

export const getSpendByMiniApp = (range: DateRange) =>
  unstable_cache(
    async (): Promise<MiniAppSpend[]> => {
      const supabase = getSupabaseServerClient()
      const { currentStart, currentEnd } = getRangeBounds(range)
      const rows = await fetchSubmissions(currentStart, currentEnd)

      const acc = new Map<string, { costUsd: number; submissionCount: number }>()
      for (const r of rows) {
        const cur = acc.get(r.mini_app_slug) ?? { costUsd: 0, submissionCount: 0 }
        cur.costUsd += asNumber(r.cost_usd)
        cur.submissionCount += 1
        acc.set(r.mini_app_slug, cur)
      }

      // Lookup mini-app display names in one query.
      const slugs = [...acc.keys()]
      const names = new Map<string, string>()
      if (slugs.length > 0) {
        const { data } = await supabase.from('mini_apps').select('slug, name').in('slug', slugs)
        for (const row of (data ?? []) as Array<{ slug: string; name: string }>) {
          names.set(row.slug, row.name)
        }
      }

      return [...acc.entries()]
        .map(([slug, v]) => ({
          miniAppSlug: slug,
          miniAppName: names.get(slug) ?? slug,
          costUsd: v.costUsd,
          submissionCount: v.submissionCount,
        }))
        .sort((a, b) => b.costUsd - a.costUsd || b.submissionCount - a.submissionCount)
    },
    ['insights:spend-by-mini-app', range],
    { revalidate: 30, tags: ['insights'] }
  )()

// ----- list views (Submissions / Leads pages) -----

export type SubmissionListRow = {
  id: string
  miniAppSlug: string
  miniAppName: string
  email: string
  modelUsed: string | null
  costUsd: number | null
  status: DisplayStatus
  createdAt: string
}

export type SubmissionsSortBy = 'createdAt' | 'cost' | 'miniApp' | 'email' | 'status'
export type SortDir = 'asc' | 'desc'

const SUBMISSIONS_SORT_COLUMN: Record<SubmissionsSortBy, string> = {
  createdAt: 'created_at',
  cost: 'cost_usd',
  miniApp: 'mini_app_slug',
  email: 'email',
  status: 'status',
}

export type SubmissionsQueryParams = {
  page: number
  pageSize: number
  search?: string
  sortBy?: SubmissionsSortBy
  sortDir?: SortDir
}
export type SubmissionsQueryResult = {
  rows: SubmissionListRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const MAX_PAGE_SIZE = 100

function clampPageSize(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 25
  return Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(n)))
}
function clampPage(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 1
  return Math.max(1, Math.floor(n))
}

export const getSubmissionsList = async (
  params: SubmissionsQueryParams
): Promise<SubmissionsQueryResult> => {
  const supabase = getSupabaseServerClient()
  const pageSize = clampPageSize(params.pageSize)
  const page = clampPage(params.page)
  const sortBy: SubmissionsSortBy = params.sortBy ?? 'createdAt'
  const sortDir: SortDir = params.sortDir === 'asc' ? 'asc' : 'desc'
  const search = (params.search ?? '').trim()

  let q = supabase
    .from('submissions')
    .select('id, mini_app_slug, email, model_used, cost_usd, status, created_at', {
      count: 'exact',
    })

  if (search.length > 0) {
    // Escape % and _ to keep them literal, then wildcard wrap.
    const safe = search.replace(/[%_]/g, (m) => `\\${m}`)
    const pattern = `%${safe}%`
    q = q.or(`email.ilike.${pattern},mini_app_slug.ilike.${pattern}`)
  }

  q = q.order(SUBMISSIONS_SORT_COLUMN[sortBy], { ascending: sortDir === 'asc' })
  if (sortBy !== 'createdAt') {
    // Stable tiebreak so paginated rows are deterministic.
    q = q.order('created_at', { ascending: false })
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  q = q.range(from, to)

  const { data, error, count } = await q
  if (error) throw new Error(`getSubmissionsList: ${error.message}`)

  const rows = (data ?? []) as Array<{
    id: string
    mini_app_slug: string
    email: string | null
    model_used: string | null
    cost_usd: number | string | null
    status: 'pending' | 'processing' | 'completed' | 'failed'
    created_at: string
  }>

  const slugs = [...new Set(rows.map((r) => r.mini_app_slug))]
  const names = new Map<string, string>()
  if (slugs.length > 0) {
    const { data: nameRows } = await supabase
      .from('mini_apps')
      .select('slug, name')
      .in('slug', slugs)
    for (const row of (nameRows ?? []) as Array<{ slug: string; name: string }>) {
      names.set(row.slug, row.name)
    }
  }

  const mapped: SubmissionListRow[] = rows.map((r) => ({
    id: r.id,
    miniAppSlug: r.mini_app_slug,
    miniAppName: names.get(r.mini_app_slug) ?? r.mini_app_slug,
    email: r.email ?? '—',
    modelUsed: r.model_used,
    costUsd: r.cost_usd == null ? null : asNumber(r.cost_usd),
    status: deriveDisplayStatus(r.status, r.created_at),
    createdAt: r.created_at,
  }))

  const total = count ?? mapped.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return { rows: mapped, total, page, pageSize, totalPages }
}

export type LeadListRow = {
  id: string
  email: string
  firstSource: string | null
  submissionCount: number
  totalCostUsd: number
  firstSeenAt: string
  lastSeenAt: string
}

export type LeadsSortBy =
  | 'email'
  | 'firstSource'
  | 'submissionCount'
  | 'totalCost'
  | 'firstSeenAt'
  | 'lastSeenAt'

// Sortable columns that map directly to base-table columns. The aggregate
// columns (submissionCount, totalCost) sort the in-memory leads list rather
// than the base query — see below.
const LEADS_BASE_SORT_COLUMN: Partial<Record<LeadsSortBy, string>> = {
  email: 'email',
  firstSource: 'first_source',
  firstSeenAt: 'first_seen_at',
  lastSeenAt: 'last_seen_at',
}

export type LeadsQueryParams = {
  page: number
  pageSize: number
  search?: string
  sortBy?: LeadsSortBy
  sortDir?: SortDir
}
export type LeadsQueryResult = {
  rows: LeadListRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const getLeadsList = async (params: LeadsQueryParams): Promise<LeadsQueryResult> => {
  const supabase = getSupabaseServerClient()
  const pageSize = clampPageSize(params.pageSize)
  const page = clampPage(params.page)
  const sortBy: LeadsSortBy = params.sortBy ?? 'lastSeenAt'
  const sortDir: SortDir = params.sortDir === 'asc' ? 'asc' : 'desc'
  const search = (params.search ?? '').trim()

  let q = supabase
    .from('leads')
    .select('id, email, first_source, first_seen_at, last_seen_at', { count: 'exact' })

  if (search.length > 0) {
    const safe = search.replace(/[%_]/g, (m) => `\\${m}`)
    q = q.ilike('email', `%${safe}%`)
  }

  // For non-aggregate sorts, push order to the DB and paginate there.
  // For aggregate sorts (submissionCount, totalCost) we order by last_seen_at
  // at the DB layer (so the page is at least deterministic), fetch the page,
  // then re-sort that page in memory by the aggregate value.
  const baseSortCol = LEADS_BASE_SORT_COLUMN[sortBy] ?? 'last_seen_at'
  const baseAscending = LEADS_BASE_SORT_COLUMN[sortBy] ? sortDir === 'asc' : false
  q = q.order(baseSortCol, { ascending: baseAscending })
  if (baseSortCol !== 'last_seen_at') {
    q = q.order('last_seen_at', { ascending: false })
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  q = q.range(from, to)

  const { data: leads, error, count } = await q
  if (error) throw new Error(`getLeadsList: ${error.message}`)
  const leadRows = (leads ?? []) as Array<{
    id: string
    email: string | null
    first_source: string | null
    first_seen_at: string
    last_seen_at: string
  }>

  const total = count ?? leadRows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  if (leadRows.length === 0) {
    return { rows: [], total, page, pageSize, totalPages }
  }

  // Aggregate submissions for the visible page of leads only.
  const leadIds = leadRows.map((l) => l.id)
  const { data: subs, error: subsErr } = await supabase
    .from('submissions')
    .select('lead_id, cost_usd')
    .in('lead_id', leadIds)
  if (subsErr) throw new Error(`getLeadsList(subs): ${subsErr.message}`)

  const stats = new Map<string, { count: number; cost: number }>()
  for (const s of (subs ?? []) as Array<{
    lead_id: string
    cost_usd: number | string | null
  }>) {
    const prev = stats.get(s.lead_id) ?? { count: 0, cost: 0 }
    prev.count += 1
    prev.cost += asNumber(s.cost_usd)
    stats.set(s.lead_id, prev)
  }

  let mapped: LeadListRow[] = leadRows.map((l) => {
    const s = stats.get(l.id) ?? { count: 0, cost: 0 }
    return {
      id: l.id,
      email: l.email ?? '—',
      firstSource: l.first_source,
      submissionCount: s.count,
      totalCostUsd: s.cost,
      firstSeenAt: l.first_seen_at,
      lastSeenAt: l.last_seen_at,
    }
  })

  if (sortBy === 'submissionCount' || sortBy === 'totalCost') {
    const dir = sortDir === 'asc' ? 1 : -1
    mapped = [...mapped].sort((a, b) => {
      const av = sortBy === 'submissionCount' ? a.submissionCount : a.totalCostUsd
      const bv = sortBy === 'submissionCount' ? b.submissionCount : b.totalCostUsd
      return (av - bv) * dir
    })
  }

  return { rows: mapped, total, page, pageSize, totalPages }
}

export const getRecentActivity = (limit = 10) =>
  unstable_cache(
    async (): Promise<ActivityRow[]> => {
      const supabase = getSupabaseServerClient()
      const { data, error } = await supabase
        .from('submissions')
        .select('id, mini_app_slug, email, cost_usd, status, created_at')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw new Error(`getRecentActivity: ${error.message}`)
      const rows = (data ?? []) as Array<{
        id: string
        mini_app_slug: string
        email: string | null
        cost_usd: number | string | null
        status: 'pending' | 'processing' | 'completed' | 'failed'
        created_at: string
      }>

      const slugs = [...new Set(rows.map((r) => r.mini_app_slug))]
      const names = new Map<string, string>()
      if (slugs.length > 0) {
        const { data: nameRows } = await supabase
          .from('mini_apps')
          .select('slug, name')
          .in('slug', slugs)
        for (const row of (nameRows ?? []) as Array<{ slug: string; name: string }>) {
          names.set(row.slug, row.name)
        }
      }

      return rows.map((r) => ({
        id: r.id,
        miniAppSlug: r.mini_app_slug,
        miniAppName: names.get(r.mini_app_slug) ?? r.mini_app_slug,
        email: r.email ?? '—',
        costUsd: r.cost_usd == null ? null : asNumber(r.cost_usd),
        status: deriveDisplayStatus(r.status, r.created_at),
        createdAt: r.created_at,
      }))
    },
    ['insights:recent-activity', String(limit)],
    { revalidate: 30, tags: ['insights'] }
  )()

import 'server-only'

import { unstable_cache } from 'next/cache'

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

export type ActivityRow = {
  id: string
  miniAppSlug: string
  miniAppName: string
  email: string
  costUsd: number | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
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
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
}

export const getSubmissionsList = (limit = 50) =>
  unstable_cache(
    async (): Promise<SubmissionListRow[]> => {
      const supabase = getSupabaseServerClient()
      const { data, error } = await supabase
        .from('submissions')
        .select('id, mini_app_slug, email, model_used, cost_usd, status, created_at')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw new Error(`getSubmissionsList: ${error.message}`)

      const rows = (data ?? []) as Array<{
        id: string
        mini_app_slug: string
        email: string | null
        model_used: string | null
        cost_usd: number | string | null
        status: SubmissionListRow['status']
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
        modelUsed: r.model_used,
        costUsd: r.cost_usd == null ? null : asNumber(r.cost_usd),
        status: r.status,
        createdAt: r.created_at,
      }))
    },
    ['insights:submissions-list', String(limit)],
    { revalidate: 30, tags: ['insights'] }
  )()

export type LeadListRow = {
  id: string
  email: string
  firstSource: string | null
  submissionCount: number
  totalCostUsd: number
  firstSeenAt: string
  lastSeenAt: string
}

export const getLeadsList = (limit = 50) =>
  unstable_cache(
    async (): Promise<LeadListRow[]> => {
      const supabase = getSupabaseServerClient()
      const { data: leads, error } = await supabase
        .from('leads')
        .select('id, email, first_source, first_seen_at, last_seen_at')
        .order('last_seen_at', { ascending: false })
        .limit(limit)
      if (error) throw new Error(`getLeadsList: ${error.message}`)
      const leadRows = (leads ?? []) as Array<{
        id: string
        email: string | null
        first_source: string | null
        first_seen_at: string
        last_seen_at: string
      }>
      if (leadRows.length === 0) return []

      // Aggregate submissions per lead.
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

      return leadRows.map((l) => {
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
    },
    ['insights:leads-list', String(limit)],
    { revalidate: 30, tags: ['insights'] }
  )()

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
        status: ActivityRow['status']
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
        status: r.status,
        createdAt: r.created_at,
      }))
    },
    ['insights:recent-activity', String(limit)],
    { revalidate: 30, tags: ['insights'] }
  )()

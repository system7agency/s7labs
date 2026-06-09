import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'

import { getSupabaseServerClient } from '@/lib/supabase/server'

import { ExpiredState } from './_components/ExpiredState'
import { FailedState } from './_components/FailedState'
import { PendingState } from './_components/PendingState'
import { ResultLayout } from './_components/ResultLayout'
import { dispatchInternal } from './_components/dispatch-internal'
import { ageInDays, RESULT_EXPIRY_DAYS } from './_components/format-time'
import { launchPathForSlug } from './_components/slug-map'

export const runtime = 'nodejs'

export const metadata = {
  title: 'Result · S7 Labs',
  description: 'Your mini-app result.',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type MiniAppMeta = { name: string; description: string | null; category: string | null }

type SubmissionRow = {
  id: string
  mini_app_slug: string
  status: string
  input: unknown
  output: unknown
  created_at: string
  completed_at: string | null
  mini_apps: MiniAppMeta | MiniAppMeta[] | null
}

async function fetchSubmissionUncached(id: string): Promise<SubmissionRow | null> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('submissions')
    .select(
      `id, mini_app_slug, status, input, output, created_at, completed_at,
       mini_apps:mini_app_slug ( name, description, category )`
    )
    .eq('id', id)
    .maybeSingle()
  if (error) {
    // Log only the first 8 chars of the id, never the full UUID.
    console.error('[results page] supabase error', id.slice(0, 8), error.message)
    return null
  }
  return (data as SubmissionRow | null) ?? null
}

/**
 * Cached lookup. Used only for terminal statuses (completed / failed). Pending
 * statuses bypass the cache so the user sees fresh data when they refresh.
 */
const fetchSubmissionCached = (id: string) =>
  unstable_cache(() => fetchSubmissionUncached(id), ['submission', id], {
    revalidate: 60,
    tags: [`submission:${id}`],
  })()

function pickMeta(row: SubmissionRow): MiniAppMeta | null {
  const m = row.mini_apps
  if (!m) return null
  if (Array.isArray(m)) return m[0] ?? null
  return m
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ submissionId: string }>
}) {
  const { submissionId } = await params

  if (!submissionId || !UUID_RE.test(submissionId)) {
    notFound()
  }

  // First pass: uncached read so we can decide whether to cache going forward.
  const initial = await fetchSubmissionUncached(submissionId)
  if (!initial) {
    notFound()
  }

  // Pending / processing — never cache.
  if (initial.status === 'pending' || initial.status === 'processing') {
    const meta = pickMeta(initial)
    return <PendingState miniAppName={meta?.name} />
  }

  // From here on, the row is terminal. Re-read through the cache so subsequent
  // requests for the same id within the revalidate window don't hit the DB.
  const row = (await fetchSubmissionCached(submissionId)) ?? initial
  const meta = pickMeta(row)
  const miniAppName = meta?.name ?? row.mini_app_slug
  const runAgainHref = launchPathForSlug(row.mini_app_slug)

  if (row.status === 'failed') {
    return <FailedState runAgainHref={runAgainHref} miniAppName={miniAppName} />
  }

  const age = ageInDays(row.created_at)
  if (age >= RESULT_EXPIRY_DAYS) {
    return <ExpiredState runAgainHref={runAgainHref} miniAppName={miniAppName} />
  }

  return (
    <ResultLayout
      slug={row.mini_app_slug}
      miniAppName={miniAppName}
      createdAt={row.created_at}
      runAgainHref={runAgainHref}
      runAgainLabel={miniAppName}
    >
      {dispatchInternal(row.mini_app_slug, row.input, row.output)}
    </ResultLayout>
  )
}

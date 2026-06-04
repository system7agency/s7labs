import { redirect } from 'next/navigation'

import { ActivityFeed } from '@/components/insights/ActivityFeed'
import { DailySpendChart } from '@/components/insights/DailySpendChart'
import { DateRangePicker } from '@/components/insights/DateRangePicker'
import { MetricCard } from '@/components/insights/MetricCard'
import { SignOutButton } from '@/components/insights/SignOutButton'
import { SpendByMiniAppChart } from '@/components/insights/SpendByMiniAppChart'
import { isAllowed } from '@/lib/insights/allowlist'
import { type DateRange, isDateRange } from '@/lib/insights/date-ranges'
import { formatCurrency, formatDelta, formatInteger, formatPercent } from '@/lib/insights/format'
import {
  getConversionRate,
  getDailySpend,
  getRecentActivity,
  getSpendByMiniApp,
  getTotalLeads,
  getTotalSpend,
  getTotalSubmissions,
} from '@/lib/insights/queries'
import { createRouteHandlerClient } from '@/lib/supabase/ssr'

export const dynamic = 'force-dynamic'

type Settled<T> = { ok: true; value: T } | { ok: false }

async function settle<T>(p: Promise<T>): Promise<Settled<T>> {
  try {
    const value = await p
    return { ok: true, value }
  } catch (err) {
    console.error('[insights] query failed', err)
    return { ok: false }
  }
}

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  // Double-check the user — middleware already gates this.
  const supabase = await createRouteHandlerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/insights/login')
  if (!isAllowed(user.email)) {
    await supabase.auth.signOut()
    redirect('/insights/login?error=not_authorized')
  }

  const params = await searchParams
  const range: DateRange = isDateRange(params.range) ? params.range : '30d'

  const [spend, leads, subs, conv, daily, byApp, activity] = await Promise.all([
    settle(getTotalSpend(range)),
    settle(getTotalLeads(range)),
    settle(getTotalSubmissions(range)),
    settle(getConversionRate(range)),
    settle(getDailySpend(range)),
    settle(getSpendByMiniApp(range)),
    settle(getRecentActivity(10)),
  ])

  const spendValue = spend.ok ? formatCurrency(spend.value.current) : '—'
  const spendDelta = spend.ok
    ? formatDelta({ kind: 'percent', value: spend.value.deltaPercent })
    : undefined

  const leadsValue = leads.ok ? formatInteger(leads.value.current) : '—'
  const leadsDelta = leads.ok
    ? formatDelta({ kind: 'percent', value: leads.value.deltaPercent })
    : undefined

  const subsValue = subs.ok ? formatInteger(subs.value.current) : '—'
  const subsDelta = subs.ok
    ? formatDelta({ kind: 'percent', value: subs.value.deltaPercent })
    : undefined

  const convValue = conv.ok ? formatPercent(conv.value.currentPercent) : '—'
  const convDelta = conv.ok
    ? formatDelta({ kind: 'points', value: conv.value.deltaPoints })
    : undefined

  return (
    <div className="insights">
      <div className="ins-bg-stack" aria-hidden>
        <div className="ins-bg-orb" />
      </div>

      <main className="ins-shell">
        <header className="ins-topbar">
          <div className="ins-brand">
            <h1 className="ins-brand-title">Insights</h1>
            <span className="ins-brand-sub">
              <span className="ins-pulse" aria-hidden />
              Live · S7 Labs
            </span>
          </div>
          <div className="ins-topbar-right">
            <DateRangePicker />
            <span className="ins-user-email" title={user.email ?? ''}>
              {user.email}
            </span>
            <SignOutButton />
          </div>
        </header>

        <section className="ins-row-metrics">
          <MetricCard
            title="Total spend"
            value={spendValue !== '—' ? spendValue : null}
            delta={spendDelta}
            error={!spend.ok}
          />
          <MetricCard
            title="Total leads"
            value={leadsValue !== '—' ? leadsValue : null}
            delta={leadsDelta}
            error={!leads.ok}
          />
          <MetricCard
            title="Submissions"
            value={subsValue !== '—' ? subsValue : null}
            delta={subsDelta}
            error={!subs.ok}
          />
          <MetricCard
            title="Conversion rate"
            value={convValue !== '—' ? convValue : null}
            delta={convDelta}
            error={!conv.ok}
          />
        </section>

        <section className="ins-row-charts">
          <DailySpendChart
            title="Daily spend"
            data={daily.ok ? daily.value : []}
            error={!daily.ok}
          />
          <SpendByMiniAppChart
            title="Spend by mini-app"
            data={byApp.ok ? byApp.value : []}
            error={!byApp.ok}
          />
        </section>

        <section className="ins-row-activity">
          <ActivityFeed
            title="Recent activity"
            rows={activity.ok ? activity.value : []}
            error={!activity.ok}
          />
        </section>

        <footer className="ins-footer">Powered by S7 · v0</footer>
      </main>
    </div>
  )
}

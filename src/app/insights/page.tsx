import { ActivityFeed } from '@/components/insights/ActivityFeed'
import { DailySpendChart } from '@/components/insights/DailySpendChart'
import { DateRangePicker } from '@/components/insights/DateRangePicker'
import { MetricCard } from '@/components/insights/MetricCard'
import { SpendByMiniAppChart } from '@/components/insights/SpendByMiniAppChart'
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

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
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
    <>
      <header className="ins-page-head">
        <div className="ins-page-titleblock">
          <h1 className="ins-page-title">Overview</h1>
          <p className="ins-page-subtitle">Spend, leads, and conversion at a glance.</p>
        </div>
        <DateRangePicker />
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
        <DailySpendChart title="Daily spend" data={daily.ok ? daily.value : []} error={!daily.ok} />
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
    </>
  )
}

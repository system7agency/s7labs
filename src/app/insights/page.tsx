import { redirect } from 'next/navigation'

import { ActivityPlaceholder } from '@/components/insights/ActivityPlaceholder'
import { ChartPlaceholder } from '@/components/insights/ChartPlaceholder'
import { DateRangePicker } from '@/components/insights/DateRangePicker'
import { MetricCard } from '@/components/insights/MetricCard'
import { SignOutButton } from '@/components/insights/SignOutButton'
import { isAllowed } from '@/lib/insights/allowlist'
import { createRouteHandlerClient } from '@/lib/supabase/ssr'

export const dynamic = 'force-dynamic'

export default async function InsightsPage() {
  // Second-layer guard — middleware already gates this, but we double-check
  // here so an internal bug in middleware can't leak data.
  const supabase = await createRouteHandlerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/insights/login')
  if (!isAllowed(user.email)) {
    await supabase.auth.signOut()
    redirect('/insights/login?error=not_authorized')
  }

  return (
    <div className="insights">
      <div className="ins-bg-stack" aria-hidden>
        <div className="ins-bg-orb" />
        <div className="ins-bg-dots" />
      </div>
      <div className="ins-bg-grain" aria-hidden />

      <main className="ins-shell">
        <header className="ins-topbar">
          <div className="ins-brand">
            <span className="ins-brand-label">{'// S7 LABS · INSIGHTS'}</span>
            <span className="ins-brand-sub">
              <span className="ins-pulse" aria-hidden />
              Insights · Live
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
          <MetricCard id="01" title="Total spend" />
          <MetricCard id="02" title="Total leads" />
          <MetricCard id="03" title="Submissions" />
          <MetricCard id="04" title="Conversion rate" />
        </section>

        <section className="ins-row-charts">
          <ChartPlaceholder id="05" title="Daily spend" />
          <ChartPlaceholder id="06" title="Spend by mini-app" />
        </section>

        <section className="ins-row-activity">
          <ActivityPlaceholder id="07" title="Recent activity" />
        </section>

        <footer className="ins-footer">{'// powered by s7 · v0'}</footer>
      </main>
    </div>
  )
}

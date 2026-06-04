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
          <MetricCard title="Total spend" />
          <MetricCard title="Total leads" />
          <MetricCard title="Submissions" />
          <MetricCard title="Conversion rate" />
        </section>

        <section className="ins-row-charts">
          <ChartPlaceholder title="Daily spend" />
          <ChartPlaceholder title="Spend by mini-app" />
        </section>

        <section className="ins-row-activity">
          <ActivityPlaceholder title="Recent activity" />
        </section>

        <footer className="ins-footer">Powered by S7 · v0</footer>
      </main>
    </div>
  )
}

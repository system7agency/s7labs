import type { Metadata } from 'next'

import { Sidebar } from '@/components/insights/Sidebar'
import { isAllowed } from '@/lib/insights/allowlist'
import { createRouteHandlerClient } from '@/lib/supabase/ssr'

import './insights.css'

export const metadata: Metadata = {
  title: 'Insights · S7 Labs',
  description: 'Internal insights dashboard for S7 Labs.',
  robots: { index: false, follow: false },
}

/**
 * The shell. Middleware already enforces auth + allowlist for all
 * /insights/* routes except /insights/login. So in this layout we just
 * peek at the user — when there is one (i.e. on the gated pages),
 * we wrap the page in the sidebar; otherwise (login / reset-password)
 * we just pass children through so those screens render full-bleed.
 */
export default async function InsightsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createRouteHandlerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const showSidebar = !!user && isAllowed(user.email)

  if (!showSidebar) {
    return <>{children}</>
  }

  return (
    <div className="insights">
      <div className="ins-bg-stack" aria-hidden>
        <div className="ins-bg-orb" />
      </div>
      <Sidebar email={user.email ?? null}>{children}</Sidebar>
    </div>
  )
}

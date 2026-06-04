import type { Metadata } from 'next'

import './insights.css'

export const metadata: Metadata = {
  title: 'Insights · S7 Labs',
  description: 'Internal insights dashboard for S7 Labs.',
  robots: { index: false, follow: false },
}

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

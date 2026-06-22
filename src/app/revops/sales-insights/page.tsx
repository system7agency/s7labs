import { redirect } from 'next/navigation'

// The Get Sales Insights app now lives in the mini-apps marketplace at
// /mini-apps/sales-insights. This route is kept as a redirect so existing
// links and bookmarks continue to work.
export default function SalesInsightsRedirect() {
  redirect('/mini-apps/sales-insights')
}

import { Container } from '@/components/ui/Container'
import type { RouteCardData } from '@/types/route'

import { RouteCardsClient } from './RouteCardsClient'
import { RoutesSectionHeader } from './RoutesSectionHeader'

const ACTIVE_ROUTES: RouteCardData[] = [
  {
    index: 'ROUTE_01',
    label: 'creator_s7labs',
    tagline: 'Content engines and brand intelligence for creative teams shipping at scale.',
    tags: ['CREATIVE', 'BRAND', 'CONTENT'],
    href: '/creator',
  },
  {
    index: 'ROUTE_02',
    label: 'revops_s7labs',
    tagline: 'AI-native pipeline, qualification, and outbound orchestration for revenue teams.',
    tags: ['SALES', 'REVOPS', 'PIPELINE'],
    href: '/revops',
  },
]

const SOON_ROUTE = {
  index: 'ROUTE_03',
  label: 'build_s7labs',
  tagline: 'Custom AI systems and bespoke integrations for teams ready to ship.',
  tags: ['CUSTOM', 'INTEGRATIONS', 'SOON'],
}

export function RoutesSection() {
  return (
    <section aria-labelledby="active-routes-heading" className="py-24">
      <Container>
        <RoutesSectionHeader />
        <RouteCardsClient routes={ACTIVE_ROUTES} soon={SOON_ROUTE} />
      </Container>
    </section>
  )
}

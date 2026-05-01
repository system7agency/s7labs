import { Container } from '@/components/ui/Container'
import type { RouteCardData } from '@/types/route'
import { RouteCard } from './RouteCard'
import { RoutesSectionHeader } from './RoutesSectionHeader'
import { SoonCard } from './SoonCard'

// Spec showed `as const` + explicit type; dropping `as const` because the type
// annotation already provides the same type-safety, and `as const` would make
// the literal readonly tuple incompatible with `RouteCardData[]`.
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

export function RoutesSection() {
  return (
    <section aria-labelledby="active-routes-heading" className="py-24">
      <Container>
        <RoutesSectionHeader />

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {ACTIVE_ROUTES.map((route) => (
            <RouteCard key={route.index} {...route} />
          ))}
        </div>

        <div className="mt-4">
          <SoonCard
            index="ROUTE_03"
            label="build_s7labs"
            tagline="Custom AI systems and bespoke integrations for teams ready to ship."
            tags={['CUSTOM', 'INTEGRATIONS', 'SOON']}
          />
        </div>
      </Container>
    </section>
  )
}

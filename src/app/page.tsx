import { Hero } from '@/components/features/landing/Hero'
import { RoutesSection } from '@/components/features/landing/RoutesSection'

export default function HomePage() {
  return (
    <main className="relative z-10 min-h-screen">
      <Hero />
      <RoutesSection />
    </main>
  )
}

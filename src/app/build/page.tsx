import './page-styles.css'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

import { BuildHero } from './_components/BuildHero'
import { CapabilitiesSection } from './_components/CapabilitiesSection'
import { FooterCTA } from './_components/FooterCTA'
import { InDevelopmentSection } from './_components/InDevelopmentSection'
import { PageEyebrow } from './_components/PageEyebrow'
import { ProcessSection } from './_components/ProcessSection'
import { ShippedSection } from './_components/ShippedSection'
import { PageScripts } from './PageScripts'

export const metadata = {
  title: 'Build Lab — S7 Labs',
  description:
    'Custom AI systems for teams defining the future of their industry — designed, built, and shipped by System7 engineers.',
}

export default function BuildLabPage() {
  return (
    <div className="build-lab">
      <div className="bg-stack">
        <canvas id="aurora" />
        <div className="bg-dots" id="bgDots" />
      </div>
      <div className="bg-spotlight" id="spotlight" />
      <div className="bg-grain" id="bgGrain" />

      <Header />

      <main>
        <PageEyebrow />
        <BuildHero />
        <ShippedSection />
        <CapabilitiesSection />
        <ProcessSection />
        <InDevelopmentSection />
        <FooterCTA />
      </main>

      <Footer />

      <PageScripts />
    </div>
  )
}

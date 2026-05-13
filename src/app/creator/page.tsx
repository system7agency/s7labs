import './page-styles.css'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

import { AdvantageSection } from './_components/AdvantageSection'
import { AudienceSection } from './_components/AudienceSection'
import { CreatorHero } from './_components/CreatorHero'
import { FooterCTA } from './_components/FooterCTA'
import { InflectionSection } from './_components/InflectionSection'
import { PageEyebrow } from './_components/PageEyebrow'
import { ProcessSection } from './_components/ProcessSection'
import { ProofSection } from './_components/ProofSection'
import { PageScripts } from './PageScripts'

export const metadata = {
  title: 'Creator Lab — S7 Labs',
  description:
    'S7 Labs builds software products for content creators — tools your audience pays for, on a platform you own. From micro to macro, we ship and you launch.',
}

export default function CreatorLabPage() {
  return (
    <div className="creator-lab">
      <div className="bg-stack">
        <canvas id="aurora" />
        <div className="bg-dots" id="bgDots" />
      </div>
      <div className="bg-spotlight" id="spotlight" />
      <div className="bg-grain" id="bgGrain" />

      <Header />

      <main>
        <PageEyebrow />
        <CreatorHero />
        <AudienceSection />
        <InflectionSection />
        <ProcessSection />
        <AdvantageSection />
        <ProofSection />
        <FooterCTA />
      </main>

      <Footer />

      <PageScripts />
    </div>
  )
}

import './page-styles.css'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { LabTitleHero } from '@/components/LabTitleHero'

import { BuildHero } from './_components/BuildHero'
import { BuildModesSection } from './_components/BuildModesSection'
import { ExampleBuildsSection } from './_components/ExampleBuildsSection'
import { FooterCTA } from './_components/FooterCTA'
import { PageEyebrow } from './_components/PageEyebrow'
import { ProductBuildSystemSection } from './_components/ProductBuildSystemSection'
import { SoftwareComponentsSection } from './_components/SoftwareComponentsSection'
import { SupportingCapabilitiesSection } from './_components/SupportingCapabilitiesSection'
import { WhatWeBuildSection } from './_components/WhatWeBuildSection'
import { PageScripts } from './PageScripts'

export const metadata = {
  title: 'Build Lab — S7 Labs',
  description:
    'We design and build client-facing products, internal platforms and AI-enabled tools that fit your business, your data and your operating model.',
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
        <LabTitleHero
          eyebrow="ROUTE_03 — BUILD LAB"
          name="Build"
          bgWord="BUILD"
          subtitle="We design and build client-facing products, internal platforms and AI-enabled tools that fit your business, your data and your operating model."
          meta={[
            { label: 'PRODUCTS' },
            { label: 'PLATFORMS' },
            { label: 'AI TOOLS' },
            { label: 'BESPOKE', accent: true },
          ]}
          scrollHint="SCROLL"
        />
        <BuildHero />
        <WhatWeBuildSection />
        <ProductBuildSystemSection />
        <SoftwareComponentsSection />
        <BuildModesSection />
        <SupportingCapabilitiesSection />
        <ExampleBuildsSection />
        <FooterCTA />
      </main>

      <Footer />

      <PageScripts />
    </div>
  )
}

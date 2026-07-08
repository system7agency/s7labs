import './page-styles.css'
import './fresh-sections.css'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { LabTitleHero } from '@/components/LabTitleHero'

import { LabClosingSections } from '../revops/LabClosingSections'

import { HowItWorksSection } from './_components/HowItWorksSection'
import { PageEyebrow } from './_components/PageEyebrow'
import { TheAdvantageSection } from './_components/TheAdvantageSection'
import { TheOldWaySection } from './_components/TheOldWaySection'
import { WhatWeBuildSection } from './_components/WhatWeBuildSection'
import { PageScripts } from './PageScripts'

export const metadata = {
  title: 'Build Lab - S7 Labs',
  description:
    'We build the bespoke tools, automation and software your business should own - shaped around how your team already works.',
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
        {/* 01 · Hero */}
        <PageEyebrow />
        <LabTitleHero
          eyebrow="ROUTE_03 - BUILD LAB"
          name="Build"
          bgWord="BUILD"
          subtitle="We build the bespoke tools, automation and software your business should own - shaped around how your team already works."
          meta={[
            { label: 'TOOLS' },
            { label: 'AUTOMATION' },
            { label: 'PRODUCTS' },
            { label: 'BESPOKE', accent: true },
          ]}
          scrollHint="SCROLL"
        />

        {/* 02 · The old way */}
        <TheOldWaySection />

        {/* 03 · The advantage */}
        <TheAdvantageSection />

        {/* 04 · What we build */}
        <WhatWeBuildSection />

        {/* 05 · How it works */}
        <HowItWorksSection />

        {/* 06-08 · Inside System7 → Start here → Live apps (shared repeated module) */}
        <LabClosingSections
          inside={{
            header: (
              <>
                S<sup>7</sup> Labs builds the software. System<sup>7</sup> runs it with you.
              </>
            ),
            subhead: (
              <>
                S<sup>7</sup> Labs is the build studio inside System<sup>7</sup>, where your tools,
                automation and software are designed, built and proven. System<sup>7</sup> then
                embeds with your team to run and improve them - or you run them yourself. You own what
                we build and your team operates it - production-grade software, not a black box you
                rent.
              </>
            ),
          }}
          start={{
            header: <>Bring us the problem. We&apos;ll build the system around it.</>,
            subhead: (
              <>
                If your team keeps describing a tool they wish they had, or a manual process that
                will not go away - quoting, approvals, routing, reporting, handoffs - it can probably
                be built. Tell us where the friction is and we&apos;ll map the system around it.
              </>
            ),
          }}
          live={{
            subhead: (
              <>
                These are deliberately small, live tools - each one solves a single problem fast.
                Open one, test it, use it. The quickest way to feel how a bespoke build works.
              </>
            ),
          }}
        />
      </main>

      <Footer />

      <PageScripts />
    </div>
  )
}

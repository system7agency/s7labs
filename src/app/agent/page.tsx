import './page-styles.css'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { LabTitleHero } from '@/components/LabTitleHero'

import { LabClosingSections } from '../revops/LabClosingSections'

import { AgentHero } from './_components/AgentHero'
import { AgentRolesSection } from './_components/AgentRolesSection'
import { OrchestrationMapSection } from './_components/OrchestrationMapSection'
import { PageEyebrow } from './_components/PageEyebrow'
import { TheModelSection } from './_components/TheModelSection'
import { PageScripts } from './PageScripts'

export const metadata = {
  title: 'Agent Lab - S7 Labs',
  description:
    'Agents take on the repetitive, multi-step work, so your team is free for the creativity, deep work and critical thinking only people can do.',
}

export default function AgentLabPage() {
  return (
    <div className="agent-lab">
      <div className="bg-stack" aria-hidden="true">
        <canvas id="aurora" />
        <div className="bg-dots" id="bgDots" />
      </div>
      <div className="bg-spotlight" aria-hidden="true" />
      <div className="bg-grain" aria-hidden="true" />

      <Header />

      <main>
        {/* 01 · Hero */}
        <PageEyebrow />
        <LabTitleHero
          eyebrow="ROUTE_02 - AGENT LAB"
          name="Agent"
          bgWord="AGENT"
          subtitle="Agents take on the repetitive, multi-step work, so your team is free for the creativity, deep work and critical thinking only people can do."
          meta={[
            { label: 'AGENTS' },
            { label: 'ORCHESTRATION' },
            { label: 'AUTONOMY' },
            { label: 'GOVERNED', accent: true },
          ]}
          scrollHint="SCROLL"
        />

        {/* 02 · Where the time goes */}
        <AgentHero />

        {/* 03 · Orchestration & control */}
        <OrchestrationMapSection />

        {/* 04 · The work */}
        <AgentRolesSection />

        {/* 05 · The model */}
        <TheModelSection />

        {/* 06-08 · Inside System7 → Start here → Live apps (shared repeated module) */}
        <LabClosingSections
          inside={{
            header: (
              <>
                S<sup>7</sup> Labs builds the agents. System<sup>7</sup> runs them with you.
              </>
            ),
            subhead: (
              <>
                S<sup>7</sup> Labs is the build studio inside System<sup>7</sup>, where your agents
                and AI stack are designed, built and proven. System<sup>7</sup> then embeds with
                your team to run and improve them - or you run them yourself. You own what we build
                and your team operates it - production-grade systems, not a black box you rent.
              </>
            ),
          }}
          start={{
            header: <>Bring us the work. We&apos;ll build the system around it.</>,
            subhead: (
              <>
                If your team keeps doing repetitive, multi-step work - research, monitoring,
                routing, reconciliation, reporting - it can probably be built. Tell us where the
                friction is and we&apos;ll map the system around it.
              </>
            ),
          }}
          live={{
            subhead: (
              <>
                These are deliberately small, live tools - each one solves a single problem fast.
                Open one, give it a task, even talk to a voice agent. The quickest way to feel how
                an agent works.
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

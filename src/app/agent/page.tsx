import './page-styles.css'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { LabTitleHero } from '@/components/LabTitleHero'

import { AgentHero } from './_components/AgentHero'
import { AgentOperatingSystemSection } from './_components/AgentOperatingSystemSection'
import { AgentRolesSection } from './_components/AgentRolesSection'
import { AgentVsChatbotSection } from './_components/AgentVsChatbotSection'
import { FooterCTA } from './_components/FooterCTA'
import { GovernanceConsoleSection } from './_components/GovernanceConsoleSection'
import { OrchestrationMapSection } from './_components/OrchestrationMapSection'
import { PageEyebrow } from './_components/PageEyebrow'
import { ToolUniverseSection } from './_components/ToolUniverseSection'
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
        <AgentHero />
        <AgentVsChatbotSection />
        <AgentOperatingSystemSection />
        <AgentRolesSection />
        <OrchestrationMapSection />
        <ToolUniverseSection />
        <GovernanceConsoleSection />
        <FooterCTA />
      </main>

      <Footer />

      <PageScripts />
    </div>
  )
}

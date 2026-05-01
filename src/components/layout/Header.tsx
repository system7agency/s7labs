import { Container } from '@/components/ui/Container'
import { BackLink } from './BackLink'
import { LinkedInPill } from './LinkedInPill'
import { VoiceAgentPill } from './VoiceAgentPill'
import { Wordmark } from './Wordmark'

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-[var(--color-border)] bg-[var(--color-bg)] py-4">
      <Container className="flex h-full items-center justify-between">
        <BackLink />
        <Wordmark />
        <div className="flex items-center gap-3">
          <LinkedInPill />
          <VoiceAgentPill />
        </div>
      </Container>
    </header>
  )
}

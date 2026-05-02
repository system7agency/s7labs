import { Phone } from 'lucide-react'

export function VoiceAgentPill() {
  return (
    <a
      href="#voice-agent"
      className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent-dim)] px-3.5 py-2 font-mono text-[12px] font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-dim)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
    >
      <span
        aria-hidden="true"
        className="pulse-soft size-1.5 rounded-full bg-[var(--color-accent)]"
      />
      <Phone aria-hidden="true" size={14} strokeWidth={1.5} />
      AI System 7
    </a>
  )
}

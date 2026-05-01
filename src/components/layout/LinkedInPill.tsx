import { Linkedin } from 'lucide-react'

export function LinkedInPill() {
  return (
    <a
      // TODO(nicolas): confirm the canonical LinkedIn company URL — placeholder for now
      href="https://www.linkedin.com/company/system7-ai"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-2 font-mono text-[12px] font-medium text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
    >
      <Linkedin aria-hidden="true" size={14} strokeWidth={1.5} />
      LinkedIn
    </a>
  )
}

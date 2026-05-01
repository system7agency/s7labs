import { Container } from '@/components/ui/Container'

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] py-8">
      <Container className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <span className="font-mono text-[11px] font-medium tracking-[0.14em] text-[var(--color-fg-dim)] uppercase">
          S7 LABS · A SYSTEM7 VENTURE
        </span>
        <span className="font-mono text-[11px] font-medium text-[var(--color-fg-dim)]">
          v0.1.0 · © 2025
        </span>
      </Container>
    </footer>
  )
}

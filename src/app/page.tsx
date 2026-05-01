import { Container } from '@/components/ui/Container'
import { GlassPill } from '@/components/ui/GlassPill'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Container className="py-24">
        <p className="font-mono text-xs tracking-[0.14em] text-[var(--color-fg-dim)] uppercase">
          Innovation Lab · Est. 2025 · A System7 Venture
        </p>
        <h1 className="mt-4 font-sans text-[88px] leading-none font-semibold tracking-[-0.03em] text-[var(--color-fg)]">
          S7 Labs
        </h1>
        <p className="mt-6 max-w-[480px] text-lg text-[var(--color-fg-muted)]">
          Three labs. Three live experiments in applied AI.
        </p>
        <div className="mt-8 flex gap-3">
          <GlassPill className="border-[var(--color-border)] bg-[var(--color-surface-2)]">
            <span className="font-mono text-sm text-[var(--color-fg-muted)]">
              Tokens aligned · ready to build
            </span>
          </GlassPill>
        </div>
      </Container>
    </main>
  )
}

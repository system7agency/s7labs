import { Container } from '@/components/ui/Container'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Container className="pt-32 pb-24">
        <p className="font-mono text-xs tracking-[0.14em] text-[var(--color-fg-dim)] uppercase">
          Innovation Lab · Est. 2025 · A System7 Venture
        </p>
        <h1 className="mt-4 font-sans text-[88px] leading-none font-semibold tracking-[-0.03em] text-[var(--color-fg)]">
          S7 Labs
        </h1>
        <p className="mt-6 max-w-[480px] text-lg text-[var(--color-fg-muted)]">
          Three labs. Three live experiments in applied AI.
        </p>
      </Container>
    </main>
  )
}

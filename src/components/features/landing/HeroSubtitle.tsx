import { AnimatedText } from './AnimatedText'

export function HeroSubtitle() {
  return (
    <div className="mt-8 max-w-[540px] text-center">
      <p className="text-base font-normal text-[var(--color-fg-muted)] md:text-lg">
        <AnimatedText text="Three labs. Three live experiments in applied AI." delay={0.3} />
      </p>
      <p className="mt-3 text-sm font-normal text-[var(--color-fg-dim)]">
        <AnimatedText text="From System7 — the AI consultancy." delay={1.5} />
      </p>
    </div>
  )
}

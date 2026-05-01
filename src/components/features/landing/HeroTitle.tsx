export function HeroTitle() {
  return (
    <div className="relative">
      <h1 className="flex items-baseline justify-center font-sans text-[80px] leading-none font-semibold tracking-[-0.02em] text-[var(--color-fg)] md:text-[110px] lg:text-[140px]">
        <span>S7</span>
        <span
          aria-hidden="true"
          className="mx-4 h-[50px] w-[2px] self-center bg-[var(--color-accent)] md:h-[70px] lg:h-[84px]"
        />
        {/* Fraunces italic sits a touch above the sans baseline optically; keep items-baseline and let the metrics align — revisit if it reads off in design QA. */}
        <span className="font-serif font-light italic">Labs</span>
      </h1>
    </div>
  )
}

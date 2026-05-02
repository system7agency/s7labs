export function HeroTitle() {
  return (
    <div className="animate-fade-up animate-delay-200 relative">
      <span aria-hidden="true" className="hero-bg-word">
        LABS
      </span>
      <h1 className="relative z-[1] flex items-baseline justify-center font-sans text-[80px] leading-none font-semibold tracking-[-0.02em] text-[var(--color-fg)] md:text-[110px] lg:text-[140px]">
        <span className="title-sheen">S7</span>
        <span aria-hidden="true" className="beam mx-4 h-[50px] self-center md:h-[70px] lg:h-[84px]">
          <span className="beam-tick" style={{ animationDelay: '0s' }} />
          <span className="beam-tick" style={{ animationDelay: '0.8s' }} />
          <span className="beam-tick" style={{ animationDelay: '1.6s' }} />
        </span>
        {/* Fraunces italic sits a touch above the sans baseline optically; keep items-baseline and let the metrics align — revisit if it reads off in design QA. */}
        <span className="title-sheen font-serif font-light italic">Labs</span>
      </h1>
    </div>
  )
}

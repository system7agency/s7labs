export function RoutesSectionHeader() {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-6">
      <h2
        id="active-routes-heading"
        className="flex items-center gap-2 font-mono text-[12px] font-medium tracking-[0.18em] text-[var(--color-fg-muted)] uppercase"
      >
        <span aria-hidden="true" className="text-[var(--color-fg-dim)]">
          {'//'}
        </span>
        ACTIVE ROUTES
      </h2>
      <span className="font-mono text-[12px] font-medium text-[var(--color-fg-dim)]">02 / 03</span>
    </div>
  )
}

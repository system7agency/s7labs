export function Wordmark() {
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden="true" className="size-2 rounded-full bg-[var(--color-accent)]" />
      <span className="font-mono text-[13px] font-medium tracking-[0.14em] text-[var(--color-fg-muted)] uppercase">
        S7 LABS
      </span>
    </div>
  )
}

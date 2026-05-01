import { ChevronDown } from 'lucide-react'

export function ScrollCue() {
  return (
    <span
      aria-hidden="true"
      className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 font-mono text-[10px] font-medium tracking-[0.2em] text-[var(--color-fg-dim)] uppercase"
    >
      SELECT ROUTE
      <ChevronDown size={14} strokeWidth={1.5} />
    </span>
  )
}

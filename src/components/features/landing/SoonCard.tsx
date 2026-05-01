type Props = {
  index: string
  label: string
  tagline: string
  tags: string[]
}

export function SoonCard({ index, label, tagline, tags }: Props) {
  return (
    <div
      role="group"
      aria-disabled="true"
      className="flex min-h-[280px] cursor-not-allowed flex-col justify-between rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] p-8"
    >
      <span className="font-mono text-[11px] font-medium tracking-[0.14em] text-[var(--color-fg-dim)] uppercase">
        {index}
      </span>

      <div>
        <div className="flex items-baseline gap-2">
          <span
            aria-hidden="true"
            className="font-mono text-[24px] font-medium text-[var(--color-fg-dim)]"
          >
            $
          </span>
          <span className="font-mono text-[24px] font-medium text-[var(--color-fg-muted)]">
            {label}
          </span>
        </div>
        <p className="mt-4 max-w-[320px] text-sm font-normal text-[var(--color-fg-dim)]">
          {tagline}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-medium tracking-[0.14em] text-[var(--color-fg-dim)] uppercase">
          {tags.join(' · ')}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-1.5">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-[var(--color-status-pending)]"
          />
          <span className="font-mono text-[10px] font-medium tracking-[0.18em] text-[var(--color-fg-dim)] uppercase">
            COMING SOON
          </span>
        </span>
      </div>
    </div>
  )
}

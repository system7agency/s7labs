'use client'

/*
 * TODO (SYS-499): Wire this to the booking / discovery-call modal when
 * one exists. Currently logs to console as a placeholder. Mirrors the
 * BookingCTA pattern from /creator — do NOT scaffold a new modal in
 * this PR; reuse whatever booking context is implemented.
 */

type CommissionCTAProps = {
  label?: string
  className?: string
}

export function CommissionCTA({
  label = 'Commission a build',
  className,
}: CommissionCTAProps) {
  const handleClick = () => {
    console.warn('[Build Lab] Commission a build CTA clicked — modal not yet wired.')
  }

  return (
    <button
      type="button"
      className={['btn', className].filter(Boolean).join(' ')}
      onClick={handleClick}
    >
      <span>{label}</span>
      <span className="arr" aria-hidden="true">
        →
      </span>
    </button>
  )
}

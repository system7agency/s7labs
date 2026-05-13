'use client'

/*
 * TODO (SYS-498): Wire this to a booking / discovery-call modal when one
 * exists. Currently logs to console as a placeholder. Do NOT scaffold a
 * new modal in this PR — reuse whatever booking context is implemented.
 */

type BookingCTAProps = {
  label?: string
  className?: string
}

export function BookingCTA({ label = 'Book Discovery Call', className }: BookingCTAProps) {
  const handleClick = () => {
    // TODO: open booking / discovery-call modal here
    console.warn('[Creator Lab] Book Discovery Call CTA clicked — modal not yet wired.')
  }

  return (
    <button
      type="button"
      className={`cta-btn${className ? ` ${className}` : ''}`}
      onClick={handleClick}
    >
      {label}
      <span className="arr" aria-hidden="true">
        →
      </span>
    </button>
  )
}

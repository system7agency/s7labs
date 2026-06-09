'use client'

import styles from './InlineConsentField.module.css'

type Props = {
  id?: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}

/**
 * Marketing consent checkbox for the inline lead-capture forms used by the
 * mini-apps. The native input is visually hidden and a custom box plus
 * animated SVG tick are rendered in its place so the control matches the
 * terminal aesthetic across browsers and respects prefers-reduced-motion.
 */
export function InlineConsentField({
  id = 'mini-app-marketing-consent',
  checked,
  disabled,
  onChange,
}: Props) {
  return (
    <div className={styles.consentRow}>
      <label className={styles.consentLabel} htmlFor={id}>
        <input
          id={id}
          className={styles.srOnlyInput}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className={styles.consentBox} aria-hidden="true">
          <svg
            className={styles.consentTick}
            viewBox="0 0 16 16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.2 8.4 L6.6 11.8 L12.8 4.6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          </svg>
        </span>
        <span className={styles.consentText}>
          Email me occasional updates from S7 Labs. Unsubscribe anytime.
        </span>
      </label>
      <div className={styles.consentHint}>WE&apos;LL SEND YOUR RESULT EITHER WAY</div>
    </div>
  )
}

export default InlineConsentField

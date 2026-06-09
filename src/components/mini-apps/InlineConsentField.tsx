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
 * mini-apps. Visual + copy parity with the canonical `EmailGate` overlay
 * (see `EmailGate.module.css`). Default state is unchecked; the server
 * never silently revokes a previously-given consent.
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
          className={styles.consentCheckbox}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className={styles.consentText}>
          Email me occasional updates from S7 Labs. Unsubscribe anytime.
        </span>
      </label>
      <div className={styles.consentHint}>WE&apos;LL SEND YOUR RESULT EITHER WAY</div>
    </div>
  )
}

export default InlineConsentField

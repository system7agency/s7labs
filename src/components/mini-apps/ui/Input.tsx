'use client'

/*
 * Input — canonical labeled text input for mini-app forms. Wraps the shared
 * `.input-field` / `.input-box` / `.field-error` classes. Bakes in the
 * accessibility rules the UX pass flagged: visible <label> tied to the input,
 * `role="alert"` errors rendered below the field, and the dark-theme autofill
 * override (handled in CSS via `.input-box input:-webkit-autofill`).
 *
 * The `.error` modifier triggers the `ma-shake` animation; bump `shakeKey`
 * (e.g. a counter) when you want the box to re-shake on a repeated bad submit
 * — React remounts the box on key change so the CSS animation replays.
 */

import { useId } from 'react'
import type { InputHTMLAttributes, Ref } from 'react'
import clsx from 'clsx'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  label: string
  required?: boolean
  error?: string | null
  shakeKey?: number
  className?: string
  /** Forwarded to the inner <input> (React 19 ref-as-prop) — used for autofocus. */
  ref?: Ref<HTMLInputElement>
}

export function Input({ label, required = false, error, shakeKey = 0, id, ref, ...rest }: Props) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errId = `${inputId}-err`
  return (
    <div className="input-field">
      <label htmlFor={inputId}>
        {label}
        {required && (
          <span aria-hidden="true" style={{ color: 'var(--error, #ff5c7a)' }}>
            {' '}
            *
          </span>
        )}
      </label>
      <div key={`box-${shakeKey}`} className={clsx('input-box', { error: !!error })}>
        <input
          ref={ref}
          id={inputId}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          {...rest}
        />
      </div>
      {error && (
        <div id={errId} className="field-error" role="alert">
          {error}
        </div>
      )}
    </div>
  )
}

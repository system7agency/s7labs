'use client'

/*
 * Textarea — canonical labeled textarea with an optional character counter.
 * Wraps `.textarea-field` / `.textarea-box` / `.char-counter` / `.field-error`.
 *
 * When `maxLength` is set, the browser hard-blocks past the cap AND the counter
 * turns amber at 80% / red at 100% (the input-cap UX rule from the guide). The
 * counter is aria-hidden — screen readers get the cap via maxLength + the
 * field's own label.
 */

import { useId } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import clsx from 'clsx'

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & {
  label: string
  required?: boolean
  error?: string | null
  shakeKey?: number
  /** Current value length, for the counter. Pass value.length. */
  count?: number
  className?: string
}

export function Textarea({
  label,
  required = false,
  error,
  shakeKey = 0,
  count,
  maxLength,
  id,
  ...rest
}: Props) {
  const autoId = useId()
  const taId = id ?? autoId
  const errId = `${taId}-err`

  const showCounter = typeof maxLength === 'number' && typeof count === 'number'
  const ratio = showCounter ? count / maxLength : 0
  const counterClass = clsx('char-counter', {
    warn: ratio >= 0.8 && ratio < 1,
    over: ratio >= 1,
  })

  return (
    <div className="textarea-field">
      <label htmlFor={taId}>
        {label}
        {required && (
          <span aria-hidden="true" style={{ color: 'var(--error, #ff5c7a)' }}>
            {' '}
            *
          </span>
        )}
      </label>
      <div key={`box-${shakeKey}`} className={clsx('textarea-box', { error: !!error })}>
        <textarea
          id={taId}
          maxLength={maxLength}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          {...rest}
        />
      </div>
      <div className="textarea-meta">
        {error ? (
          <div id={errId} className="field-error" role="alert">
            {error}
          </div>
        ) : (
          <span />
        )}
        {showCounter && (
          <span className={counterClass} aria-hidden="true">
            {count}/{maxLength}
          </span>
        )}
      </div>
    </div>
  )
}

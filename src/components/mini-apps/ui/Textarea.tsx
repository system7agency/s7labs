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
import type { Ref, TextareaHTMLAttributes } from 'react'
import clsx from 'clsx'

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & {
  label: string
  required?: boolean
  error?: string | null
  shakeKey?: number
  /** Current value length, for the counter. Pass value.length. */
  count?: number
  className?: string
  /** Forwarded to the inner <textarea> (React 19 ref-as-prop) — used for autofocus. */
  ref?: Ref<HTMLTextAreaElement>
}

export function Textarea({
  label,
  required = false,
  error,
  shakeKey = 0,
  count,
  maxLength,
  id,
  ref,
  ...rest
}: Props) {
  const autoId = useId()
  const taId = id ?? autoId
  const errId = `${taId}-err`

  // Counter shows whenever a count is passed. With a maxLength it reads
  // "n/max" and turns amber/red near the cap; without one it reads "n chars".
  const showCounter = typeof count === 'number'
  const hasCap = typeof maxLength === 'number'
  const ratio = typeof count === 'number' && typeof maxLength === 'number' ? count / maxLength : 0
  const counterClass = clsx('char-counter', {
    warn: hasCap && ratio >= 0.8 && ratio < 1,
    over: hasCap && ratio >= 1,
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
          ref={ref}
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
            {hasCap ? `${count}/${maxLength}` : `${count} chars`}
          </span>
        )}
      </div>
    </div>
  )
}

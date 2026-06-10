'use client'

/*
 * Button — canonical mini-app button. Wraps the shared `.submit-btn` /
 * `.btn-secondary` / `.btn-ghost` / `.btn-small` classes from
 * `mini-app-ui.css`. Uses clsx internally so callers can't reintroduce the
 * fused-class template-literal bug (the "CC-1 cousin") the guide warns about.
 *
 * `loading` shows busy text and disables the button; the gerund lives here in
 * the loading state, never in the resting label (per the submit-verb rule).
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'small'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  variant?: Variant
  loading?: boolean
  loadingLabel?: string
  className?: string
  children: ReactNode
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'submit-btn',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  small: 'btn-small',
}

export function Button({
  variant = 'primary',
  loading = false,
  loadingLabel,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: Props) {
  const isDisabled = disabled || loading
  return (
    <button
      type={type}
      className={clsx(VARIANT_CLASS[variant], className, { loading })}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      {...rest}
    >
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  )
}

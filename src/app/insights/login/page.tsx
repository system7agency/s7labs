'use client'

import { Suspense, useCallback, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { clsx } from 'clsx'

import { isAllowed } from '@/lib/insights/allowlist'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

type Mode = 'password' | 'reset'
type Status = 'idle' | 'busy' | 'error' | 'reset-sent'

function initialStateFromUrl(err: string | null): {
  status: Status
  message: string | null
} {
  if (err === 'not_authorized') {
    return {
      status: 'error',
      message: 'Email not authorized. Ask an admin to allowlist you.',
    }
  }
  if (err === 'auth_failed') {
    return {
      status: 'error',
      message: 'Reset link expired or invalid. Request a new one.',
    }
  }
  return { status: 'idle', message: null }
}

function LoginInner() {
  const router = useRouter()
  const params = useSearchParams()
  const initialError = params.get('error')
  const initial = initialStateFromUrl(initialError)

  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<Status>(initial.status)
  const [message, setMessage] = useState<string | null>(initial.message)

  const resetMessage = useCallback(() => {
    if (status === 'error') {
      setStatus('idle')
      setMessage(null)
    }
  }, [status])

  const handleSignIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmedEmail = email.trim().toLowerCase()

      if (!trimmedEmail) {
        setStatus('error')
        setMessage('Enter your email.')
        return
      }
      if (!isAllowed(trimmedEmail)) {
        setStatus('error')
        setMessage('Email not authorized.')
        return
      }
      if (!password) {
        setStatus('error')
        setMessage('Enter your password.')
        return
      }

      setStatus('busy')
      setMessage(null)

      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      })

      if (error) {
        setStatus('error')
        setMessage(error.message || 'Incorrect email or password.')
        return
      }

      router.replace('/insights')
      router.refresh()
    },
    [email, password, router]
  )

  const handleSendReset = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmedEmail = email.trim().toLowerCase()

      if (!trimmedEmail) {
        setStatus('error')
        setMessage('Enter your email.')
        return
      }
      if (!isAllowed(trimmedEmail)) {
        setStatus('error')
        setMessage('Email not authorized.')
        return
      }

      setStatus('busy')
      setMessage(null)

      const supabase = getSupabaseBrowserClient()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${origin}/auth/callback?next=/insights/reset-password`,
      })

      if (error) {
        setStatus('error')
        setMessage(error.message || 'Could not send reset email. Try again.')
        return
      }

      setStatus('reset-sent')
      setMessage('Check your email — we sent you a link to set a new password.')
    },
    [email]
  )

  const inputError = status === 'error'
  const disabled = status === 'busy' || status === 'reset-sent'

  return (
    <div className="insights is-login">
      <div className="ins-bg-stack" aria-hidden>
        <div className="ins-bg-orb" />
      </div>

      <div className="ins-login-wrap">
        <div className="ins-login-card">
          <span className="ins-login-eyebrow">S7 Labs · Insights</span>
          <h1>{mode === 'password' ? 'Sign in to continue.' : 'Reset your password.'}</h1>
          <p>
            {mode === 'password'
              ? 'Enter your allowlisted email and password.'
              : "We'll email you a link to set a new password. The link expires in 1 hour."}
          </p>

          <form
            onSubmit={mode === 'password' ? handleSignIn : handleSendReset}
            noValidate
            autoComplete="off"
          >
            <label className="ins-login-label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@system7.ai"
              value={email}
              disabled={disabled}
              onChange={(e) => {
                setEmail(e.target.value)
                resetMessage()
              }}
              className={clsx('ins-login-input', { error: inputError })}
            />

            {mode === 'password' ? (
              <>
                <label
                  className="ins-login-label"
                  htmlFor="login-password"
                  style={{ marginTop: 14 }}
                >
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  disabled={disabled}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    resetMessage()
                  }}
                  className={clsx('ins-login-input', { error: inputError })}
                />
              </>
            ) : null}

            {message ? (
              <div
                className={clsx('ins-login-help', {
                  error: status === 'error',
                  success: status === 'reset-sent',
                })}
              >
                {message}
              </div>
            ) : (
              <div className="ins-login-help">
                {mode === 'password'
                  ? 'First time here? Use “Forgot password?” to set one.'
                  : 'Allowlisted addresses only.'}
              </div>
            )}

            <button type="submit" className="ins-login-btn" disabled={disabled}>
              {status === 'busy'
                ? mode === 'password'
                  ? 'Signing in…'
                  : 'Sending…'
                : status === 'reset-sent'
                  ? 'Sent — check your inbox'
                  : mode === 'password'
                    ? 'Sign in'
                    : 'Send reset link'}
            </button>
          </form>

          <button
            type="button"
            className="ins-login-link"
            onClick={() => {
              setMode((m) => (m === 'password' ? 'reset' : 'password'))
              setStatus('idle')
              setMessage(null)
            }}
          >
            {mode === 'password' ? 'Forgot password?' : '← Back to sign in'}
          </button>

          <div className="ins-login-meta">Powered by S7</div>
        </div>
      </div>
    </div>
  )
}

export default function InsightsLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  )
}

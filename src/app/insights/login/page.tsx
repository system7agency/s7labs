'use client'

import { Suspense, useCallback, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { clsx } from 'clsx'

import { isAllowed } from '@/lib/insights/allowlist'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

type Status = 'idle' | 'sending' | 'sent' | 'error'

function initialStateFromUrl(err: string | null): { status: Status; message: string | null } {
  if (err === 'not_authorized') {
    return {
      status: 'error',
      message: 'Email not authorized. Ask an admin to allowlist you.',
    }
  }
  if (err === 'auth_failed') {
    return {
      status: 'error',
      message: 'Magic link expired or invalid. Request a new one.',
    }
  }
  return { status: 'idle', message: null }
}

function LoginInner() {
  const params = useSearchParams()
  const initialError = params.get('error')
  const initial = initialStateFromUrl(initialError)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>(initial.status)
  const [message, setMessage] = useState<string | null>(initial.message)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = email.trim().toLowerCase()
      if (!trimmed) {
        setStatus('error')
        setMessage('Enter your email.')
        return
      }
      if (!isAllowed(trimmed)) {
        setStatus('error')
        setMessage('Email not authorized.')
        return
      }

      setStatus('sending')
      setMessage(null)

      const supabase = getSupabaseBrowserClient()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: `${origin}/auth/callback?next=/insights` },
      })

      if (error) {
        setStatus('error')
        setMessage(error.message ?? 'Could not send magic link. Try again.')
        return
      }

      setStatus('sent')
      setMessage('Check your email — we sent you a magic link. It expires in 1 hour.')
    },
    [email]
  )

  const inputError = status === 'error'

  return (
    <div className="insights is-login">
      <div className="ins-bg-stack" aria-hidden>
        <div className="ins-bg-orb" />
        <div className="ins-bg-dots" />
      </div>
      <div className="ins-bg-grain" aria-hidden />

      <div className="ins-login-wrap">
        <div className="ins-login-card">
          <span className="ins-card-corner-bl" aria-hidden />
          <span className="ins-card-corner-br" aria-hidden />

          <span className="ins-login-eyebrow">{'// S7 LABS · INSIGHTS · LOGIN'}</span>
          <h1>Sign in to continue.</h1>
          <p>
            Magic-link auth. Enter your allowlisted email — we&apos;ll send you a one-time link that
            signs you in for the session.
          </p>

          <form onSubmit={handleSubmit} noValidate autoComplete="off">
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
              disabled={status === 'sending' || status === 'sent'}
              onChange={(e) => {
                setEmail(e.target.value)
                if (status === 'error') {
                  setStatus('idle')
                  setMessage(null)
                }
              }}
              className={clsx('ins-login-input', { error: inputError })}
            />
            {message ? (
              <div
                className={clsx('ins-login-help', {
                  error: status === 'error',
                  success: status === 'sent',
                })}
              >
                {message}
              </div>
            ) : (
              <div className="ins-login-help">One link per request. Don&apos;t share it.</div>
            )}

            <button
              type="submit"
              className="ins-login-btn"
              disabled={status === 'sending' || status === 'sent'}
            >
              {status === 'sending'
                ? 'Sending…'
                : status === 'sent'
                  ? 'Sent — check your inbox'
                  : 'Send magic link'}
            </button>
          </form>

          <div className="ins-login-meta">{'// powered by s7'}</div>
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

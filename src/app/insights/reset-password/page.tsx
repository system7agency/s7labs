'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { clsx } from 'clsx'

import { getSupabaseBrowserClient } from '@/lib/supabase/client'

type Status = 'idle' | 'busy' | 'success' | 'error' | 'no-session'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string | null>(null)

  // Verify we have a recovery session. Supabase exchanges the code in
  // /auth/callback before redirecting here, so a session should be live.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) {
        setStatus('no-session')
        setMessage('Your reset link expired. Request a new one from the sign-in page.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (password.length < 8) {
        setStatus('error')
        setMessage('Password must be at least 8 characters.')
        return
      }
      if (password !== confirm) {
        setStatus('error')
        setMessage('Passwords do not match.')
        return
      }

      setStatus('busy')
      setMessage(null)

      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setStatus('error')
        setMessage(error.message || 'Could not update password. Try again.')
        return
      }

      setStatus('success')
      setMessage('Password updated. Redirecting…')
      setTimeout(() => {
        router.replace('/insights')
        router.refresh()
      }, 800)
    },
    [password, confirm, router]
  )

  const inputError = status === 'error'
  const disabled = status === 'busy' || status === 'success' || status === 'no-session'

  return (
    <div className="insights is-login">
      <div className="ins-bg-stack" aria-hidden>
        <div className="ins-bg-orb" />
      </div>

      <div className="ins-login-wrap">
        <div className="ins-login-card">
          <span className="ins-login-eyebrow">S7 Labs · Insights</span>
          <h1>Set a new password.</h1>
          <p>
            Minimum 8 characters. After this, you&apos;ll be signed straight into the dashboard.
          </p>

          <form onSubmit={handleSubmit} noValidate autoComplete="off">
            <label className="ins-login-label" htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              disabled={disabled}
              onChange={(e) => {
                setPassword(e.target.value)
                if (status === 'error') {
                  setStatus('idle')
                  setMessage(null)
                }
              }}
              className={clsx('ins-login-input', { error: inputError })}
            />

            <label className="ins-login-label" htmlFor="confirm-password" style={{ marginTop: 14 }}>
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirm}
              disabled={disabled}
              onChange={(e) => {
                setConfirm(e.target.value)
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
                  error: status === 'error' || status === 'no-session',
                  success: status === 'success',
                })}
              >
                {message}
              </div>
            ) : (
              <div className="ins-login-help">Pick something you&apos;ll remember.</div>
            )}

            <button type="submit" className="ins-login-btn" disabled={disabled}>
              {status === 'busy' ? 'Updating…' : status === 'success' ? 'Done' : 'Update password'}
            </button>
          </form>

          <div className="ins-login-meta">Powered by S7</div>
        </div>
      </div>
    </div>
  )
}

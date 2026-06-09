'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import styles from './unsubscribe.module.css'

type Props = {
  token: string
}

type ApiResponse = {
  ok: boolean
  alreadyUnsubscribed?: boolean
  error?: string
}

export function ConfirmButton({ token }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleClick() {
    setSubmitting(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/leads/unsubscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const json = (await res.json()) as ApiResponse
      if (!res.ok || !json.ok) {
        setErrorMsg(json.error || 'Something went wrong. Try again.')
        setSubmitting(false)
        return
      }
      router.replace(`/unsubscribe?token=${encodeURIComponent(token)}&done=true`)
      router.refresh()
    } catch {
      setErrorMsg('Network error. Try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.actionRow}>
      <button
        type="button"
        className={styles.primaryButton}
        onClick={handleClick}
        disabled={submitting}
      >
        {submitting ? 'Unsubscribing…' : 'Confirm unsubscribe'}
      </button>
      <span className={styles.fineprint}>
        {'// THIS WILL NOT AFFECT TRANSACTIONAL EMAILS LIKE MINI-APP RESULTS'}
      </span>
      {errorMsg ? <div className={styles.errorText}>{errorMsg}</div> : null}
    </div>
  )
}

export default ConfirmButton

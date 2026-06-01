'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { clearLeadCookies, getLeadFromBrowser } from '@/lib/leads/cookies'
import { EMAIL_REGEX } from '@/lib/leads/disposable'
import styles from './EmailGate.module.css'

type Enrichment = {
  name?: string
  company?: string
  role?: string
}

type RenderContext = {
  email: string
  leadId: string
  submitToApi: (input: object, output?: object) => Promise<void>
}

type Props = {
  miniAppSlug: string
  pattern: 'upfront' | 'after-teaser'
  teaser?: React.ReactNode
  children: (ctx: RenderContext) => React.ReactNode
  initialInput?: object
}

type SubmitResponse = {
  ok: boolean
  leadId?: string
  submissionId?: string
  isReturningLead?: boolean
  error?: string
}

function redactEmail(email: string): string {
  const at = email.indexOf('@')
  if (at < 1) return email
  const user = email.slice(0, at)
  const domain = email.slice(at + 1)
  const visible = user.slice(0, Math.min(2, user.length))
  const dot = domain.indexOf('.')
  const domainHead = dot > 0 ? domain.slice(0, 1) : domain
  return `${visible}••@${domainHead}•••`
}

export function EmailGate({ miniAppSlug, pattern, teaser, children, initialInput }: Props) {
  const [hydrated, setHydrated] = useState(false)
  const [email, setEmail] = useState('')
  const [leadId, setLeadId] = useState('')
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [gatePassed, setGatePassed] = useState(false)
  const [recognized, setRecognized] = useState(false)
  const [showOptional, setShowOptional] = useState(false)
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    // Cookies are only available on the client, so we must read them after mount.
    // The setState calls here are the intended hydration step, not a cascade.
    /* eslint-disable react-hooks/set-state-in-effect */
    const { email: cookieEmail, leadId: cookieLeadId } = getLeadFromBrowser()
    if (cookieEmail && cookieLeadId) {
      setEmail(cookieEmail)
      setLeadId(cookieLeadId)
      setGatePassed(true)
      setRecognized(true)
    }
    setHydrated(true)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  const submitToApi = useCallback(
    async (input: object, output?: object) => {
      if (!email) return
      if (output !== undefined && submissionId) {
        const res = await fetch('/api/leads/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ submissionId, output }),
        })
        if (!res.ok) {
          console.error('[EmailGate] complete failed', await res.text())
        }
        return
      }
      const res = await fetch('/api/leads/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, miniAppSlug, input, output }),
      })
      const json = (await res.json()) as SubmitResponse
      if (json.ok && json.submissionId) {
        setSubmissionId(json.submissionId)
      }
    },
    [email, miniAppSlug, submissionId]
  )

  const handleSwitchUser = useCallback(() => {
    clearLeadCookies()
    setEmail('')
    setLeadId('')
    setGatePassed(false)
    setRecognized(false)
    setSubmissionId(null)
    setEmailInput('')
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = emailInput.trim().toLowerCase()
      setErrorMsg(null)

      if (!EMAIL_REGEX.test(trimmed)) {
        setErrorMsg('Please enter a valid email')
        return
      }

      const enrichment: Enrichment = {}
      if (name.trim()) enrichment.name = name.trim()
      if (company.trim()) enrichment.company = company.trim()
      if (role.trim()) enrichment.role = role.trim()

      setSubmitting(true)
      try {
        const res = await fetch('/api/leads/submit', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email: trimmed,
            miniAppSlug,
            input: initialInput ?? {},
            enrichment,
          }),
        })
        const json = (await res.json()) as SubmitResponse
        if (!res.ok || !json.ok || !json.leadId) {
          setErrorMsg(json.error || "Couldn't save your info — try again")
          setSubmitting(false)
          return
        }
        setEmail(trimmed)
        setLeadId(json.leadId)
        if (json.submissionId) setSubmissionId(json.submissionId)
        setGatePassed(true)
        setRecognized(false)
      } catch {
        setErrorMsg("Couldn't save your info — try again")
      } finally {
        setSubmitting(false)
      }
    },
    [emailInput, name, company, role, miniAppSlug, initialInput]
  )

  const renderCtx = useMemo<RenderContext>(
    () => ({ email, leadId, submitToApi }),
    [email, leadId, submitToApi]
  )

  if (!hydrated) {
    // Avoid SSR/CSR mismatch — render nothing until cookies are read
    return null
  }

  if (gatePassed) {
    return (
      <>
        {recognized ? (
          <div className={styles.welcomeBar} role="status">
            <span>Recognized · {redactEmail(email)}</span>
            <button type="button" className={styles.switch} onClick={handleSwitchUser}>
              Switch user
            </button>
          </div>
        ) : null}
        {children(renderCtx)}
      </>
    )
  }

  const gate = (
    <div className={styles.gateWrap}>
      <form className={styles.gate} onSubmit={handleSubmit} noValidate>
        <div className={styles.fieldRow}>
          <label className={styles.label} htmlFor="emailgate-email">
            {'// EMAIL · REQUIRED'}
          </label>
          <input
            id="emailgate-email"
            className={styles.input}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={emailInput}
            disabled={submitting}
            onChange={(e) => setEmailInput(e.target.value)}
            required
          />
        </div>

        <button
          type="button"
          className={styles.optionalToggle}
          onClick={() => setShowOptional((v) => !v)}
          aria-expanded={showOptional}
        >
          {showOptional ? '− Hide name / company' : '+ Add name / company'}
        </button>

        {showOptional ? (
          <div className={styles.optionalFields}>
            <input
              className={styles.input}
              type="text"
              placeholder="Name"
              autoComplete="name"
              value={name}
              disabled={submitting}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className={styles.input}
              type="text"
              placeholder="Company"
              autoComplete="organization"
              value={company}
              disabled={submitting}
              onChange={(e) => setCompany(e.target.value)}
            />
            <input
              className={styles.input}
              type="text"
              placeholder="Role"
              autoComplete="organization-title"
              value={role}
              disabled={submitting}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
        ) : null}

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={submitting}
          style={{ marginTop: 14 }}
        >
          {submitting ? (
            <>
              <span className={styles.spinner} aria-hidden="true" />
              Saving…
            </>
          ) : pattern === 'after-teaser' ? (
            'See the full result'
          ) : (
            'Continue'
          )}
        </button>

        {errorMsg ? <div className={styles.errorText}>{errorMsg}</div> : null}

        <div className={styles.smallNote}>Used by founders this week. We won&apos;t spam you.</div>
      </form>
    </div>
  )

  if (pattern === 'after-teaser') {
    return (
      <>
        {teaser}
        {gate}
      </>
    )
  }

  return gate
}

export default EmailGate

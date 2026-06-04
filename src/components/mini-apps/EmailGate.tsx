'use client'

import { useCallback, useMemo, useState } from 'react'

import { EMAIL_REGEX } from '@/lib/leads/disposable'

import styles from './EmailGate.module.css'

type Enrichment = {
  name?: string
  company?: string
  role?: string
}

type SubmitCost = {
  model: string
  inputTokens: number
  outputTokens: number
  costUsd: number
}

type RenderContext = {
  email: string
  leadId: string
  submitToApi: (input: object, output?: object, cost?: SubmitCost) => Promise<void>
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

export function EmailGate({ miniAppSlug, pattern, teaser, children, initialInput }: Props) {
  const [email, setEmail] = useState('')
  const [leadId, setLeadId] = useState('')
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [gatePassed, setGatePassed] = useState(false)
  const [showOptional, setShowOptional] = useState(false)
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const submitToApi = useCallback(
    async (input: object, output?: object, cost?: SubmitCost) => {
      if (!email) return
      if (output !== undefined && submissionId) {
        const res = await fetch('/api/leads/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ submissionId, output, ...(cost ? { cost } : {}) }),
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

  if (gatePassed) {
    return <>{children(renderCtx)}</>
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

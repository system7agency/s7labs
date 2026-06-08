'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'

import { clsx } from 'clsx'
import './page-styles.css'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { HowItWorks, type HowItWorksStep } from '@/components/mini-apps/HowItWorks'
import { EMAIL_REGEX } from '@/lib/leads/disposable'

import type { ApiResponse, EmailFinderResult } from '@/app/api/mini-apps/email-finder/route'
import { PageScripts } from './PageScripts'

// ---------- feature flag ----------

/**
 * Flip to `true` once APOLLO_API_KEY is provisioned with a paid plan that
 * includes the /people/match endpoint. Until then the form is read-only and
 * users see a "coming soon" notice instead of hitting the API and getting a
 * 502.
 */
const APP_ENABLED = false

// ---------- helpers ----------

const DOMAIN_RE = /^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i
const LINKEDIN_RE = /^https?:\/\/(?:www\.)?linkedin\.com\/(?:company|school)\/[a-z0-9-]+\/?/i

function isValidCompany(value: string): boolean {
  const v = value.trim().toLowerCase()
  if (LINKEDIN_RE.test(v)) return true
  const bare =
    v
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0] ?? ''
  return DOMAIN_RE.test(bare)
}

function fmtTs(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `VERIFIED · ${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} · ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
}

const STAGES = [
  {
    num: '01',
    title: 'Parsing input',
    logs: ['validating name', 'checking company format', 'input parsed'],
  },
  {
    num: '02',
    title: 'Querying Apollo',
    logs: ['matching person', 'verifying domain', 'response received'],
  },
  {
    num: '03',
    title: 'Verifying email',
    logs: ['checking deliverability', 'cross-referencing sources', 'email verified'],
  },
  {
    num: '04',
    title: 'Composing result',
    logs: ['mapping fields', 'scoring confidence', 'result ready'],
  },
] as const

const STAGE_DURATION_MS = 1800

const HIW_STEPS: HowItWorksStep[] = [
  {
    title: 'Enter a name and company',
    description:
      'Full name plus a domain (stripe.com) or a LinkedIn company URL. That is the entire setup.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 9h18" />
        <path d="M7 13h8" />
      </svg>
    ),
  },
  {
    title: 'We query Apollo’s people database',
    description:
      'Real-time match across 200M+ contacts. If you pass a LinkedIn URL we resolve it to a domain first.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 7l9-4 9 4-9 4-9-4z" />
        <path d="M3 12l9 4 9-4" />
        <path d="M3 17l9 4 9-4" />
      </svg>
    ),
  },
  {
    title: 'Email status is mapped to a confidence score',
    description:
      'Verified addresses are HIGH, likely-to-engage are MEDIUM, guessed are LOW. Anything weaker we return as no-result.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
      </svg>
    ),
  },
  {
    title: 'Get the verified email with one click to copy',
    description:
      'Name, title, company domain, and LinkedIn URL come back alongside, ready to drop into your sequencer.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 11l3 3 8-8" />
        <path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9" />
      </svg>
    ),
  },
]

// ---------- inner lookup runner (rendered inside EmailGate's children) ----------

type LookupState = 'loading' | 'result' | 'no-result' | 'error'

type LookupInput = { name: string; company: string }

function LookupRunner({
  input,
  submissionId,
  onReset,
}: {
  input: LookupInput
  submissionId: string
  onReset: () => void
}) {
  const [state, setState] = useState<LookupState>('loading')
  const [result, setResult] = useState<EmailFinderResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [progressPct, setProgressPct] = useState(0)
  const [loadingPct, setLoadingPct] = useState('0%')
  const [latency, setLatency] = useState('0.0s')
  const [activeStage, setActiveStage] = useState(0)
  const [doneStages, setDoneStages] = useState<number[]>([])
  const [stageLogs, setStageLogs] = useState<string[]>(['', '', '', ''])
  const [copied, setCopied] = useState(false)
  const [resultTs, setResultTs] = useState('')
  const [clock, setClock] = useState('—')
  const [sysState, setSysState] = useState('running')

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef(0)
  const firedRef = useRef(false)

  // Live clock
  useEffect(() => {
    const tick = () => {
      const d = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      setClock(`${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}Z`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current = []
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  // Kick off Apollo lookup + animation on mount (once).
  useEffect(() => {
    if (firedRef.current) return
    firedRef.current = true

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const startTime = performance.now()
    startTimeRef.current = startTime
    const totalMs = STAGE_DURATION_MS * STAGES.length

    if (!prefersReduced) {
      const tick = (now: number) => {
        const elapsed = now - startTime
        const pct = Math.min(98, (elapsed / totalMs) * 100)
        setProgressPct(pct)
        setLoadingPct(Math.floor(pct) + '%')
        setLatency((elapsed / 1000).toFixed(1) + 's')
        if (pct < 98) rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    STAGES.forEach((stage, i) => {
      const tActivate = setTimeout(() => {
        setActiveStage(i)
        setStageLogs((prev) => {
          const next = [...prev]
          next[i] = stage.logs[0] ?? ''
          return next
        })
        stage.logs.forEach((log, li) => {
          if (li === 0) return
          const tLog = setTimeout(
            () => {
              setStageLogs((prev) => {
                const next = [...prev]
                next[i] = log
                return next
              })
            },
            (li * STAGE_DURATION_MS) / stage.logs.length
          )
          timersRef.current.push(tLog)
        })
      }, i * STAGE_DURATION_MS)
      timersRef.current.push(tActivate)
      const tDone = setTimeout(
        () => {
          setDoneStages((prev) => [...prev, i])
          setStageLogs((prev) => {
            const next = [...prev]
            next[i] = stage.logs[stage.logs.length - 1] ?? ''
            return next
          })
        },
        (i + 1) * STAGE_DURATION_MS
      )
      timersRef.current.push(tDone)
    })

    // Fire the actual API call in parallel with the animation.
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/mini-apps/email-finder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
        const data = (await res.json()) as ApiResponse
        if (cancelled) return

        // Wait for at least 2 stages to have visually played before flipping state.
        const elapsed = performance.now() - startTime
        const minAnim = STAGE_DURATION_MS * 2
        if (elapsed < minAnim) {
          await new Promise((r) => setTimeout(r, minAnim - elapsed))
        }
        if (cancelled) return

        clearTimers()
        setProgressPct(100)
        setLoadingPct('100%')
        setActiveStage(STAGES.length - 1)
        setDoneStages([0, 1, 2, 3])

        if (!data.ok) {
          setErrorMsg(data.error)
          setSysState('error')
          setState('error')
          return
        }

        if (data.result === null) {
          setSysState('complete')
          setState('no-result')
          // Record the no-result submission too
          fetch('/api/leads/complete', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ submissionId, output: { result: null } }),
          }).catch((err) => console.error('[email-finder] leads/complete', err))
          return
        }

        setResult(data.result)
        setResultTs(fmtTs(new Date()))
        setSysState('complete')
        setState('result')
        fetch('/api/leads/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ submissionId, output: data.result }),
        }).catch((err) => console.error('[email-finder] leads/complete', err))
      } catch {
        if (cancelled) return
        clearTimers()
        setErrorMsg('Network error. Please check your connection and try again.')
        setSysState('error')
        setState('error')
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCopy = useCallback(async () => {
    if (!result?.email) return
    try {
      await navigator.clipboard.writeText(result.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // ignore clipboard failures
    }
  }, [result])

  return (
    <div className="panel-body">
      {/* Loading */}
      <section className={clsx('ef-state', { active: state === 'loading' })}>
        <div className="progress-track">
          <div className="progress-bar" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="loading-header">
          <span>
            Looking up <strong>{input.name}</strong>
          </span>
          <span>{loadingPct}</span>
        </div>
        <div className="stages">
          {STAGES.map((s, i) => {
            const isActive = activeStage === i && !doneStages.includes(i)
            const isDone = doneStages.includes(i)
            return (
              <div key={s.num} className={clsx('stage', { active: isActive, done: isDone })}>
                <div className="stage-num-row">
                  <span>{s.num}</span>
                  <span className="stage-status-icon">
                    <svg viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6.5l2.5 2.5L10 3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
                <div className="stage-title">{s.title}</div>
                <div className="stage-log">{stageLogs[i]}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Result */}
      <section className={clsx('ef-state', { active: state === 'result' })}>
        {result && (
          <>
            <div className="result-head">
              <span className="title">Email found</span>
              <span className="ts-label">{resultTs}</span>
            </div>

            <div className="ef-email-hero">
              <div className="ef-email-row">
                <span className="ef-email">{result.email}</span>
                <span
                  className={clsx('ef-confidence', {
                    high: result.confidence === 'HIGH',
                    medium: result.confidence === 'MEDIUM',
                    low: result.confidence === 'LOW',
                  })}
                >
                  {result.confidence}
                </span>
                <button
                  type="button"
                  className={clsx('ef-copy-btn', { copied })}
                  onClick={handleCopy}
                  aria-label="Copy email to clipboard"
                >
                  {copied ? (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="ef-meta-grid">
              <div className="ef-meta-item">
                <span className="ef-meta-label">Full name</span>
                <span className="ef-meta-value">{result.fullName}</span>
              </div>
              <div className="ef-meta-item">
                <span className="ef-meta-label">Title</span>
                <span className="ef-meta-value">{result.title ?? '—'}</span>
              </div>
              <div className="ef-meta-item">
                <span className="ef-meta-label">Company</span>
                <span className="ef-meta-value">
                  {result.companyName || result.companyDomain || '—'}
                </span>
              </div>
              <div className="ef-meta-item">
                <span className="ef-meta-label">LinkedIn</span>
                <span className="ef-meta-value">
                  {result.linkedinUrl ? (
                    <a href={result.linkedinUrl} target="_blank" rel="noopener noreferrer">
                      View profile →
                    </a>
                  ) : (
                    '—'
                  )}
                </span>
              </div>
            </div>

            <div className="ef-verified-line">Verified via Apollo</div>

            <div className="ef-result-footer">
              <button type="button" className="ef-run-again" onClick={onReset}>
                Run another
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M13 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </>
        )}
      </section>

      {/* No-result */}
      <section className={clsx('ef-state', { active: state === 'no-result' })}>
        <div className="ef-no-result">
          <div className="ef-no-result-glyph">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </div>
          <h2>No verified email found for this person.</h2>
          <p>
            This usually means they’re not publicly indexed yet. Try a different name spelling, or
            use their LinkedIn URL instead.
          </p>
          <div className="ef-result-footer">
            <button type="button" className="ef-run-again" onClick={onReset}>
              Try again
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="M13 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Error */}
      <section className={clsx('ef-state', 'error-state', { active: state === 'error' })}>
        <div className="err-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="13" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="err-title">Lookup failed</h2>
        <p className="err-msg">{errorMsg}</p>
        <div className="ef-result-footer">
          <button type="button" className="ef-run-again" onClick={onReset}>
            Try again
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M13 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      {/* Hidden status props used by panel-readouts */}
      <span hidden data-sys={sysState} data-lat={latency} data-clock={clock} />
    </div>
  )
}

// ---------- main page ----------

type IdleErrors = { name?: string; company?: string }

export default function EmailFinderPage() {
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [shakeEmail, setShakeEmail] = useState(0)
  const [errors, setErrors] = useState<IdleErrors>({})
  const [shakeKey, setShakeKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submittedInput, setSubmittedInput] = useState<LookupInput | null>(null)
  const [submissionId, setSubmissionId] = useState<string | null>(null)

  const nameRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!submittedInput) {
      const t = setTimeout(() => nameRef.current?.focus(), 200)
      return () => clearTimeout(t)
    }
  }, [submittedInput])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (!APP_ENABLED) return
      if (submitting) return
      const trimmedName = name.trim()
      const trimmedCompany = company.trim()
      const trimmedEmail = email.trim().toLowerCase()
      const next: IdleErrors = {}
      let hasError = false
      if (trimmedName.length < 2) {
        next.name = 'Please enter a full name.'
        hasError = true
      } else if (trimmedName.length > 100) {
        next.name = 'Name is too long.'
        hasError = true
      }
      if (!trimmedCompany) {
        next.company = 'Please enter a company.'
        hasError = true
      } else if (!isValidCompany(trimmedCompany)) {
        next.company = 'Use a domain (stripe.com) or a LinkedIn company URL.'
        hasError = true
      }
      let localEmailError: string | null = null
      if (!trimmedEmail) {
        localEmailError = 'Please enter your work email.'
        hasError = true
      } else if (!EMAIL_REGEX.test(trimmedEmail)) {
        localEmailError = 'Please enter a valid email.'
        hasError = true
      }
      setEmailError(localEmailError)
      if (hasError) {
        setErrors(next)
        setShakeKey((k) => k + 1)
        if (localEmailError) setShakeEmail((k) => k + 1)
        return
      }
      setErrors({})

      const lookupInput: LookupInput = { name: trimmedName, company: trimmedCompany }

      setSubmitting(true)

      // 1) Save the lead first.
      let newSubmissionId: string | null = null
      try {
        const res = await fetch('/api/leads/submit', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email: trimmedEmail,
            miniAppSlug: 'email-finder',
            input: lookupInput,
          }),
        })
        const json = (await res.json()) as {
          ok: boolean
          submissionId?: string
          error?: string
        }
        if (!res.ok || !json.ok || !json.submissionId) {
          setEmailError(json.error || "Couldn't save your info. Try again.")
          setShakeEmail((k) => k + 1)
          setSubmitting(false)
          return
        }
        newSubmissionId = json.submissionId
      } catch {
        setEmailError("Couldn't save your info. Try again.")
        setShakeEmail((k) => k + 1)
        setSubmitting(false)
        return
      }

      setSubmissionId(newSubmissionId)
      setSubmittedInput(lookupInput)
      setSubmitting(false)
    },
    [name, company, email, submitting]
  )

  const handleReset = useCallback(() => {
    setSubmittedInput(null)
    setSubmissionId(null)
    setName('')
    setCompany('')
    setErrors({})
    setEmailError(null)
  }, [])

  return (
    <div className="email-finder">
      <AuroraBackground />

      <Header />

      <main className="shell">
        {/* Hero */}
        <section className="hero">
          <span className="eyebrow">Email Finder</span>
          <h1>
            Find anyone’s <span className="accent">verified work email</span> in seconds.
          </h1>
          <p>
            Drop in a name and company. We hit Apollo’s people database in real time and hand back a
            verified address with a confidence score, ready to drop into your sequencer.
          </p>
        </section>

        {/* Panel */}
        <div className="panel-wrap">
          <div className="panel">
            {submittedInput && submissionId ? (
              <LookupRunner
                input={submittedInput}
                submissionId={submissionId}
                onReset={handleReset}
              />
            ) : (
              <div className="panel-body">
                <section className="ef-state active">
                  <div className="idle-label">Person to find</div>
                  <form
                    key={shakeKey}
                    className="ef-form-grid"
                    onSubmit={handleSubmit}
                    noValidate
                    autoComplete="off"
                  >
                    <div>
                      <label className="ef-field-label" htmlFor="ef-name">
                        Full name
                      </label>
                      <div className={clsx('ef-text-box', { error: !!errors.name })}>
                        <input
                          ref={nameRef}
                          id="ef-name"
                          type="text"
                          placeholder="Jane Smith"
                          value={name}
                          maxLength={100}
                          onChange={(e) => {
                            setName(e.target.value)
                            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                          }}
                        />
                      </div>
                      {errors.name ? <div className="ef-helper error">{errors.name}</div> : null}
                    </div>

                    <div>
                      <label className="ef-field-label" htmlFor="ef-company">
                        Company
                      </label>
                      <div className={clsx('ef-text-box', { error: !!errors.company })}>
                        <input
                          id="ef-company"
                          type="text"
                          placeholder="stripe.com or https://linkedin.com/company/stripe"
                          value={company}
                          onChange={(e) => {
                            setCompany(e.target.value)
                            if (errors.company)
                              setErrors((prev) => ({ ...prev, company: undefined }))
                          }}
                        />
                      </div>
                      <div className={clsx('ef-helper', { error: !!errors.company })}>
                        {errors.company ?? 'Domain or LinkedIn company URL.'}
                      </div>
                    </div>

                    <div className="input-field" style={{ marginTop: 14 }}>
                      <label>
                        Work email <span style={{ color: 'var(--error, #ff5c7a)' }}>*</span>
                      </label>
                      <div
                        key={`e-${shakeEmail}`}
                        className={clsx('input-box', { error: emailError })}
                      >
                        <input
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          placeholder="you@company.com"
                          value={email}
                          disabled={submitting || !APP_ENABLED}
                          onChange={(e) => {
                            setEmail(e.target.value)
                            if (emailError) setEmailError(null)
                          }}
                        />
                      </div>
                      {emailError && <div className="field-error">{emailError}</div>}
                    </div>

                    {!APP_ENABLED ? (
                      <div className="ef-coming-soon" role="status">
                        <span className="ef-coming-soon-dot" />
                        Coming soon. Apollo API access in review. Form is read-only for now.
                      </div>
                    ) : null}

                    <div className="ef-submit-row" style={{ marginTop: 18 }}>
                      <button
                        type="submit"
                        className="ef-submit-btn"
                        disabled={!APP_ENABLED || submitting}
                        aria-disabled={!APP_ENABLED || submitting}
                      >
                        {APP_ENABLED ? 'Find Email' : 'Coming soon'}
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12h14" />
                          <path d="M13 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </form>
                </section>
              </div>
            )}
          </div>
        </div>

        <HowItWorks
          title={
            <>
              From name + company to <span className="accent">verified email</span>
            </>
          }
          subtitle="No login, no install. Four steps from input to a working address."
          steps={HIW_STEPS}
        />
      </main>

      <Footer />
      <PageScripts />
    </div>
  )
}

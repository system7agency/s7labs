'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'

import { clsx } from 'clsx'
import './page-styles.css'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { HowItWorks, type HowItWorksStep } from '@/components/mini-apps/HowItWorks'
import { EMAIL_REGEX } from '@/lib/leads/disposable'

import type {
  ApiResponse,
  Department,
  FindPeopleResult,
  Person,
  Seniority,
} from '@/app/api/mini-apps/find-people/types'

import { EmployeeCard } from './components/EmployeeCard'
import { PageScripts } from './PageScripts'

// ---------- kill-switch ----------

/**
 * Flip via env: NEXT_PUBLIC_FIND_PEOPLE_ENABLED=true in Vercel + .env.local
 * once the Apollo integration lands. Off by default so the form is read-only
 * until then. See SYS-521.
 */
const APP_ENABLED = process.env.NEXT_PUBLIC_FIND_PEOPLE_ENABLED === 'true'

// ---------- constants ----------

type AppState = 'idle' | 'loading' | 'result' | 'no-result' | 'error'

const SENIORITIES: Array<'All' | Seniority> = [
  'All',
  'C-suite',
  'VP',
  'Director',
  'Manager',
  'Individual',
]
const DEPARTMENTS: Array<'All' | Department> = [
  'All',
  'Engineering',
  'Sales',
  'Marketing',
  'Product',
  'Operations',
  'Other',
]
const PAGE_INCREMENT = 25

const STAGES = [
  {
    num: '01',
    title: 'Parsing company input',
    logs: ['validating input', 'detecting domain', 'input parsed'],
  },
  {
    num: '02',
    title: 'Resolving company',
    logs: ['looking up org', 'verifying domain', 'company resolved'],
  },
  {
    num: '03',
    title: 'Searching employees',
    logs: ['querying directory', 'filtering by role', 'employees ranked'],
  },
  {
    num: '04',
    title: 'Composing roster',
    logs: ['mapping fields', 'sorting by seniority', 'result ready'],
  },
] as const

const STAGE_DURATION_MS = 1500

const HIW_STEPS: HowItWorksStep[] = [
  {
    title: 'Enter a company',
    description: 'A domain (stripe.com) or just the company name. We resolve it either way.',
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
    title: 'We pull a live employee roster',
    description:
      'Real-time match against a 200M+ contact graph, scoped to the company you searched.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="11" r="2.5" />
        <path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
        <path d="M15 19c0-2 2-3 4-3s3 1 3 3" />
      </svg>
    ),
  },
  {
    title: 'Filter by seniority and department',
    description: 'Quickly narrow to the buying committee (C-suite, VPs, Directors) or by team.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 6h18" />
        <path d="M7 12h10" />
        <path d="M11 18h2" />
      </svg>
    ),
  },
  {
    title: 'Open each profile on LinkedIn',
    description:
      'Click through to verify and start your outreach with full context. No copy-paste guesswork.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 14L21 3" />
        <path d="M21 3v7" />
        <path d="M21 3h-7" />
        <path d="M14 21H6a2 2 0 01-2-2V8a2 2 0 012-2h8" />
      </svg>
    ),
  },
]

function FilterPills({
  label,
  values,
  active,
  onChange,
}: {
  label: string
  values: readonly string[]
  active: string
  onChange: (next: string) => void
}) {
  return (
    <div className="fp-filter-row">
      <span className="fp-filter-label">{label}</span>
      {values.map((v) => (
        <button
          key={v}
          type="button"
          className={clsx('fp-pill', { active: active === v })}
          onClick={() => onChange(v)}
        >
          {v}
        </button>
      ))}
    </div>
  )
}

// ---------- main page ----------

export default function FindPeoplePage() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [company, setCompany] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [shakeKey, setShakeKey] = useState(0)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [shakeEmail, setShakeEmail] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<FindPeopleResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [submittedCompany, setSubmittedCompany] = useState('')

  const [progressPct, setProgressPct] = useState(0)
  const [loadingPct, setLoadingPct] = useState('0%')
  const [activeStage, setActiveStage] = useState(0)
  const [doneStages, setDoneStages] = useState<number[]>([])
  const [stageLogs, setStageLogs] = useState<string[]>(['', '', '', ''])

  // Filter + pagination state
  const [seniority, setSeniority] = useState<string>('All')
  const [department, setDepartment] = useState<string>('All')
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_INCREMENT)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (appState === 'idle') {
      const t = setTimeout(() => inputRef.current?.focus(), 200)
      return () => clearTimeout(t)
    }
  }, [appState])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current = []
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  const startLoadingAnimation = useCallback(() => {
    clearTimers()
    setActiveStage(0)
    setDoneStages([])
    setStageLogs(['', '', '', ''])
    setProgressPct(0)
    setLoadingPct('0%')

    const prefersReduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const startTime = performance.now()
    const totalMs = STAGE_DURATION_MS * STAGES.length

    if (!prefersReduced) {
      const tick = (now: number) => {
        const elapsed = now - startTime
        const pct = Math.min(98, (elapsed / totalMs) * 100)
        setProgressPct(pct)
        setLoadingPct(Math.floor(pct) + '%')
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
  }, [clearTimers])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (!APP_ENABLED) return
      if (submitting) return

      let valid = true
      const trimmed = company.trim()
      if (trimmed.length < 2) {
        setError('Please enter a valid company name or domain.')
        setShakeKey((k) => k + 1)
        valid = false
      } else if (trimmed.length > 200) {
        setError('That value is too long.')
        setShakeKey((k) => k + 1)
        valid = false
      }
      const emailClean = email.trim().toLowerCase()
      if (!emailClean) {
        setEmailError('Please enter your work email.')
        setShakeEmail((k) => k + 1)
        valid = false
      } else if (!EMAIL_REGEX.test(emailClean)) {
        setEmailError('Please enter a valid email.')
        setShakeEmail((k) => k + 1)
        valid = false
      }
      if (!valid) return

      setError(null)
      setEmailError(null)
      setSubmitting(true)
      setResult(null)
      setErrorMsg('')

      const input = { company: trimmed }

      // Step A: save lead FIRST
      let submissionId: string | null = null
      try {
        const res = await fetch('/api/leads/submit', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email: emailClean,
            miniAppSlug: 'find-people',
            input,
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
        submissionId = json.submissionId
      } catch {
        setEmailError("Couldn't save your info. Try again.")
        setShakeEmail((k) => k + 1)
        setSubmitting(false)
        return
      }

      // Step B: switch to loading state, start animation
      setSubmittedCompany(trimmed)
      setSeniority('All')
      setDepartment('All')
      setVisibleCount(PAGE_INCREMENT)
      setAppState('loading')
      startLoadingAnimation()

      const startTime = performance.now()
      let data: ApiResponse
      try {
        const res = await fetch('/api/mini-apps/find-people', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
        data = (await res.json()) as ApiResponse
      } catch {
        clearTimers()
        setErrorMsg('Network error. Please check your connection and try again.')
        setAppState('error')
        setSubmitting(false)
        return
      }

      const elapsed = performance.now() - startTime
      const minAnim = STAGE_DURATION_MS * 2
      if (elapsed < minAnim) {
        await new Promise((r) => setTimeout(r, minAnim - elapsed))
      }

      clearTimers()
      setProgressPct(100)
      setLoadingPct('100%')
      setActiveStage(STAGES.length - 1)
      setDoneStages([0, 1, 2, 3])

      // find-people is a non-LLM stub. Record ZERO_COST so model_used='none'.
      const zeroCost = { model: 'none', inputTokens: 0, outputTokens: 0, costUsd: 0 }

      if (!data.ok) {
        setErrorMsg(data.error)
        setAppState('error')
        setSubmitting(false)
        fetch('/api/leads/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            submissionId,
            status: 'failed',
            errorMessage: data.error?.slice(0, 500),
          }),
        }).catch((err) => console.error('[find-people] leads/complete fail', err))
        return
      }

      if (data.result.people.length === 0) {
        setAppState('no-result')
        setSubmitting(false)
        fetch('/api/leads/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            submissionId,
            output: { result: data.result },
            cost: zeroCost,
          }),
        }).catch((err) => console.error('[find-people] leads/complete', err))
        return
      }

      setResult(data.result)
      setAppState('result')
      setSubmitting(false)

      fetch('/api/leads/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          output: data.result,
          cost: zeroCost,
        }),
      }).catch((err) => console.error('[find-people] leads/complete', err))
    },
    [company, email, submitting, startLoadingAnimation, clearTimers]
  )

  const handleReset = useCallback(() => {
    clearTimers()
    setAppState('idle')
    setCompany('')
    setError(null)
    setEmailError(null)
    setResult(null)
    setErrorMsg('')
    setSubmitting(false)
    setProgressPct(0)
    setSeniority('All')
    setDepartment('All')
    setVisibleCount(PAGE_INCREMENT)
  }, [clearTimers])

  // Filtered people derived from result + filter state.
  const filteredPeople = useMemo<Person[]>(() => {
    if (!result) return []
    return result.people.filter((p) => {
      if (seniority !== 'All' && p.seniority !== seniority) return false
      if (department !== 'All' && p.department !== department) return false
      return true
    })
  }, [result, seniority, department])

  const visiblePeople = filteredPeople.slice(0, visibleCount)
  const canLoadMore = visibleCount < filteredPeople.length && visibleCount < 100

  return (
    <div className="find-people">
      <AuroraBackground />

      <Header />

      <main className="shell">
        <section className="hero">
          <span className="eyebrow">Find People</span>
          <h1>
            See <span className="accent">who actually works there</span> at any company.
          </h1>
          <p>
            Drop in a company. Get a live roster of employees with their roles, seniority,
            departments, and LinkedIn URLs, ready for your buying-committee mapping.
          </p>
        </section>

        <div className="panel-wrap">
          <div className="panel">
            <div className="panel-body">
              {/* IDLE */}
              <section className={clsx('fp-state', { active: appState === 'idle' })}>
                <div className="idle-label">Target company</div>
                <form
                  key={shakeKey}
                  className="fp-form"
                  onSubmit={handleSubmit}
                  noValidate
                  autoComplete="off"
                >
                  <div>
                    <label className="fp-field-label" htmlFor="fp-company">
                      Company name or domain
                    </label>
                    <div className={clsx('fp-text-box', { error: !!error })}>
                      <input
                        ref={inputRef}
                        id="fp-company"
                        type="text"
                        placeholder="stripe.com  ·  or  ·  Stripe"
                        value={company}
                        maxLength={200}
                        disabled={submitting}
                        onChange={(e) => {
                          setCompany(e.target.value)
                          if (error) setError(null)
                        }}
                      />
                    </div>
                    <div className={clsx('fp-helper', { error: !!error })}>
                      {error ?? 'Pass a domain (stripe.com) or just the company name.'}
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
                        disabled={submitting}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (emailError) setEmailError(null)
                        }}
                      />
                    </div>
                    {emailError && <div className="field-error">{emailError}</div>}
                  </div>

                  {!APP_ENABLED ? (
                    <div className="fp-coming-soon" role="status">
                      <span className="fp-coming-soon-dot" />
                      Coming soon. Apollo API access in review. Form is read-only for now.
                    </div>
                  ) : null}

                  <div className="fp-submit-row" style={{ marginTop: 18 }}>
                    <button
                      type="submit"
                      className="fp-submit-btn"
                      disabled={!APP_ENABLED || submitting}
                      aria-disabled={!APP_ENABLED}
                      title={!APP_ENABLED ? 'Coming soon: final wiring in progress' : undefined}
                    >
                      {APP_ENABLED ? 'Find People' : 'Coming soon'}
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

              {/* LOADING */}
              <section className={clsx('fp-state', { active: appState === 'loading' })}>
                <div className="progress-track">
                  <div className="progress-bar" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="loading-header">
                  <span>
                    Searching <strong>{submittedCompany}</strong>
                  </span>
                  <span>{loadingPct}</span>
                </div>
                <div className="stages">
                  {STAGES.map((s, i) => {
                    const isActive = activeStage === i && !doneStages.includes(i)
                    const isDone = doneStages.includes(i)
                    return (
                      <div
                        key={s.num}
                        className={clsx('stage', { active: isActive, done: isDone })}
                      >
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

              {/* RESULT */}
              <section className={clsx('fp-state', { active: appState === 'result' })}>
                {result && (
                  <>
                    <div className="fp-result-head">
                      <div>
                        <span className="company">{result.companyName}</span>
                        <span className="domain">{result.companyDomain}</span>
                      </div>
                      <span className="count">
                        Showing {visiblePeople.length} of ~{result.totalEmployees} employees
                      </span>
                    </div>

                    <div className="fp-filters">
                      <FilterPills
                        label="Seniority"
                        values={SENIORITIES}
                        active={seniority}
                        onChange={(v) => {
                          setSeniority(v)
                          setVisibleCount(PAGE_INCREMENT)
                        }}
                      />
                      <FilterPills
                        label="Department"
                        values={DEPARTMENTS}
                        active={department}
                        onChange={(v) => {
                          setDepartment(v)
                          setVisibleCount(PAGE_INCREMENT)
                        }}
                      />
                    </div>

                    <div className="fp-list">
                      {visiblePeople.map((p, i) => (
                        <EmployeeCard key={`${p.fullName}-${i}`} person={p} linkable />
                      ))}
                    </div>

                    <div className="fp-list-footer">
                      <span className="fp-pagination-info">
                        {visiblePeople.length} of {filteredPeople.length} shown
                      </span>
                      <button
                        type="button"
                        className="fp-load-more"
                        disabled={!canLoadMore}
                        onClick={() =>
                          setVisibleCount((c) =>
                            Math.min(c + PAGE_INCREMENT, filteredPeople.length, 100)
                          )
                        }
                      >
                        {canLoadMore ? 'Load more' : 'No more results'}
                      </button>
                    </div>

                    <div className="fp-list-footer">
                      <button type="button" className="fp-load-more" onClick={handleReset}>
                        Search another company
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ width: 12, height: 12, marginLeft: 6 }}
                        >
                          <path d="M5 12h14" />
                          <path d="M13 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </section>

              {/* NO RESULT */}
              <section className={clsx('fp-state', { active: appState === 'no-result' })}>
                <div className="fp-no-result">
                  <h2>No employees found for that company.</h2>
                  <p>Try a different domain, or use the full company name instead.</p>
                  <button type="button" className="fp-load-more" onClick={handleReset}>
                    Try again
                  </button>
                </div>
              </section>

              {/* ERROR */}
              <section
                className={clsx('fp-state', 'error-state', { active: appState === 'error' })}
              >
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
                <button type="button" className="fp-load-more" onClick={handleReset}>
                  Try again
                </button>
              </section>
            </div>
          </div>
        </div>

        <HowItWorks
          title={
            <>
              From a company name to a <span className="accent">live employee roster</span>
            </>
          }
          subtitle="No login, no install. Four steps from search to a ranked list of who to reach."
          steps={HIW_STEPS}
        />
      </main>

      <Footer />
      <PageScripts />
    </div>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'

import { clsx } from 'clsx'
import './page-styles.css'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { EmailGate } from '@/components/mini-apps/EmailGate'
import { HowItWorks, type HowItWorksStep } from '@/components/mini-apps/HowItWorks'
import { SubmitOnce } from '@/components/mini-apps/SubmitOnce'

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
const PAGE_SIZE = 3 // First 3 visible before email gate
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
    description: 'Quickly narrow to the buying committee — C-suite, VPs, Directors — or by team.',
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
      'Click through to verify and start your outreach with full context — no copy-paste guesswork.',
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

// ---------- inner lookup runner ----------

type LookupState = 'loading' | 'result' | 'no-result' | 'error'

type LookupInput = { company: string }

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

function LookupRunner({
  input,
  submitToApi,
  onReset,
}: {
  input: LookupInput
  submitToApi: (i: object, o?: object) => Promise<void>
  onReset: () => void
}) {
  const [state, setState] = useState<LookupState>('loading')
  const [result, setResult] = useState<FindPeopleResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [progressPct, setProgressPct] = useState(0)
  const [loadingPct, setLoadingPct] = useState('0%')
  const [activeStage, setActiveStage] = useState(0)
  const [doneStages, setDoneStages] = useState<number[]>([])
  const [stageLogs, setStageLogs] = useState<string[]>(['', '', '', ''])

  // Filter + pagination state
  const [seniority, setSeniority] = useState<string>('All')
  const [department, setDepartment] = useState<string>('All')
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE)
  const [emailVerified, setEmailVerified] = useState(false)

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const rafRef = useRef<number | null>(null)
  const firedRef = useRef(false)

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current = []
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  // Kick off animation + API on mount, once.
  useEffect(() => {
    if (firedRef.current) return
    firedRef.current = true

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
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

    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/mini-apps/find-people', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
        const data = (await res.json()) as ApiResponse
        if (cancelled) return

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
          setState('error')
          return
        }

        if (data.result.people.length === 0) {
          setState('no-result')
          void submitToApi(input, { result: data.result })
          return
        }

        setResult(data.result)
        setState('result')
        void submitToApi(input, data.result)
      } catch {
        if (cancelled) return
        clearTimers()
        setErrorMsg('Network error. Please check your connection and try again.')
        setState('error')
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
  const blurredPeople = !emailVerified ? filteredPeople.slice(PAGE_SIZE, PAGE_SIZE + 6) : []
  const canLoadMore = emailVerified && visibleCount < filteredPeople.length && visibleCount < 100

  return (
    <div className="panel-body">
      {/* Loading */}
      <section className={clsx('fp-state', { active: state === 'loading' })}>
        <div className="progress-track">
          <div className="progress-bar" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="loading-header">
          <span>
            Searching <strong>{input.company}</strong>
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
      <section className={clsx('fp-state', { active: state === 'result' })}>
        {result && (
          <>
            <SubmitOnce submit={submitToApi} input={input} output={result} />

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
                  setVisibleCount(PAGE_SIZE)
                }}
              />
              <FilterPills
                label="Department"
                values={DEPARTMENTS}
                active={department}
                onChange={(v) => {
                  setDepartment(v)
                  setVisibleCount(PAGE_SIZE)
                }}
              />
            </div>

            <div className="fp-list">
              {visiblePeople.map((p, i) => (
                <EmployeeCard key={`${p.fullName}-${i}`} person={p} linkable />
              ))}
            </div>

            {!emailVerified && filteredPeople.length > PAGE_SIZE ? (
              <div className="fp-gate-zone blurred">
                <div className="fp-blur-list">
                  {blurredPeople.length > 0
                    ? blurredPeople.map((p, i) => (
                        <EmployeeCard key={`blur-${i}`} person={p} linkable={false} />
                      ))
                    : null}
                </div>
                <div className="fp-gate-overlay">
                  <div className="fp-gate-card">
                    <div className="fp-gate-eyebrow">{'// Email gate'}</div>
                    <h3 className="fp-gate-title">
                      Enter your email to see all {filteredPeople.length} employees
                    </h3>
                    <EmailGate miniAppSlug="find-people" pattern="upfront" initialInput={input}>
                      {({ submitToApi: inner }) => {
                        // Once children renders, gate has passed. Mark verified
                        // and record completion to /api/leads/complete.
                        return (
                          <GatePass
                            onReady={() => {
                              setEmailVerified(true)
                              setVisibleCount(Math.min(PAGE_INCREMENT, filteredPeople.length))
                              void inner(input, result)
                            }}
                          />
                        )
                      }}
                    </EmailGate>
                  </div>
                </div>
              </div>
            ) : (
              <div className="fp-list-footer">
                <span className="fp-pagination-info">
                  {visiblePeople.length} of {filteredPeople.length} shown
                </span>
                <button
                  type="button"
                  className="fp-load-more"
                  disabled={!canLoadMore}
                  onClick={() =>
                    setVisibleCount((c) => Math.min(c + PAGE_INCREMENT, filteredPeople.length, 100))
                  }
                >
                  {canLoadMore ? 'Load more' : 'No more results'}
                </button>
              </div>
            )}

            <div className="fp-list-footer">
              <button type="button" className="fp-load-more" onClick={onReset}>
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

      {/* No result */}
      <section className={clsx('fp-state', { active: state === 'no-result' })}>
        <div className="fp-no-result">
          <h2>No employees found for that company.</h2>
          <p>Try a different domain, or use the full company name instead.</p>
          <button type="button" className="fp-load-more" onClick={onReset}>
            Try again
          </button>
        </div>
      </section>

      {/* Error */}
      <section className={clsx('fp-state error-state', { active: state === 'error' })}>
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
        <button type="button" className="fp-load-more" onClick={onReset}>
          Try again
        </button>
      </section>
    </div>
  )
}

// Helper that fires onReady exactly once when rendered (after EmailGate passes).
function GatePass({ onReady }: { onReady: () => void }) {
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    onReady()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

// ---------- main page ----------

export default function FindPeoplePage() {
  const [company, setCompany] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [shakeKey, setShakeKey] = useState(0)
  const [submittedInput, setSubmittedInput] = useState<LookupInput | null>(null)

  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!submittedInput) {
      const t = setTimeout(() => inputRef.current?.focus(), 200)
      return () => clearTimeout(t)
    }
  }, [submittedInput])

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      if (!APP_ENABLED) return
      const trimmed = company.trim()
      if (trimmed.length < 2) {
        setError('Please enter a valid company name or domain.')
        setShakeKey((k) => k + 1)
        return
      }
      if (trimmed.length > 200) {
        setError('That value is too long.')
        setShakeKey((k) => k + 1)
        return
      }
      setError(null)
      setSubmittedInput({ company: trimmed })
    },
    [company]
  )

  const handleReset = useCallback(() => {
    setSubmittedInput(null)
    setCompany('')
    setError(null)
  }, [])

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
            departments, and LinkedIn URLs — ready for your buying-committee mapping.
          </p>
        </section>

        <div className="panel-wrap">
          <div className="panel">
            {submittedInput ? (
              <LookupRunner
                input={submittedInput}
                submitToApi={async () => {
                  /* Inner submitToApi is provided by the per-render EmailGate. */
                }}
                onReset={handleReset}
              />
            ) : (
              <div className="panel-body">
                <section className="fp-state active">
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

                    {!APP_ENABLED ? (
                      <div className="fp-coming-soon" role="status">
                        <span className="fp-coming-soon-dot" />
                        Coming soon — Apollo API access in review. Form is read-only for now.
                      </div>
                    ) : null}

                    <div className="fp-submit-row">
                      <button
                        type="submit"
                        className="fp-submit-btn"
                        disabled={!APP_ENABLED}
                        aria-disabled={!APP_ENABLED}
                        title={!APP_ENABLED ? 'Coming soon — final wiring in progress' : undefined}
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
              </div>
            )}
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

'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'

import './page-styles.css'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

import { PageScripts } from './PageScripts'

type AppState = 'cta' | 'email' | 'cards' | 'success'

type Stage = {
  num: string
  label: string
  status: string
  icon: 'globe' | 'crosshair' | 'radar' | 'database' | 'users' | 'file'
}

const STAGES: Stage[] = [
  { num: '01', label: "Reading your company's website", status: 'parsing', icon: 'globe' },
  { num: '02', label: 'Inferring your ICP', status: 'analyzing', icon: 'crosshair' },
  { num: '03', label: 'Identifying competitors', status: 'scanning', icon: 'radar' },
  { num: '04', label: 'Searching sample accounts', status: 'querying', icon: 'database' },
  { num: '05', label: 'Finding sample contacts', status: 'matching', icon: 'users' },
  { num: '06', label: 'Compiling your report', status: 'compiling', icon: 'file' },
]

const STAGE_DURATION_MS = 1400
const STAGE_TAIL_MS = 500
const SUCCESS_DELAY_MS = 600

function validateEmailFormat(value: string): { ok: true } | { ok: false; msg: string } {
  const v = (value || '').trim().toLowerCase()
  if (!v) return { ok: false, msg: 'Please enter your work email.' }
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  if (!re.test(v)) return { ok: false, msg: 'Please enter a valid email address.' }
  return { ok: true }
}

type SubmitResponse =
  | { ok: true; state: 'processing' | 'cached'; message: string }
  | { ok: false; state: 'rejected'; reason: string; message: string }
  | { ok: false; state: 'error'; message: string }

const READOUT_TL: Record<AppState, string> = {
  cta: '// IDLE',
  email: '// AWAITING EMAIL',
  cards: '// SYNTHESIZING',
  success: '// DELIVERED',
}
const READOUT_TR: Record<AppState, string> = {
  cta: 'READY',
  email: 'INPUT',
  cards: 'LIVE',
  success: 'OK',
}

function StageGlyph({ icon }: { icon: Stage['icon'] }) {
  switch (icon) {
    case 'globe':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
      )
    case 'crosshair':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      )
    case 'radar':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19.07 4.93A10 10 0 1 0 12 22" />
          <path d="M12 12L19 5" />
          <circle cx="12" cy="12" r="1.5" />
        </svg>
      )
    case 'database':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
          <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
        </svg>
      )
    case 'users':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2 20c0-3.5 3.13-6 7-6s7 2.5 7 6" />
          <circle cx="17" cy="7" r="2.6" />
          <path d="M22 18c0-2.6-2.2-4.6-5-4.6" />
        </svg>
      )
    case 'file':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <path d="M14 3v6h6" />
          <path d="M8 13h8M8 17h6" />
        </svg>
      )
  }
}

function CheckIcon() {
  return (
    <svg
      className="check-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12l5 5 9-11" />
    </svg>
  )
}

export default function RevOpsPage() {
  const [appState, setAppState] = useState<AppState>('cta')
  const [email, setEmail] = useState('')
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [shakeKey, setShakeKey] = useState(0)
  const [activeStage, setActiveStage] = useState(0)
  const [allComplete, setAllComplete] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const stageTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const prefersReducedRef = useRef(false)

  useEffect(() => {
    prefersReducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    if (appState === 'email') {
      const t = setTimeout(() => emailInputRef.current?.focus(), 350)
      return () => clearTimeout(t)
    }
  }, [appState])

  const clearStageTimers = useCallback(() => {
    stageTimersRef.current.forEach((t) => clearTimeout(t))
    stageTimersRef.current = []
  }, [])

  useEffect(() => () => clearStageTimers(), [clearStageTimers])

  const runStageSequence = useCallback(() => {
    clearStageTimers()
    setActiveStage(0)
    setAllComplete(false)

    if (prefersReducedRef.current) {
      setAllComplete(true)
      const t = setTimeout(() => setAppState('success'), 0)
      stageTimersRef.current.push(t)
      return
    }

    STAGES.forEach((_, i) => {
      const t = setTimeout(() => setActiveStage(i), i * STAGE_DURATION_MS)
      stageTimersRef.current.push(t)
    })
    const tFinal = setTimeout(
      () => {
        setAllComplete(true)
        const t2 = setTimeout(() => setAppState('success'), SUCCESS_DELAY_MS)
        stageTimersRef.current.push(t2)
      },
      STAGES.length * STAGE_DURATION_MS + STAGE_TAIL_MS
    )
    stageTimersRef.current.push(tFinal)
  }, [clearStageTimers])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (submitting) return
      const result = validateEmailFormat(email)
      if (!result.ok) {
        setEmailError(result.msg)
        setShakeKey((k) => k + 1)
        return
      }
      setEmailError(null)
      const normalized = email.trim().toLowerCase()
      setSubmittedEmail(normalized)
      setSubmitting(true)
      setSuccessMessage(null)
      setAppState('cards')
      runStageSequence()

      let body: SubmitResponse
      try {
        const res = await fetch('/api/revops/sales-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalized, type: 'sales' }),
        })
        body = (await res.json()) as SubmitResponse
      } catch {
        clearStageTimers()
        setAppState('email')
        setEmailError('Something went wrong. Please try again.')
        setShakeKey((k) => k + 1)
        setSubmitting(false)
        return
      }

      if (body.ok) {
        setSuccessMessage(body.message)
        setSubmitting(false)
        return
      }

      clearStageTimers()
      setAppState('email')
      setEmailError(body.message)
      setShakeKey((k) => k + 1)
      setSubmitting(false)
    },
    [email, submitting, runStageSequence, clearStageTimers]
  )

  const stageProgressPct = useMemo(() => {
    if (allComplete) return 100
    return (activeStage / STAGES.length) * 100
  }, [activeStage, allComplete])

  const stageCounter = useMemo(() => {
    if (allComplete) return '06'
    return String(Math.min(activeStage + 1, STAGES.length)).padStart(2, '0')
  }, [activeStage, allComplete])

  return (
    <>
      <div className="bg-stack">
        <canvas id="aurora" />
        <div className="bg-dots" id="bgDots" />
      </div>
      <div className="bg-spotlight" id="spotlight" />
      <div className="bg-grain" id="bgGrain" />

      <Header />

      <main>
        <section className="hero">
          <div className="lab-wordmark">
            <span className="acc">
              S<sup className="wordmark-superscript">7</sup>
            </span>{' '}
            · LABS
          </div>
          <div className="hero-eyebrow">
            <span className="accent-dot" />
            ROUTE_02 — REVOPS LAB
          </div>
          <h1 className="hero-title">
            Sales intelligence from your <span className="accent-word">work email</span>
          </h1>
          <p className="hero-subtitle">
            We map your ICP, find 25 target companies, surface decision-makers, and deliver verified
            emails — in 15 minutes.
          </p>
          <div className="hero-meta">
            <span>ICP</span>
            <span className="sep" />
            <span>COMPETITORS</span>
            <span className="sep" />
            <span>SAMPLE ACCOUNTS</span>
            <span className="sep" />
            <span>SAMPLE CONTACTS</span>
          </div>
        </section>

        <section className="panel">
          <div className="panel-frame">
            <span className="br-tl" />
            <span className="br-bl" />
            <span className="panel-readout tl">{READOUT_TL[appState]}</span>
            <span className="panel-readout tr">
              CH·02 <span className="v">{READOUT_TR[appState]}</span>
            </span>
            <span className="panel-readout bl">FREE BETA</span>
            <span className="panel-readout br">
              λ S<sup className="wordmark-superscript">7</sup>·REV
            </span>

            <div className={`state ${appState === 'cta' ? 'active' : ''}`}>
              <button className="cta-btn" type="button" onClick={() => setAppState('email')}>
                <span>Get Sales Insight</span>
                <span className="arrow">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                </span>
              </button>
              <div className="helper">
                <span className="tag">FREE</span>during beta · No signup
              </div>
            </div>

            <div className={`state ${appState === 'email' ? 'active' : ''}`}>
              <form className="email-form" noValidate onSubmit={handleSubmit}>
                <div className="email-label">work email · enter to submit</div>
                <div key={shakeKey} className={`email-row ${emailError ? 'error' : ''}`}>
                  <span className="prompt">$</span>
                  <input
                    ref={emailInputRef}
                    type="email"
                    placeholder="you@yourcompany.com"
                    autoComplete="email"
                    spellCheck={false}
                    value={email}
                    disabled={submitting}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (emailError) setEmailError(null)
                    }}
                  />
                  <button
                    className="email-submit"
                    type="submit"
                    aria-label="Submit"
                    disabled={submitting}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="M13 6l6 6-6 6" />
                    </svg>
                  </button>
                </div>
                <div className={`email-helper ${emailError ? 'error' : ''}`}>
                  {emailError ? (
                    <>
                      <span className="err-dot" />
                      {emailError}
                    </>
                  ) : (
                    "We'll only use this to deliver your report."
                  )}
                </div>
              </form>
            </div>

            <div className={`state ${appState === 'cards' ? 'active' : ''}`}>
              <div className="stages-head">
                <span className="left">{'// SYNTHESIZING'}</span>
                <div
                  className="progress"
                  style={{ ['--progress' as string]: `${stageProgressPct}%` }}
                />
                <span className="right">
                  {stageCounter} <span className="v">/ 6</span>
                </span>
              </div>
              <div className="stages">
                {STAGES.map((s, i) => {
                  const isComplete = allComplete || i < activeStage
                  const isActive = !allComplete && i === activeStage
                  const cls = `stage-cell${isActive ? ' active' : ''}${isComplete ? ' complete' : ''}`
                  return (
                    <div className={cls} key={s.num}>
                      <div className="stage">
                        <div className="stage-num">STAGE {s.num}</div>
                        <div className="glyph" aria-hidden="true">
                          <StageGlyph icon={s.icon} />
                        </div>
                        <div className="stage-label">{s.label}</div>
                        <div className="stage-status">
                          {isComplete ? (
                            <>
                              <CheckIcon /> done
                            </>
                          ) : isActive ? (
                            <>
                              {s.status} <span className="dots" />
                            </>
                          ) : (
                            'queued'
                          )}
                        </div>
                      </div>
                      <span className="connector" />
                    </div>
                  )
                })}
              </div>
            </div>

            <div className={`state ${appState === 'success' ? 'active' : ''}`}>
              <div className="success">
                <div className="success-glyph" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                  </svg>
                </div>
                <h2>Check your email</h2>
                <p>
                  {successMessage ?? (
                    <>
                      Your report link will arrive in <span className="email">~15 minutes</span>{' '}
                      from <span className="email">reports@s7labs.ai</span>.
                    </>
                  )}
                </p>
                <div className="success-meta">
                  <span className="live-dot" />
                  <span>QUEUED · {submittedEmail || '—'}</span>
                </div>
                <div className="success-secondary">
                  <span className="label">{'// while you wait'}</span>
                  <a href="/creator">
                    <span>Try the Creator Lab</span>
                    <span className="a">→</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="deliverables">
            <div className="deliverables-head">
              <span className="deliverables-label">{"// What you'll receive"}</span>
              <span className="deliverables-count">04 · DELIVERABLES</span>
            </div>
            <div className="deliverables-grid">
              <div className="deliv">
                <div className="num">
                  <span className="v">01</span> · ICP
                </div>
                <p className="name">Ideal customer profile</p>
                <p className="desc">Inferred from your site, positioning, and traction signals.</p>
              </div>
              <div className="deliv">
                <div className="num">
                  <span className="v">02</span> · MAP
                </div>
                <p className="name">Competitor landscape</p>
                <p className="desc">Direct, indirect, and adjacent players in your category.</p>
              </div>
              <div className="deliv">
                <div className="num">
                  <span className="v">03</span> · ACCOUNTS
                </div>
                <p className="name">25 target companies</p>
                <p className="desc">Best-fit accounts ranked by ICP overlap and intent.</p>
              </div>
              <div className="deliv">
                <div className="num">
                  <span className="v">04</span> · CONTACTS
                </div>
                <p className="name">25 decision-makers</p>
                <p className="desc">Verified emails and roles inside each target account.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <PageScripts />
    </>
  )
}

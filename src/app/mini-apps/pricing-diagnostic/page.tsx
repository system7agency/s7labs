'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'

import { clsx } from 'clsx'
import './page-styles.css'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { InlineConsentField } from '@/components/mini-apps/InlineConsentField'
import { ExportControls } from '@/components/mini-apps/ui/ExportControls'
import { EMAIL_REGEX } from '@/lib/leads/disposable'

import type { ApiResponse, DiagnosticResult } from '@/app/api/mini-apps/pricing-diagnostic/route'
import {
  PricingDiagnosticResult,
  buildPricingDiagnosticPlainText,
  trimUrl,
} from './components/PricingDiagnosticResult'
import { PageScripts } from './PageScripts'

type AppState = 'idle' | 'loading' | 'result' | 'error'

type StageConfig = {
  num: string
  title: string
  logs: string[]
}

const STAGES: StageConfig[] = [
  {
    num: '01',
    title: 'Fetching pricing page',
    logs: ['GET /pricing', '200 OK · loading content', 'dom snapshot stored'],
  },
  {
    num: '02',
    title: 'Parsing plan structure',
    logs: ['walking DOM tree', 'tier nodes found', 'features matched'],
  },
  {
    num: '03',
    title: 'Scoring friction points',
    logs: ['running heuristics', 'signals detected', 'gates analysed'],
  },
  {
    num: '04',
    title: 'Drafting recommendations',
    logs: ['ranking candidates', 'top-3 selected', 'draft complete'],
  },
]

const STAGE_DURATION_MS = 4800

function fmtTs(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `REPORT · ${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} · ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
}

export default function PricingDiagnosticPage() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [marketingConsent, setMarketingConsent] = useState(true)
  const [shakeKey, setShakeKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<DiagnosticResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [resultTs, setResultTs] = useState('')

  // Loading stage animation state
  const [activeStage, setActiveStage] = useState(-1)
  const [doneStages, setDoneStages] = useState<number[]>([])
  const [stageLogs, setStageLogs] = useState<string[]>(['', '', '', ''])
  const [progressPct, setProgressPct] = useState(0)
  const [loadingPct, setLoadingPct] = useState('0%')
  const [latency, setLatency] = useState('—')
  const [sysState, setSysState] = useState('idle')
  const [clock, setClock] = useState('—')
  const [tokens, setTokens] = useState<{ in: number; out: number } | null>(null)

  const urlInputRef = useRef<HTMLInputElement | null>(null)
  const resultPanelRef = useRef<HTMLDivElement | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const rafRef = useRef<number | null>(null)
  const runStartRef = useRef(0)
  const prefersReducedRef = useRef(false)

  useEffect(() => {
    prefersReducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

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

  useEffect(() => {
    if (appState === 'idle') {
      const t = setTimeout(() => urlInputRef.current?.focus(), 200)
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
    setLatency('0.0s')

    const totalMs = STAGE_DURATION_MS * STAGES.length
    const startTime = performance.now()
    runStartRef.current = startTime

    if (!prefersReducedRef.current) {
      const tick = (now: number) => {
        const elapsed = now - startTime
        const pct = Math.min(98, (elapsed / totalMs) * 100)
        setProgressPct(pct)
        setLoadingPct(Math.floor(pct) + '%')
        setLatency((elapsed / 1000).toFixed(1) + 's')
        if (pct < 98) {
          rafRef.current = requestAnimationFrame(tick)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    STAGES.forEach((stage, i) => {
      // Activate stage
      const tActivate = setTimeout(() => {
        setActiveStage(i)
        setStageLogs((prev) => {
          const next = [...prev]
          next[i] = stage.logs[0] ?? ''
          return next
        })
        // Cycle logs while active
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

      // Mark done
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
      if (submitting) return
      const trimmedUrl = url.trim()
      const trimmedEmail = email.trim().toLowerCase()
      let hasError = false
      if (!trimmedUrl) {
        setUrlError('Please enter a URL.')
        hasError = true
      } else if (!/^https?:\/\/.+\..+/.test(trimmedUrl)) {
        setUrlError('Enter a valid URL starting with http:// or https://')
        hasError = true
      } else {
        setUrlError(null)
      }
      if (!trimmedEmail) {
        setEmailError('Please enter your work email.')
        hasError = true
      } else if (!EMAIL_REGEX.test(trimmedEmail)) {
        setEmailError('Please enter a valid email.')
        hasError = true
      } else {
        setEmailError(null)
      }
      if (hasError) {
        setShakeKey((k) => k + 1)
        return
      }

      setSubmitting(true)
      setResult(null)
      setErrorMsg('')

      // 1) Save the lead first. If this fails (disposable email, rate limit,
      // etc.) we bail BEFORE spending an Anthropic call.
      let submissionId: string | null = null
      try {
        const res = await fetch('/api/leads/submit', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email: trimmedEmail,
            miniAppSlug: 'pricing-diagnostic',
            input: { url: trimmedUrl },
            marketingConsent,
          }),
        })
        const json = (await res.json()) as {
          ok: boolean
          submissionId?: string
          error?: string
        }
        if (!res.ok || !json.ok || !json.submissionId) {
          setEmailError(json.error || "Couldn't save your info. Try again.")
          setShakeKey((k) => k + 1)
          setSubmitting(false)
          return
        }
        submissionId = json.submissionId
      } catch {
        setEmailError("Couldn't save your info. Try again.")
        setShakeKey((k) => k + 1)
        setSubmitting(false)
        return
      }

      setSysState('running')
      setAppState('loading')
      startLoadingAnimation()

      let data: ApiResponse
      try {
        const res = await fetch('/api/mini-apps/pricing-diagnostic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmedUrl }),
        })
        data = (await res.json()) as ApiResponse
      } catch {
        clearTimers()
        setErrorMsg('Network error. Please check your connection and try again.')
        setSysState('error')
        setAppState('error')
        setSubmitting(false)
        return
      }

      clearTimers()
      const elapsed = ((performance.now() - runStartRef.current) / 1000).toFixed(1) + 's'
      setLatency(elapsed)
      setProgressPct(100)
      setLoadingPct('100%')

      if (data.ok) {
        setActiveStage(STAGES.length - 1)
        setDoneStages([0, 1, 2, 3])
        await new Promise((r) => setTimeout(r, 400))
        setResult(data.data)
        setTokens({ in: data.data.tokens_in, out: data.data.tokens_out })
        setResultTs(fmtTs(new Date()))
        setSysState('complete')
        setAppState('result')

        // 2) Mark the submission completed (best-effort; result is already shown).
        fetch('/api/leads/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            submissionId,
            output: data.data,
            ...(data.cost ? { cost: data.cost } : {}),
          }),
        }).catch((err) => console.error('[pricing-diagnostic] leads/complete', err))
      } else {
        setErrorMsg(data.message)
        setSysState('error')
        setAppState('error')
        fetch('/api/leads/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            submissionId,
            status: 'failed',
            errorMessage: data.message?.slice(0, 500),
          }),
        }).catch((err) => console.error('[pricing-diagnostic] leads/complete fail', err))
      }
      setSubmitting(false)
    },
    [url, email, marketingConsent, submitting, startLoadingAnimation, clearTimers]
  )

  const handleReset = useCallback(() => {
    clearTimers()
    setAppState('idle')
    setResult(null)
    setErrorMsg('')
    setUrlError(null)
    setEmailError(null)
    setSubmitting(false)
    setSysState('idle')
    setLatency('—')
    setProgressPct(0)
    setTokens(null)
  }, [clearTimers])

  const loadingHost = url ? trimUrl(url).split('/')[0] : 'target'

  return (
    <div className="pricing-diag mini-app-scope">
      <AuroraBackground />

      <Header />

      <main className="shell">
        {/* Hero */}
        <section className="hero">
          <span className="eyebrow">Pricing Page Diagnostic</span>
          <h1>
            See what your pricing page <span className="accent">actually says</span> to buyers.
          </h1>
          <p>
            Drop in any URL (yours or a competitor&apos;s). We scrape it, parse the plan structure,
            and return an AI teardown of where it&apos;s leaking trust.
          </p>
        </section>

        {/* Panel */}
        <div className="panel-wrap">
          <div className="panel">
            {/* Panel readouts bar — only during run/result for technical credibility */}
            {appState !== 'idle' && (
              <div className="panel-readouts">
                <div className="prl">
                  <span>
                    <span className="stat-key">sys</span>{' '}
                    <span className="stat-val">{sysState}</span>
                  </span>
                  <span className="pr-sep hide-sm" />
                  <span className="hide-sm">
                    <span className="stat-key">eng</span> <span className="stat-val">v1.0</span>
                  </span>
                </div>
                <div className="prr">
                  {tokens && (
                    <>
                      <span className="hide-sm">
                        <span className="stat-key">tok</span>{' '}
                        <span className="stat-val">
                          {(tokens.in + tokens.out).toLocaleString()}
                        </span>
                      </span>
                      <span className="pr-sep hide-sm" />
                    </>
                  )}
                  <span className="hide-sm">
                    <span className="stat-key">lat</span>{' '}
                    <span className="stat-val">{latency}</span>
                  </span>
                  <span className="pr-sep hide-sm" />
                  <span>
                    <span className="stat-key">ts</span> <span className="stat-val">{clock}</span>
                  </span>
                </div>
              </div>
            )}

            <div className="panel-body">
              {/* IDLE */}
              <section className={clsx('pd-state', { active: appState === 'idle' })}>
                <div className="idle-label">
                  Pricing URL <span className="required-mark">*</span>
                </div>
                <form
                  key={shakeKey}
                  className="pd-form"
                  noValidate
                  onSubmit={handleSubmit}
                  autoComplete="off"
                >
                  <div className={clsx('pd-input-box', { error: urlError })}>
                    <input
                      ref={urlInputRef}
                      type="text"
                      placeholder="https://your-product.com/pricing"
                      spellCheck={false}
                      value={url}
                      disabled={submitting}
                      onChange={(e) => {
                        setUrl(e.target.value)
                        if (urlError) setUrlError(null)
                      }}
                    />
                  </div>
                  <div className={clsx('pd-helper', { error: urlError })}>
                    {urlError ?? 'Paste your pricing URL'}
                  </div>
                  <div className="idle-label">
                    Work email <span className="required-mark">*</span>
                  </div>
                  <div className={clsx('pd-input-box', { error: emailError })}>
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
                  <div className={clsx('pd-helper', { error: emailError })}>
                    {emailError ?? 'We send the report to your work email. No spam.'}
                  </div>
                  <InlineConsentField
                    checked={marketingConsent}
                    disabled={submitting}
                    onChange={setMarketingConsent}
                  />
                  <div className="pd-submit-row">
                    <button type="submit" className="pd-submit-btn" disabled={submitting}>
                      Find Diagnostic
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
              <section className={clsx('pd-state', { active: appState === 'loading' })}>
                <div className="progress-track">
                  <div className="progress-bar" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="loading-header">
                  <span>
                    Analysing <strong>{loadingHost}</strong>
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
              <section className={clsx('pd-state', { active: appState === 'result' })}>
                {result && (
                  <>
                    <div ref={resultPanelRef}>
                      <PricingDiagnosticResult
                        bare
                        input={{ url: result.url }}
                        output={result}
                        tsLabel={resultTs}
                      />
                    </div>
                    {/* end resultPanelRef */}

                    <div className="result-footer">
                      <span className="url-pill">
                        <span>{trimUrl(result.url)}</span>
                      </span>
                      <div className="export-actions">
                        <ExportControls
                          resultRef={resultPanelRef}
                          slug="pricing-diagnostic"
                          appName="Pricing Page Diagnostic"
                          filename={`pricing-diagnostic-${trimUrl(result.url).replace(/[^a-z0-9]/gi, '-')}`}
                          subject={trimUrl(result.url)}
                          plainText={buildPricingDiagnosticPlainText(result)}
                        />
                        <button className="run-again" type="button" onClick={handleReset}>
                          Run another
                          <svg
                            width="12"
                            height="12"
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
                    </div>
                  </>
                )}
              </section>

              {/* ERROR */}
              <section
                className={clsx('pd-state', 'error-state', { active: appState === 'error' })}
              >
                <div className="err-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" />
                  </svg>
                </div>
                <h2 className="err-title">Analysis failed</h2>
                <p className="err-msg">{errorMsg}</p>
                <button className="err-btn" type="button" onClick={handleReset}>
                  Try again
                </button>
              </section>
            </div>
          </div>
        </div>

        {/* How it works */}
        <section className="how-it-works">
          <div className="hiw-head">
            <span className="hiw-eyebrow">How it works</span>
            <h2>
              From URL to teardown in <span className="accent">under a minute</span>
            </h2>
            <p>No login, no install. Four steps from paste to ranked fixes.</p>
          </div>

          <ol className="hiw-steps">
            <li className="hiw-step" data-side="left">
              <div className="hiw-rail">
                <span className="hiw-dot" />
              </div>
              <div className="hiw-card">
                <span className="hiw-step-label">Step 01</span>
                <div className="hiw-card-row">
                  <div className="hiw-icon" aria-hidden>
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
                  </div>
                  <div className="hiw-text">
                    <h3>Paste your pricing page URL</h3>
                    <p>
                      Yours, a competitor&apos;s, or any public pricing page you want to benchmark.
                    </p>
                  </div>
                </div>
              </div>
            </li>

            <li className="hiw-step" data-side="right">
              <div className="hiw-rail">
                <span className="hiw-dot" />
              </div>
              <div className="hiw-card">
                <span className="hiw-step-label">Step 02</span>
                <div className="hiw-card-row">
                  <div className="hiw-icon" aria-hidden>
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
                  </div>
                  <div className="hiw-text">
                    <h3>We scrape and parse the page</h3>
                    <p>Plan tiers, CTAs, gates, copy, and trust signals, extracted in seconds.</p>
                  </div>
                </div>
              </div>
            </li>

            <li className="hiw-step" data-side="left">
              <div className="hiw-rail">
                <span className="hiw-dot" />
              </div>
              <div className="hiw-card">
                <span className="hiw-step-label">Step 03</span>
                <div className="hiw-card-row">
                  <div className="hiw-icon" aria-hidden>
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
                  </div>
                  <div className="hiw-text">
                    <h3>AI evaluates four conversion dimensions</h3>
                    <p>
                      Structure, friction, copy, and signal, scored against what actually converts.
                    </p>
                  </div>
                </div>
              </div>
            </li>

            <li className="hiw-step" data-side="right">
              <div className="hiw-rail">
                <span className="hiw-dot" />
              </div>
              <div className="hiw-card">
                <span className="hiw-step-label">Step 04</span>
                <div className="hiw-card-row">
                  <div className="hiw-icon" aria-hidden>
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
                  </div>
                  <div className="hiw-text">
                    <h3>Get your scores and the 3 quickest fixes</h3>
                    <p>
                      Friction Score, Clarity Grade, Plan Legibility, plus top improvements ranked
                      by impact.
                    </p>
                  </div>
                </div>
              </div>
            </li>
          </ol>
        </section>
      </main>

      <Footer />
      <PageScripts />
    </div>
  )
}

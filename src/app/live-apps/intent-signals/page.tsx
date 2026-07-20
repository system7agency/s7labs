'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { clsx } from 'clsx'

import './page-styles.css'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { HowItWorks, type HowItWorksStep } from '@/components/mini-apps/HowItWorks'
import { InlineConsentField } from '@/components/mini-apps/InlineConsentField'
import { Input } from '@/components/mini-apps/ui/Input'
import { ExportControls } from '@/components/mini-apps/ui/ExportControls'
import { useMiniAppLoader } from '@/components/mini-apps/useMiniAppLoader'
import { LoadingStages } from '@/components/mini-apps/LoadingStages'
import { useResultParam } from '@/components/mini-apps/useResultParam'
import { ResultRestoreNotice } from '@/components/mini-apps/ResultRestoreNotice'
import { EMAIL_REGEX } from '@/lib/leads/disposable'

import type {
  ApiResponse,
  IntentSignal,
  IntentSignalsResult,
} from '@/app/api/mini-apps/intent-signals/route'
import { PageScripts } from './PageScripts'

type AppState = 'idle' | 'loading' | 'result' | 'error'

type StageConfig = { num: string; title: string; logs: string[] }

const STAGES: StageConfig[] = [
  {
    num: '01',
    title: 'Normalizing domain',
    logs: ['validating hostname', 'resolved canonical host', 'target locked'],
  },
  {
    num: '02',
    title: 'Collecting public signals',
    logs: ['hiring surfaces checked', 'news results scanned', 'tech markers extracted'],
  },
  {
    num: '03',
    title: 'Ranking intent strength',
    logs: ['signals sorted by confidence', 'intent score calibrated', 'summary drafted'],
  },
  {
    num: '04',
    title: 'Drafting outreach angle',
    logs: ['angle generated', 'message framed to trigger', 'report complete'],
  },
]

const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    title: 'Enter a company domain',
    description: 'Start with one domain. We normalize and resolve the host before scanning.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="8" />
        <path d="M4 12h16M12 4c2 2.2 3 5.2 3 8s-1 5.8-3 8c-2-2.2-3-5.2-3-8s1-5.8 3-8z" />
      </svg>
    ),
  },
  {
    title: 'Collectors run in parallel',
    description:
      'Hiring, news, and tech collectors run together to capture fresh external context.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 7h6v4H4zM14 7h6v4h-6zM9 13h6v4H9z" />
        <path d="M7 11v2M17 11v2M12 11v2" />
      </svg>
    ),
  },
  {
    title: 'AI scores only observed evidence',
    description: 'Claude ranks provided signals and computes intent without inventing extra facts.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 12l4-4 4 4 8-8" />
        <path d="M4 18h16" />
      </svg>
    ),
  },
  {
    title: 'Get actionable outreach angle',
    description: 'You receive a clear score, concise summary, ranked signals, and an angle to use.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M22 2L11 13" />
        <path d="M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    ),
  },
]

const STAGE_MS = 4800

function formatReportTs(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `REPORT · ${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} · ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`
}

function normalizeHostInput(value: string): string {
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return ''
  try {
    const withProto = /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`
    const url = new URL(withProto)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return trimmed
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/^www\./, '')
  }
}

function scoreClass(score: number): string {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

function scoreNote(score: number): string {
  if (score >= 70) return 'active timing window'
  if (score >= 40) return 'mixed timing signals'
  return 'quiet timing profile'
}

function signalTypeLabel(type: IntentSignal['type']): string {
  if (type === 'hiring') return 'Hiring'
  if (type === 'news') return 'News'
  return 'Tech'
}

function buildPlainText(result: IntentSignalsResult): string {
  return [
    `Intent Signals — ${result.domain}`,
    '='.repeat(56),
    '',
    `Intent Score: ${result.intentScore}/100`,
    '',
    '// Summary',
    result.summary,
    '',
    '// Ranked Signals',
    ...result.signals.map(
      (signal, index) =>
        `${index + 1}. [${signal.strength.toUpperCase()}] ${signal.headline}\n   (${signalTypeLabel(signal.type)}) ${signal.detail}\n   Source: ${signal.source} · ${signal.sourceUrl}`
    ),
    '',
    '// Outreach Angle',
    result.outreachAngle,
    '',
    `Tokens: ${(result.tokensIn + result.tokensOut).toLocaleString()} (${result.tokensIn.toLocaleString()} in / ${result.tokensOut.toLocaleString()} out)`,
  ].join('\n')
}

export default function IntentSignalsPage() {
  // useResultParam (useSearchParams) requires a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <IntentSignalsPageInner />
    </Suspense>
  )
}

function IntentSignalsPageInner() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [domain, setDomain] = useState('')
  const [domainError, setDomainError] = useState<string | null>(null)
  const [shakeDomain, setShakeDomain] = useState(0)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [marketingConsent, setMarketingConsent] = useState(true)
  const [shakeEmail, setShakeEmail] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<IntentSignalsResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [resultTs, setResultTs] = useState('')

  const [clock, setClock] = useState('—')
  const [sysState, setSysState] = useState('idle')
  const inputRef = useRef<HTMLInputElement | null>(null)
  const resultPanelRef = useRef<HTMLDivElement | null>(null)

  const {
    start: startLoader,
    stop: stopLoader,
    complete: completeLoader,
    reset: resetLoader,
    latency,
    progressPct,
    loadingPct,
    activeStage,
    doneStages,
    stageLogs,
    waiting,
  } = useMiniAppLoader(STAGES, STAGE_MS)

  // Restore a saved result from ?result=<id> (email link / reload).
  const applyResult = useCallback((output: Record<string, unknown>) => {
    const r = output as IntentSignalsResult
    setResult(r)
    setSysState('complete')
    setAppState('result')
  }, [])
  const { restoring, hasResultParam, publish } = useResultParam(applyResult)

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const pad = (value: number) => String(value).padStart(2, '0')
      setClock(`${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}Z`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (appState !== 'idle') return
    const timer = setTimeout(() => inputRef.current?.focus(), 200)
    return () => clearTimeout(timer)
  }, [appState])

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      if (submitting) return

      let valid = true
      const domainNormalized = normalizeHostInput(domain)
      if (!domainNormalized || !/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(domainNormalized)) {
        setDomainError('Enter a valid domain, e.g. acme.com')
        setShakeDomain((k) => k + 1)
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

      setDomainError(null)
      setEmailError(null)
      setSubmitting(true)
      setResult(null)
      setErrorMsg('')

      // Show the loading state immediately on a valid submit so there is no dead
      // time while the lead-save round-trips. On lead-save failure, revert to the
      // idle form and surface the error.
      setSysState('running')
      setAppState('loading')
      startLoader()

      let submissionId: string | null = null
      try {
        const res = await fetch('/api/leads/submit', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email: emailClean,
            miniAppSlug: 'intent-signals',
            input: { domain: domainNormalized },
            marketingConsent,
          }),
        })
        const json = (await res.json()) as {
          ok: boolean
          submissionId?: string
          error?: string
        }
        if (!res.ok || !json.ok || !json.submissionId) {
          resetLoader()
          setSysState('idle')
          setAppState('idle')
          setEmailError(json.error || "Couldn't save your info. Try again.")
          setShakeEmail((k) => k + 1)
          setSubmitting(false)
          return
        }
        submissionId = json.submissionId
      } catch {
        resetLoader()
        setSysState('idle')
        setAppState('idle')
        setEmailError("Couldn't save your info. Try again.")
        setShakeEmail((k) => k + 1)
        setSubmitting(false)
        return
      }

      let data: ApiResponse
      try {
        const response = await fetch('/api/mini-apps/intent-signals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: domainNormalized }),
        })
        data = (await response.json()) as ApiResponse
      } catch {
        stopLoader()
        setErrorMsg('Network error. Please check your connection and try again.')
        setSysState('error')
        setAppState('error')
        setSubmitting(false)
        return
      }

      if (data.ok) {
        completeLoader()
        setResult(data.data)
        setResultTs(formatReportTs(new Date()))
        setSysState('complete')
        setAppState('result')

        fetch('/api/leads/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            submissionId,
            output: data.data,
            ...(data.cost ? { cost: data.cost } : {}),
          }),
        }).catch((err) => console.error('[intent-signals] leads/complete', err))
        // Make the URL shareable / reload-safe (?result=<id>).
        publish(submissionId)
      } else {
        stopLoader()
        setErrorMsg(data.message)
        setSysState('error')
        setAppState('error')
      }

      setSubmitting(false)
    },
    [
      domain,
      email,
      marketingConsent,
      submitting,
      startLoader,
      stopLoader,
      completeLoader,
      resetLoader,
      publish,
    ]
  )

  const handleReset = useCallback(() => {
    resetLoader()
    setAppState('idle')
    setResult(null)
    setErrorMsg('')
    setDomainError(null)
    setSubmitting(false)
    setSysState('idle')
  }, [resetLoader])

  const targetLabel = useMemo(() => normalizeHostInput(domain) || 'target', [domain])

  return (
    <div className="intent-signals mini-app-scope">
      <AuroraBackground />
      <Header />

      <main className="shell">
        <section className="hero">
          <span className="eyebrow">Intent Signals</span>
          <h1>
            Catch intent windows before your <span className="accent">competitors do</span>.
          </h1>
          <p>
            Drop in a domain. We check hiring, news, and tech movement, then return a ranked signal
            feed and outreach angle your team can use immediately.
          </p>
        </section>

        <div className="panel-wrap">
          <div className="panel">
            {appState !== 'idle' && (
              <div className="panel-readouts">
                <div className="prl">
                  <span>
                    <span className="stat-key">sys</span>{' '}
                    <span className="stat-val">{sysState}</span>
                  </span>
                </div>
                <div className="prr">
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
              {(restoring || (appState === 'idle' && hasResultParam)) && (
                <section className="state active">
                  <ResultRestoreNotice />
                </section>
              )}
              <section
                className={clsx('state', {
                  active: appState === 'idle' && !restoring && !hasResultParam,
                })}
              >
                <div className="idle-label">Scan a company for buyer intent</div>
                <form className="idle-form" onSubmit={handleSubmit} noValidate autoComplete="off">
                  <Input
                    ref={inputRef}
                    label="Company domain"
                    required
                    type="text"
                    value={domain}
                    placeholder="acme.com"
                    spellCheck={false}
                    disabled={submitting}
                    error={domainError}
                    shakeKey={shakeDomain}
                    onChange={(event) => {
                      setDomain(event.target.value)
                      if (domainError) setDomainError(null)
                    }}
                  />
                  <Input
                    label="Work email"
                    required
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    placeholder="you@company.com"
                    disabled={submitting}
                    error={emailError}
                    shakeKey={shakeEmail}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      if (emailError) setEmailError(null)
                    }}
                  />
                  <InlineConsentField
                    checked={marketingConsent}
                    disabled={submitting}
                    onChange={setMarketingConsent}
                  />
                  <div className="submit-row" style={{ marginTop: 18 }}>
                    <button type="submit" className="submit-btn" disabled={submitting}>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-4.3-4.3" />
                      </svg>
                      Run scan
                    </button>
                  </div>
                </form>
              </section>

              <section className={clsx('state', { active: appState === 'loading' })}>
                <LoadingStages
                  stages={STAGES}
                  label={
                    <>
                      Scanning <strong>{targetLabel}</strong>
                    </>
                  }
                  progressPct={progressPct}
                  loadingPct={loadingPct}
                  activeStage={activeStage}
                  doneStages={doneStages}
                  stageLogs={stageLogs}
                  waiting={waiting}
                />
              </section>

              <section className={clsx('state', { active: appState === 'result' })}>
                {result ? (
                  <>
                    <div ref={resultPanelRef}>
                      <div className="result-head">
                        <span className="title">Signal report ready</span>
                        <span className="ts-label">{resultTs}</span>
                      </div>

                      <div className="score-grid">
                        <article className={clsx('score-card', scoreClass(result.intentScore))}>
                          <div className="score-label">Intent score</div>
                          <div className="score-value">{result.intentScore}</div>
                          <div className="score-note">{scoreNote(result.intentScore)}</div>
                        </article>
                        <article className="summary-card">
                          <div className="score-label">Summary</div>
                          <p>{result.summary}</p>
                        </article>
                      </div>

                      <article className="angle-card">
                        <div className="angle-eyebrow">{'// Outreach angle'}</div>
                        <p>{result.outreachAngle}</p>
                      </article>

                      <div className="section-head">
                        <span>{'// Ranked signals'}</span>
                        <span>{result.signals.length} found</span>
                      </div>
                      <div className="signal-list">
                        {result.signals.map((signal, index) => (
                          <article key={`${signal.sourceUrl}-${index}`} className="signal-item">
                            <div className="signal-top">
                              <h3>{signal.headline}</h3>
                              <span className={clsx('chip', signal.strength)}>
                                {signal.strength}
                              </span>
                            </div>
                            <p>{signal.detail}</p>
                            <div className="signal-meta">
                              <span>{signalTypeLabel(signal.type)}</span>
                              <span>{signal.source}</span>
                            </div>
                          </article>
                        ))}
                        {result.signals.length === 0 ? (
                          <article className="signal-item empty">
                            <h3>Quiet signal profile</h3>
                            <p>No strong public triggers were detected in this scan window.</p>
                          </article>
                        ) : null}
                      </div>
                    </div>

                    <div className="result-actions">
                      <ExportControls
                        resultRef={resultPanelRef}
                        slug="intent-signals"
                        appName="Intent Signals"
                        filename={`intent-signals-${result.domain.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`}
                        subject={result.domain}
                        plainText={buildPlainText(result)}
                      />
                      <button className="run-again" type="button" onClick={handleReset}>
                        Scan another
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
                  </>
                ) : null}
              </section>

              <section className={clsx('state', 'error', { active: appState === 'error' })}>
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
                <h2 className="err-title">Scan failed</h2>
                <p className="err-msg">{errorMsg}</p>
                <button className="err-btn" type="button" onClick={handleReset}>
                  Try again
                </button>
              </section>
            </div>
          </div>
        </div>

        <HowItWorks
          title={
            <>
              From domain to <span className="accent">ranked buyer intent</span>
            </>
          }
          subtitle="Signal collection, ranking, and outreach framing in four steps."
          steps={HOW_IT_WORKS_STEPS}
        />
      </main>

      <Footer />
      <PageScripts />
    </div>
  )
}

'use client'

import { Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { clsx } from 'clsx'
import './page-styles.css'
import { useResultParam } from '@/components/mini-apps/useResultParam'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { HowItWorks, type HowItWorksStep } from '@/components/mini-apps/HowItWorks'
import { InlineConsentField } from '@/components/mini-apps/InlineConsentField'
import { Input } from '@/components/mini-apps/ui/Input'
import { ExportControls } from '@/components/mini-apps/ui/ExportControls'
import { useMiniAppLoader } from '@/components/mini-apps/useMiniAppLoader'
import { LoadingStages } from '@/components/mini-apps/LoadingStages'
import { ResultRestoreNotice } from '@/components/mini-apps/ResultRestoreNotice'
import { EMAIL_REGEX } from '@/lib/leads/disposable'
import type { ApiResponse, RadarResult } from '@/app/api/mini-apps/outbound-radar/route'
import { PageScripts } from './PageScripts'
import { OutboundRadarResult, buildOutboundRadarPlainText } from './components/OutboundRadarResult'

type AppState = 'idle' | 'loading' | 'result' | 'error'

const RADAR_STEPS: HowItWorksStep[] = [
  {
    title: 'Enter a company name and domain',
    description:
      'That is the entire setup. No API keys, no integrations. Just the company you want to outbound to.',
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
    title: 'We scan the homepage, about, and careers',
    description:
      'Real-time scrape of the surfaces that reveal hiring plans, tech stack, expansion, and recent news.',
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
    title: 'AI detects buy signals across categories',
    description:
      'Hiring, expansion, tech changes, funding, leadership moves, each ranked by strength and recency.',
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
    title: 'Get your intent score, urgency, and outreach angle',
    description:
      'A 0–10 intent score, urgency level, the persona to target, and a tailored opener, ready to send.',
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

const STAGES = [
  {
    num: '01',
    title: 'Scanning homepage',
    logs: ['GET /', '200 OK · reading content', 'homepage parsed'],
  },
  {
    num: '02',
    title: 'Scraping /about & /careers',
    logs: ['GET /about', 'GET /careers', 'hiring signals extracted'],
  },
  {
    num: '03',
    title: 'Detecting buy signals',
    logs: ['analysing patterns', 'scoring intent signals', 'signals ranked'],
  },
  {
    num: '04',
    title: 'Drafting outreach angle',
    logs: ['profiling buyer persona', 'writing angle', 'brief complete'],
  },
]
const STAGE_MS = 5000

function fmtTs(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `REPORT · ${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} · ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`
}

export default function OutboundRadarPage() {
  return (
    <Suspense fallback={null}>
      <OutboundRadarPageInner />
    </Suspense>
  )
}

function OutboundRadarPageInner() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [company, setCompany] = useState('')
  const [domain, setDomain] = useState('')
  const [companyError, setCompanyError] = useState<string | null>(null)
  const [domainError, setDomainError] = useState<string | null>(null)
  const [shakeCompany, setShakeCompany] = useState(0)
  const [shakeDomain, setShakeDomain] = useState(0)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [marketingConsent, setMarketingConsent] = useState(true)
  const [shakeEmail, setShakeEmail] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<RadarResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [resultTs, setResultTs] = useState('')

  const [sysState, setSysState] = useState('idle')
  const [clock, setClock] = useState('—')
  const [tokens, setTokens] = useState<{ in: number; out: number } | null>(null)

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

  const applyResult = useCallback((output: Record<string, unknown>) => {
    const r = output as RadarResult
    setResult(r)
    if (typeof r.tokens_in === 'number' && typeof r.tokens_out === 'number') {
      setTokens({ in: r.tokens_in, out: r.tokens_out })
    }
    setResultTs(fmtTs(new Date()))
    setSysState('complete')
    setAppState('result')
  }, [])
  const { restoring, hasResultParam, publish } = useResultParam(applyResult)

  const companyInputRef = useRef<HTMLInputElement | null>(null)
  const resultPanelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const tick = () => {
      const d = new Date()
      const p = (n: number) => String(n).padStart(2, '0')
      setClock(`${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}Z`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (appState === 'idle') {
      const t = setTimeout(() => companyInputRef.current?.focus(), 200)
      return () => clearTimeout(t)
    }
  }, [appState])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (submitting) return
      let valid = true
      if (!company.trim()) {
        setCompanyError('Company name is required.')
        setShakeCompany((k) => k + 1)
        valid = false
      }
      const domainClean = domain
        .trim()
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '')
      if (!domainClean || !/^([a-z0-9-]+\.)+[a-z]{2,}/i.test(domainClean)) {
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

      setCompanyError(null)
      setDomainError(null)
      setEmailError(null)
      setSubmitting(true)
      setResult(null)
      setErrorMsg('')

      // Show the loading state immediately on a valid submit so there is no dead
      // time while the lead-save round-trips. On lead-save failure (disposable or
      // free-provider email), revert to idle and surface the error.
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
            miniAppSlug: 'outbound-trigger-radar',
            marketingConsent,
            input: { company: company.trim(), domain: domainClean },
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
        const res = await fetch('/api/mini-apps/outbound-radar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company: company.trim(), domain: domainClean }),
        })
        data = (await res.json()) as ApiResponse
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
        await new Promise((r) => setTimeout(r, 400))
        setResult(data.data)
        setTokens({ in: data.data.tokens_in, out: data.data.tokens_out })
        setResultTs(fmtTs(new Date()))
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
        }).catch((err) => console.error('[outbound-radar] leads/complete', err))

        if (submissionId) publish(submissionId)
      } else {
        stopLoader()
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
        }).catch((err) => console.error('[outbound-radar] leads/complete fail', err))
      }
      setSubmitting(false)
    },
    [
      company,
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
    setCompanyError(null)
    setDomainError(null)
    setEmailError(null)
    setSubmitting(false)
    setSysState('idle')
    setTokens(null)
  }, [resetLoader])

  const loadingTarget = domain ? domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '') : 'target'

  return (
    <div className="outbound-radar mini-app-scope">
      <AuroraBackground />

      <Header />

      <main className="shell">
        <section className="hero">
          <span className="eyebrow">Outbound Trigger Radar</span>
          <h1>
            Know exactly <span className="accent">when to reach out</span> and why.
          </h1>
          <p>
            Enter a company name and domain. We scan their site for buying signals (hiring sprees,
            new products, expansions) and turn them into a scored outreach brief.
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
              {/* RESTORE LOADING */}
              {(restoring || (appState === 'idle' && hasResultParam)) && (
                <section className="or-state active">
                  <ResultRestoreNotice />
                </section>
              )}

              {/* IDLE */}
              <section
                className={clsx('or-state', {
                  active: appState === 'idle' && !restoring && !hasResultParam,
                })}
              >
                <div className="idle-label">Target account</div>
                <form className="idle-form" noValidate onSubmit={handleSubmit} autoComplete="off">
                  <div className="input-grid">
                    <Input
                      ref={companyInputRef}
                      label="Company name"
                      type="text"
                      placeholder="Acme Corp"
                      value={company}
                      disabled={submitting}
                      error={companyError}
                      shakeKey={shakeCompany}
                      onChange={(e) => {
                        setCompany(e.target.value)
                        if (companyError) setCompanyError(null)
                      }}
                    />
                    <Input
                      label="Domain"
                      type="text"
                      placeholder="acme.com"
                      value={domain}
                      disabled={submitting}
                      error={domainError}
                      shakeKey={shakeDomain}
                      onChange={(e) => {
                        setDomain(e.target.value)
                        if (domainError) setDomainError(null)
                      }}
                    />
                  </div>
                  <Input
                    label="Work email"
                    required
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    disabled={submitting}
                    error={emailError}
                    shakeKey={shakeEmail}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (emailError) setEmailError(null)
                    }}
                  />
                  <InlineConsentField
                    checked={marketingConsent}
                    disabled={submitting}
                    onChange={setMarketingConsent}
                  />
                  <div className="submit-row">
                    <button type="submit" className="submit-btn" disabled={submitting}>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                      </svg>
                      Run radar scan
                    </button>
                  </div>
                </form>
              </section>

              {/* LOADING */}
              <section className={clsx('or-state', { active: appState === 'loading' })}>
                <LoadingStages
                  stages={STAGES}
                  label={
                    <>
                      Scanning <strong>{loadingTarget}</strong>
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

              {/* RESULT */}
              <section className={clsx('or-state', { active: appState === 'result' })}>
                {result && (
                  <>
                    <div ref={resultPanelRef}>
                      <OutboundRadarResult
                        bare
                        input={{ company, domain }}
                        output={result}
                        tsLabel={resultTs}
                      />
                    </div>

                    <div className="result-actions">
                      <ExportControls
                        resultRef={resultPanelRef}
                        slug="outbound-radar"
                        appName="Outbound Trigger Radar"
                        filename={`radar-${result.domain.replace(/[^a-z0-9]/gi, '-')}`}
                        subject={result.domain}
                        plainText={buildOutboundRadarPlainText(result)}
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
                )}
              </section>

              {/* ERROR */}
              <section
                className={clsx('or-state', 'error-state', { active: appState === 'error' })}
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
              From company name to <span className="accent">ranked buy signals</span>
            </>
          }
          subtitle="No login, no install. Four steps from input to a ready-to-send outreach angle."
          steps={RADAR_STEPS}
        />
      </main>

      <Footer />
      <PageScripts />
    </div>
  )
}

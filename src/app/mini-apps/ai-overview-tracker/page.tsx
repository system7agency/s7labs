'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { clsx } from 'clsx'
import './page-styles.css'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { InlineConsentField } from '@/components/mini-apps/InlineConsentField'
import { Input } from '@/components/mini-apps/ui/Input'
import { ExportControls } from '@/components/mini-apps/ui/ExportControls'
import { useMiniAppLoader } from '@/components/mini-apps/useMiniAppLoader'
import { LoadingStages } from '@/components/mini-apps/LoadingStages'
import { EMAIL_REGEX } from '@/lib/leads/disposable'
import { HowItWorks, type HowItWorksStep } from '@/components/mini-apps/HowItWorks'
import type { ScanApiResponse, ScanFree, ScanGated } from '@/lib/mini-apps/aio-types'
import { parseScanApiResponse } from '@/lib/mini-apps/aio-types'
import { GatedBreakdown } from './GatedBreakdown'
import {
  AiOverviewTrackerResult,
  buildAiOverviewTrackerPlainText,
} from './components/AiOverviewTrackerResult'
import { PageScripts } from './PageScripts'

type AppState = 'idle' | 'loading' | 'result' | 'error'

const DOMAIN_RE = /^([a-z0-9-]+\.)+[a-z]{2,}$/i
const STAGE_MS = 5000
const MAX_KEYWORDS = 5
const MARKETS = ['United States', 'United Kingdom', 'Canada', 'Australia', 'India'] as const

function MarketDropdown({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={wrapRef} className="aio-dd">
      <button
        type="button"
        className="aio-dd-button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{value}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul className="aio-dd-menu" role="listbox">
          {MARKETS.map((opt) => (
            <li
              key={opt}
              role="option"
              aria-selected={opt === value}
              className={clsx('aio-dd-option', { 'is-selected': opt === value })}
              onClick={() => {
                onChange(opt)
                setOpen(false)
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const AIO_STEPS: HowItWorksStep[] = [
  {
    title: 'Add your domain and keywords',
    description: 'Up to five buyer searches you care about, plus your target market.',
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
        <path d="M7 9h10M7 13h6" />
      </svg>
    ),
  },
  {
    title: 'We run live Google searches',
    description: 'Each keyword is queried with AI Overview detection, not a rank position report.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3-3" />
      </svg>
    ),
  },
  {
    title: 'See your free snapshot',
    description:
      'Citation rate, AI Overview trigger rate, blind spots, and a per-keyword status strip, before you share your email.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 19V5l8 4 8-4v14" />
        <path d="M12 9v10" />
      </svg>
    ),
  },
  {
    title: 'Unlock the full breakdown',
    description:
      'Every cited domain per keyword, citation leaders, and three ways to start getting cited in AI answers.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3v18M3 12h18" />
      </svg>
    ),
  },
]

const STAGES = [
  {
    num: '01',
    title: 'Running the searches',
    logs: ['querying Google', 'pulling each keyword', 'capturing the SERPs'],
  },
  {
    num: '02',
    title: 'Finding the AI Overviews',
    logs: ['detecting AI answers', 'reading the citations', 'matching your domain'],
  },
  {
    num: '03',
    title: "Checking who's cited",
    logs: ['listing the sources', 'spotting the leaders', 'finding your gaps'],
  },
  {
    num: '04',
    title: 'Scoring visibility',
    logs: ['trigger rate', 'citation rate', 'verdict ready'],
  },
]

function normalizeDomainInput(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
}

function keywordsFromText(value: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  // Accept one keyword per line OR comma-separated — whichever the user types.
  for (const line of value.split(/[\n,]/)) {
    const k = line.trim()
    if (!k) continue
    const key = k.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(k)
  }
  return out
}

export default function AiOverviewTrackerPage() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [domain, setDomain] = useState('')
  const [keywordsText, setKeywordsText] = useState('')
  const [location, setLocation] = useState('United States')
  const [domainError, setDomainError] = useState<string | null>(null)
  const [keywordsError, setKeywordsError] = useState<string | null>(null)
  const [shakeInput, setShakeInput] = useState(0)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [marketingConsent, setMarketingConsent] = useState(true)
  const [shakeEmail, setShakeEmail] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [scanId, setScanId] = useState<string | null>(null)
  const [free, setFree] = useState<ScanFree | null>(null)
  const [gated, setGated] = useState<ScanGated | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [tokens, setTokens] = useState<{ in: number; out: number } | null>(null)
  const [sysState, setSysState] = useState('idle')
  const [clock, setClock] = useState('—')

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

  const domainInputRef = useRef<HTMLInputElement | null>(null)
  const shareableRef = useRef<HTMLDivElement | null>(null)

  const parsedKeywords = useMemo(() => keywordsFromText(keywordsText), [keywordsText])

  const leadInput = useMemo(
    () => ({
      domain: normalizeDomainInput(domain),
      keywords: parsedKeywords,
      location,
    }),
    [domain, parsedKeywords, location]
  )

  const handleGatedLoaded = useCallback((data: ScanGated) => {
    setGated(data)
  }, [])

  const handleTokens = useCallback((t: { in: number; out: number }) => {
    setTokens(t)
  }, [])

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
      const t = setTimeout(() => domainInputRef.current?.focus(), 200)
      return () => clearTimeout(t)
    }
  }, [appState])

  const submissionIdRef = useRef<string | null>(null)

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (submitting) return

      const normalizedDomain = normalizeDomainInput(domain)
      const keywords = keywordsFromText(keywordsText).slice(0, MAX_KEYWORDS)
      const domainInvalid = !DOMAIN_RE.test(normalizedDomain)
      const keywordInvalid = keywords.length === 0
      setDomainError(domainInvalid ? 'Enter a valid domain.' : null)
      setKeywordsError(keywordInvalid ? 'Enter at least one keyword.' : null)
      let valid = !(domainInvalid || keywordInvalid)
      if (domainInvalid || keywordInvalid) {
        setShakeInput((k) => k + 1)
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

      setEmailError(null)
      setSubmitting(true)
      setScanId(null)
      setFree(null)
      setGated(null)
      setErrorMsg('')
      setTokens(null)

      // Show the loading state immediately on a valid submit so there is no dead
      // time while the lead-save round-trips. If the lead-save fails (e.g. a
      // disposable / free-provider email the server rejects), we revert to the
      // idle form below and surface the error.
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
            miniAppSlug: 'ai-overview-tracker',
            marketingConsent,
            input: { domain: normalizedDomain, keywords, location },
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
        submissionIdRef.current = submissionId
      } catch {
        resetLoader()
        setSysState('idle')
        setAppState('idle')
        setEmailError("Couldn't save your info. Try again.")
        setShakeEmail((k) => k + 1)
        setSubmitting(false)
        return
      }

      let data: ScanApiResponse
      try {
        const res = await fetch('/api/mini-apps/ai-overview-tracker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: normalizedDomain, keywords, location }),
        })
        data = parseScanApiResponse(await res.json())
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
        await new Promise((r) => setTimeout(r, 350))
        setScanId(data.scanId)
        setFree(data.free)
        setSysState('complete')
        setAppState('result')

        const completeBody: Record<string, unknown> = {
          submissionId,
          output: { free: data.free, scanId: data.scanId },
        }
        if (data.cost) completeBody.cost = data.cost
        fetch('/api/leads/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(completeBody),
        }).catch((err) => console.error('[ai-overview-tracker] leads/complete', err))
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
        }).catch((err) => console.error('[ai-overview-tracker] leads/complete fail', err))
      }
      setSubmitting(false)
    },
    [
      submitting,
      domain,
      keywordsText,
      location,
      email,
      marketingConsent,
      startLoader,
      stopLoader,
      completeLoader,
      resetLoader,
    ]
  )

  const handleReset = useCallback(() => {
    resetLoader()
    setAppState('idle')
    setFree(null)
    setGated(null)
    setScanId(null)
    setErrorMsg('')
    setEmailError(null)
    setSubmitting(false)
    setSysState('idle')
    setTokens(null)
  }, [resetLoader])

  return (
    <div className="ai-overview-tracker mini-app-scope">
      <AuroraBackground />
      <Header />
      <main className="shell">
        <section className="hero">
          <span className="eyebrow">AI Overview Tracker</span>
          <h1>
            Track AI citation visibility, <span className="accent">not rank positions</span>
          </h1>
          <p>
            See which keywords trigger Google AI Overviews, who gets cited, and where your brand is
            missing from the AI answer.
          </p>
        </section>

        <div className="panel-wrap panel-wrap-wide">
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
                    <span className="hide-sm">
                      <span className="stat-key">tok</span>{' '}
                      <span className="stat-val">{(tokens.in + tokens.out).toLocaleString()}</span>
                    </span>
                  )}
                  <span className="pr-sep hide-sm" />
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
              <section className={clsx('aio-state', { active: appState === 'idle' })}>
                <div className="idle-label">Not a rank tracker. This checks AI citations</div>
                <form className="idle-form" noValidate onSubmit={handleSubmit} autoComplete="off">
                  <Input
                    ref={domainInputRef}
                    label="Your domain"
                    type="text"
                    placeholder="yourbrand.com"
                    value={domain}
                    disabled={submitting}
                    error={domainError}
                    shakeKey={shakeInput}
                    onChange={(e) => {
                      setDomain(e.target.value)
                      if (domainError) setDomainError(null)
                    }}
                  />
                  <div className="textarea-field">
                    <label>Keywords to check — one per line (up to 5)</label>
                    <div className={clsx('textarea-box', { error: keywordsError })}>
                      <textarea
                        placeholder={
                          'best crm for agencies\nai seo agency\nsales automation consultant'
                        }
                        value={keywordsText}
                        disabled={submitting}
                        onChange={(e) => {
                          const next = e.target.value
                          const rows = keywordsFromText(next)
                          setKeywordsText(rows.slice(0, MAX_KEYWORDS).join('\n'))
                          if (keywordsError) setKeywordsError(null)
                        }}
                      />
                    </div>
                    <div className="field-helper">
                      Press Enter after each — one buyer search per line (or comma-separated).{' '}
                      {parsedKeywords.length}/{MAX_KEYWORDS}
                    </div>
                    {keywordsError && <div className="field-error">{keywordsError}</div>}
                  </div>
                  <div className="input-field">
                    <label>Market</label>
                    <MarketDropdown value={location} onChange={setLocation} disabled={submitting} />
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
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                      </svg>
                      Check my AI Overview visibility
                    </button>
                  </div>
                </form>
              </section>
              <section className={clsx('aio-state', { active: appState === 'loading' })}>
                <LoadingStages
                  stages={STAGES}
                  label="Checking AI Overviews"
                  progressPct={progressPct}
                  loadingPct={loadingPct}
                  activeStage={activeStage}
                  doneStages={doneStages}
                  stageLogs={stageLogs}
                  waiting={waiting}
                />
              </section>
              <section className={clsx('aio-state', { active: appState === 'result' })}>
                {free && scanId && (
                  <>
                    <div ref={shareableRef}>
                      <AiOverviewTrackerResult bare input={leadInput} output={{ free, scanId }} />
                    </div>
                    <GatedBreakdown
                      scanId={scanId}
                      free={free}
                      leadInput={leadInput}
                      submitToApi={async (_input, output) => {
                        const submissionId = submissionIdRef.current
                        if (!submissionId || !output) return
                        try {
                          await fetch('/api/leads/complete', {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({ submissionId, output }),
                          })
                        } catch (err) {
                          console.error('[ai-overview-tracker] gated leads/complete', err)
                        }
                      }}
                      onTokens={handleTokens}
                      onGatedLoaded={handleGatedLoaded}
                    />
                    <div className="result-actions">
                      <ExportControls
                        resultRef={shareableRef}
                        slug="ai-overview-tracker"
                        appName="AI Overview Tracker"
                        filename={`aio-${free.domain}`}
                        subject={free.domain}
                        plainText={buildAiOverviewTrackerPlainText(free, gated)}
                      />
                      <button className="run-again" type="button" onClick={handleReset}>
                        Check again
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
              <section
                className={clsx('aio-state', 'error-state', { active: appState === 'error' })}
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
              From keywords to citation gaps in <span className="accent">under a minute</span>
            </>
          }
          subtitle="No login. Paste your domain and buyer keywords. We check live Google results for AI Overviews and who gets cited."
          steps={AIO_STEPS}
        />
      </main>
      <Footer />
      <PageScripts />
    </div>
  )
}

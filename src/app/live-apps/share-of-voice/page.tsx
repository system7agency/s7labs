'use client'

import { Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { clsx } from 'clsx'
import { useResultParam } from '@/components/mini-apps/useResultParam'
import { ResultRestoreNotice } from '@/components/mini-apps/ResultRestoreNotice'
import './page-styles.css'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { HowItWorks, type HowItWorksStep } from '@/components/mini-apps/HowItWorks'
import type {
  ScanApiResponse,
  ScanFree,
  ScanGated,
  UnlockApiResponse,
} from '@/lib/mini-apps/sov-types'
import { InlineConsentField } from '@/components/mini-apps/InlineConsentField'
import { Input } from '@/components/mini-apps/ui/Input'
import { ExportControls } from '@/components/mini-apps/ui/ExportControls'
import { useMiniAppLoader } from '@/components/mini-apps/useMiniAppLoader'
import { LoadingStages } from '@/components/mini-apps/LoadingStages'
import { EMAIL_REGEX } from '@/lib/leads/disposable'
import { PageScripts } from './PageScripts'
import { ShareOfVoiceResult, buildShareOfVoicePlainText } from './components/ShareOfVoiceResult'
import { ShareOfVoiceGatedDetail } from './components/ShareOfVoiceGatedDetail'

type AppState = 'idle' | 'loading' | 'result' | 'error'

const DOMAIN_RE = /^([a-z0-9-]+\.)+[a-z]{2,}/i

const STAGES = [
  {
    num: '01',
    title: 'Reading the market',
    logs: ['identifying your brand', 'mapping competitors', 'finding the category'],
  },
  {
    num: '02',
    title: 'Writing buyer questions',
    logs: ['generating buying-intent questions', 'framing like a real buyer', 'questions ready'],
  },
  {
    num: '03',
    title: 'Asking the AIs',
    logs: ['querying Claude', 'querying ChatGPT', 'querying Perplexity'],
  },
  {
    num: '04',
    title: 'Counting the mentions',
    logs: ['scanning every answer', 'tallying appearances', 'scoring share of voice'],
  },
]
const STAGE_MS = 5000

const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    title: 'Enter your domain + rivals',
    description:
      'Drop in your domain and up to three competitors in the same category. We figure out the rest.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
      </svg>
    ),
  },
  {
    title: 'We write buyer questions',
    description:
      'Real shopping questions a buyer would ask — no brand names baked in, no leading prompts.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
      </svg>
    ),
  },
  {
    title: 'Ask three AIs in parallel',
    description: 'Claude, ChatGPT, and Perplexity get the same questions. We capture every answer.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
  },
  {
    title: 'See who wins the answers',
    description:
      'Share of voice, by-provider breakdown, question-by-question mentions, and moves to close the gap.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 4 4 5-6" />
      </svg>
    ),
  },
]

function normalizeDomainInput(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./, '')
}

export default function ShareOfVoicePage() {
  // useResultParam (useSearchParams) requires a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <ShareOfVoicePageInner />
    </Suspense>
  )
}

function ShareOfVoicePageInner() {
  // When the page is opened with ?result=<id> (from the email or a reload) we
  // restore that saved result from the DB and render it in this page's own
  // design, instead of running a new scan.
  const [restored, setRestored] = useState(false)
  const [appState, setAppState] = useState<AppState>('idle')
  const [yourDomain, setYourDomain] = useState('')
  const [competitors, setCompetitors] = useState<string[]>([''])
  const [domainError, setDomainError] = useState<string | null>(null)
  const [competitorError, setCompetitorError] = useState<string | null>(null)
  const [shakeDomain, setShakeDomain] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [free, setFree] = useState<ScanFree | null>(null)
  const [gated, setGated] = useState<ScanGated | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [marketingConsent, setMarketingConsent] = useState(true)
  const [shakeEmail, setShakeEmail] = useState(0)

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

  const domainInputRef = useRef<HTMLInputElement | null>(null)
  const shareableRef = useRef<HTMLDivElement | null>(null)

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

  // Restore a saved result from ?result=<id> (email link / reload).
  const applyResult = useCallback((output: Record<string, unknown>) => {
    const out = output as { free?: ScanFree; gated?: ScanGated | null }
    if (!out.free) return
    setYourDomain(out.free.your_domain ?? '')
    setFree(out.free)
    setGated(out.gated ?? null)
    if (out.gated) setTokens({ in: out.gated.tokens_in, out: out.gated.tokens_out })
    setSysState('complete')
    setRestored(true)
    setAppState('result')
  }, [])
  const { restoring, hasResultParam, publish } = useResultParam(applyResult)

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (submitting) return

      let valid = true
      const yourClean = normalizeDomainInput(yourDomain)
      if (!yourClean || !DOMAIN_RE.test(yourClean)) {
        setDomainError('Enter a valid domain for your brand.')
        setShakeDomain((k) => k + 1)
        valid = false
      }

      const compClean: string[] = []
      for (const c of competitors) {
        const t = normalizeDomainInput(c)
        if (!t) continue
        if (!DOMAIN_RE.test(t)) {
          setCompetitorError('Enter valid competitor domains (e.g. competitor.com).')
          valid = false
          break
        }
        if (t !== yourClean && !compClean.includes(t)) compClean.push(t)
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
      setCompetitorError(null)
      setEmailError(null)
      setSubmitting(true)
      setFree(null)
      setGated(null)
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
            miniAppSlug: 'share-of-voice',
            marketingConsent,
            input: { your_domain: yourClean, competitors: compClean },
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

      let data: ScanApiResponse
      try {
        const res = await fetch('/api/mini-apps/share-of-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ your_domain: yourClean, competitors: compClean }),
        })
        data = (await res.json()) as ScanApiResponse
      } catch {
        stopLoader()
        setErrorMsg('Network error. Please check your connection and try again.')
        setSysState('error')
        setAppState('error')
        setSubmitting(false)
        return
      }

      if (!data.ok) {
        stopLoader()
        setErrorMsg(data.message)
        setSysState('error')
        setAppState('error')
        setSubmitting(false)
        return
      }

      completeLoader()
      await new Promise((r) => setTimeout(r, 400))
      setFree(data.free)

      // Auto-unlock gated portion using the captured email.
      let unlockData: UnlockApiResponse | null = null
      try {
        const res = await fetch('/api/mini-apps/share-of-voice/unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scanId: data.scanId, email: emailClean }),
        })
        unlockData = (await res.json()) as UnlockApiResponse
      } catch {
        // Non-fatal: free portion will still render. The user already paid the email cost.
      }
      if (unlockData?.ok) {
        setGated(unlockData.data)
        setTokens({ in: unlockData.data.tokens_in, out: unlockData.data.tokens_out })
      }

      setSysState('complete')
      setAppState('result')

      const completeOutput: Record<string, unknown> = { free: data.free }
      if (unlockData?.ok) completeOutput.gated = unlockData.data
      const completeBody: Record<string, unknown> = { submissionId, output: completeOutput }
      if (data.cost) completeBody.cost = data.cost
      fetch('/api/leads/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(completeBody),
      }).catch((err) => console.error('[share-of-voice] leads/complete', err))

      // Make the URL shareable / reload-safe without re-fetching.
      if (submissionId) {
        publish(submissionId)
      }

      setSubmitting(false)
    },
    [
      yourDomain,
      competitors,
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
    setFree(null)
    setGated(null)
    setErrorMsg('')
    setEmailError(null)
    setSubmitting(false)
    setSysState('idle')
    setTokens(null)
  }, [resetLoader])

  return (
    <div className="share-of-voice mini-app-scope">
      <AuroraBackground />

      <Header />

      <main className="shell">
        <section className="hero">
          <span className="eyebrow">AI Share of Voice Scorer</span>
          <h1>
            Who do the AIs <span className="accent">actually recommend?</span>
          </h1>
          <p>
            Enter your domain and up to three competitors. We ask the same buying-intent questions
            across Claude, ChatGPT, and Perplexity, and show who wins the answers.
          </p>
          <div className="meta-tags">
            <span>· 3 AI providers</span>
            <span>· Buying-intent questions</span>
            <span>· Competitor gap</span>
            <span>· Full report by email</span>
          </div>
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
              {(restoring || (appState === 'idle' && hasResultParam)) && (
                <section className="sov-state active">
                  <ResultRestoreNotice />
                </section>
              )}
              <section
                className={clsx('sov-state', {
                  active: appState === 'idle' && !restoring && !hasResultParam,
                })}
              >
                <div className="idle-label">Enter your domain and up to 3 competitors</div>
                <form className="idle-form" noValidate onSubmit={handleSubmit} autoComplete="off">
                  <Input
                    ref={domainInputRef}
                    label="Your domain"
                    type="text"
                    placeholder="yourbrand.com"
                    value={yourDomain}
                    disabled={submitting}
                    error={domainError}
                    shakeKey={shakeDomain}
                    onChange={(e) => {
                      setYourDomain(e.target.value)
                      if (domainError) setDomainError(null)
                    }}
                  />

                  <div className="domain-rows">
                    {competitors.map((c, i) => (
                      <div key={i} className="input-field domain-row">
                        <label>Competitor {competitors.length > 1 ? i + 1 : ''}</label>
                        <div className={clsx('input-box', { error: competitorError })}>
                          <input
                            type="text"
                            placeholder="competitor.com"
                            value={c}
                            disabled={submitting}
                            onChange={(e) => {
                              const next = [...competitors]
                              next[i] = e.target.value
                              setCompetitors(next)
                              if (competitorError) setCompetitorError(null)
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    {competitorError && <div className="field-error">{competitorError}</div>}
                    {competitors.length < 3 && (
                      <button
                        type="button"
                        className="add-competitor-btn"
                        disabled={submitting}
                        onClick={() => setCompetitors((prev) => [...prev, ''])}
                      >
                        + add competitor
                      </button>
                    )}
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
                        <path d="M3 3v18h18" />
                        <path d="M7 14l4-4 4 4 5-6" />
                      </svg>
                      Score my AI visibility
                    </button>
                  </div>
                </form>
              </section>

              <section className={clsx('sov-state', { active: appState === 'loading' })}>
                <LoadingStages
                  stages={STAGES}
                  label="Scoring AI visibility"
                  progressPct={progressPct}
                  loadingPct={loadingPct}
                  activeStage={activeStage}
                  doneStages={doneStages}
                  stageLogs={stageLogs}
                  waiting={waiting}
                />
              </section>

              <section className={clsx('sov-state', { active: appState === 'result' })}>
                {free && (
                  <>
                    <div ref={shareableRef}>
                      {restored ? (
                        // Restored from the DB (?result=<id>): render the free
                        // result, then the saved gated detail directly.
                        <>
                          <ShareOfVoiceResult
                            bare
                            input={{ your_domain: free.your_domain }}
                            output={{ free }}
                          />
                          {gated && <ShareOfVoiceGatedDetail free={free} gated={gated} />}
                        </>
                      ) : (
                        <ShareOfVoiceResult
                          bare
                          input={{ your_domain: free.your_domain }}
                          output={{ free, gated }}
                        />
                      )}
                    </div>

                    <div className="result-actions">
                      <ExportControls
                        resultRef={shareableRef}
                        slug="share-of-voice"
                        appName="AI Share of Voice Scorer"
                        filename={`sov-${free.your_domain.replace(/[^a-z0-9]/gi, '-')}`}
                        subject={free.your_domain}
                        plainText={buildShareOfVoicePlainText(free, gated)}
                      />
                      <button className="run-again" type="button" onClick={handleReset}>
                        Scan again
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
                className={clsx('sov-state', 'error-state', { active: appState === 'error' })}
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
              From domains to <span className="accent">answers</span> in under a minute
            </>
          }
          subtitle="Same buyer questions, three AIs, one scoreboard of who actually gets recommended."
          steps={HOW_IT_WORKS_STEPS}
        />
      </main>

      <Footer />
      <PageScripts />
    </div>
  )
}

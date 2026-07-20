'use client'

import { Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { clsx } from 'clsx'
import './page-styles.css'
import { useResultParam } from '@/components/mini-apps/useResultParam'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { HowItWorks, type HowItWorksStep } from '@/components/mini-apps/HowItWorks'
import type { ApiResponse, StackResult } from '@/app/api/mini-apps/tech-stack-recommender/route'
import { InlineConsentField } from '@/components/mini-apps/InlineConsentField'
import { Input } from '@/components/mini-apps/ui/Input'
import { Textarea } from '@/components/mini-apps/ui/Textarea'
import { ExportControls } from '@/components/mini-apps/ui/ExportControls'
import { useMiniAppLoader } from '@/components/mini-apps/useMiniAppLoader'
import { LoadingStages } from '@/components/mini-apps/LoadingStages'
import { ResultRestoreNotice } from '@/components/mini-apps/ResultRestoreNotice'
import { EMAIL_REGEX } from '@/lib/leads/disposable'
import { PageScripts } from './PageScripts'
import {
  TechStackRecommenderResult,
  buildTechStackRecommenderPlainText,
} from './components/TechStackRecommenderResult'

type AppState = 'idle' | 'loading' | 'result' | 'error'

const MIN_CHARS = 25

const STAGES = [
  {
    num: '01',
    title: 'Reading the brief',
    logs: ['parsing requirements', 'spotting the hard parts', 'sizing the project'],
  },
  {
    num: '02',
    title: 'Choosing the stack',
    logs: ['comparing frameworks', 'matching to needs', 'weighing trade-offs'],
  },
  {
    num: '03',
    title: 'Pricing it out',
    logs: ['estimating monthly cost', 'rating complexity', 'checking scale'],
  },
  {
    num: '04',
    title: 'Drawing the architecture',
    logs: ['laying out the layers', 'wiring services', 'stack ready'],
  },
]
const STAGE_MS = 5000

const EXAMPLES = [
  {
    label: 'Two-sided marketplace with payments',
    text: 'I need a two-sided marketplace for dog walkers with real-time GPS tracking, in-app messaging, Stripe payments with platform fees, and reviews for both sides.',
  },
  {
    label: 'AI chatbot SaaS with subscriptions',
    text: 'A B2B SaaS where teams upload docs and chat with an AI assistant. Need multi-tenant workspaces, usage limits, Stripe subscriptions, and admin analytics.',
  },
  {
    label: 'Mobile fitness app with video',
    text: 'A mobile fitness app with workout video libraries, progress tracking, push notifications, and optional premium subscriptions. iOS and Android from one codebase if possible.',
  },
]

const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    title: 'Paste a plain-English brief',
    description:
      'Describe the product the way you would in a meeting. No technical jargon required upfront.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M9 13h6M9 17h6" />
      </svg>
    ),
  },
  {
    title: 'Get six core layers',
    description:
      'Frontend through payments — each with a pick, the reason, alternatives, and a cost range.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="4" rx="1" />
        <rect x="3" y="10" width="18" height="4" rx="1" />
        <rect x="3" y="16" width="18" height="4" rx="1" />
      </svg>
    ),
  },
  {
    title: 'See an architecture card',
    description:
      'A layered diagram designed to screenshot cleanly into Slack, decks, or proposals.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    ),
  },
  {
    title: 'Reality-checked estimates',
    description:
      'Complexity, build time, and monthly cost at MVP scale — labeled honestly as estimates.',
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
]

export default function TechStackRecommenderPage() {
  return (
    <Suspense fallback={null}>
      <TechStackRecommenderPageInner />
    </Suspense>
  )
}

function TechStackRecommenderPageInner() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [brief, setBrief] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  const [shakeInput, setShakeInput] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<StackResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [tokens, setTokens] = useState<{ in: number; out: number } | null>(null)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [marketingConsent, setMarketingConsent] = useState(true)
  const [shakeEmail, setShakeEmail] = useState(0)

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

  const applyResult = useCallback((output: Record<string, unknown>) => {
    const r = output as StackResult
    setResult(r)
    if (typeof r.tokens_in === 'number' && typeof r.tokens_out === 'number') {
      setTokens({ in: r.tokens_in, out: r.tokens_out })
    }
    setSysState('complete')
    setAppState('result')
  }, [])
  const { restoring, hasResultParam, publish } = useResultParam(applyResult)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
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
      const t = setTimeout(() => textareaRef.current?.focus(), 200)
      return () => clearTimeout(t)
    }
  }, [appState])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (submitting) return

      let valid = true
      const trimmed = brief.trim()
      if (!trimmed || trimmed.length < MIN_CHARS) {
        setInputError('Tell us a bit more about what you want to build.')
        setShakeInput((k) => k + 1)
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

      setInputError(null)
      setEmailError(null)
      setSubmitting(true)
      setResult(null)
      setErrorMsg('')

      // Show the loading state immediately on a valid submit so there is no dead
      // time while the lead-save round-trips. On lead-save failure, revert to the
      // idle form and surface the error. (Reference: website-roast handleSubmit.)
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
            miniAppSlug: 'tech-stack-recommender',
            marketingConsent,
            input: { brief: trimmed },
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
        const res = await fetch('/api/mini-apps/tech-stack-recommender', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brief: trimmed }),
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
        setSysState('complete')
        setAppState('result')

        const completeBody: Record<string, unknown> = { submissionId, output: data.data }
        const withCost = data as ApiResponse & { cost?: unknown }
        if (withCost.cost) completeBody.cost = withCost.cost
        fetch('/api/leads/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(completeBody),
        }).catch((err) => console.error('[tech-stack-recommender] leads/complete', err))

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
        }).catch((err) => console.error('[tech-stack-recommender] leads/complete fail', err))
      }
      setSubmitting(false)
    },
    [
      brief,
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
    setInputError(null)
    setEmailError(null)
    setSubmitting(false)
    setSysState('idle')
    setTokens(null)
  }, [resetLoader])

  return (
    <div className="tech-stack-recommender mini-app-scope">
      <AuroraBackground />

      <Header />

      <main className="shell">
        <section className="hero">
          <span className="eyebrow">Tech Stack Recommender</span>
          <h1>
            Describe the idea. <span className="accent">Get the stack.</span>
          </h1>
          <p>
            Paste a product brief in plain English. Get a pragmatic architecture: six layers, cost
            estimates, and a card built to screenshot in your next meeting.
          </p>
          <div className="meta-tags">
            <span>· Frontend → Payments</span>
            <span>· Cost ranges</span>
            <span>· Build estimate</span>
            <span>· Shareable card</span>
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
                <section className="tsr-state active">
                  <ResultRestoreNotice />
                </section>
              )}

              <section
                className={clsx('tsr-state', {
                  active: appState === 'idle' && !restoring && !hasResultParam,
                })}
              >
                <div className="idle-label">Describe what you want to build</div>
                <form noValidate onSubmit={handleSubmit} autoComplete="off">
                  <Textarea
                    label="Project brief"
                    error={inputError}
                    shakeKey={shakeInput}
                    count={brief.length}
                    ref={textareaRef}
                    rows={6}
                    placeholder="I need a two-sided marketplace for dog walkers with real-time tracking and payments."
                    value={brief}
                    disabled={submitting}
                    onChange={(e) => {
                      setBrief(e.target.value)
                      if (inputError) setInputError(null)
                    }}
                  />
                  <div className="example-chips">
                    {EXAMPLES.map((ex) => (
                      <button
                        key={ex.label}
                        type="button"
                        className="example-chip"
                        disabled={submitting}
                        onClick={() => {
                          setBrief(ex.text)
                          setInputError(null)
                        }}
                      >
                        {ex.label}
                      </button>
                    ))}
                  </div>
                  <Input
                    label="Work email"
                    required
                    error={emailError}
                    shakeKey={shakeEmail}
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
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                      </svg>
                      Recommend a stack
                    </button>
                  </div>
                </form>
              </section>

              <section className={clsx('tsr-state', { active: appState === 'loading' })}>
                <LoadingStages
                  stages={STAGES}
                  label={
                    <>
                      Analysing <strong>{brief.length} chars</strong>
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

              <section className={clsx('tsr-state', { active: appState === 'result' })}>
                {result && (
                  <>
                    <div ref={resultPanelRef}>
                      <TechStackRecommenderResult bare input={{ brief }} output={result} />
                    </div>

                    <div className="result-actions">
                      <ExportControls
                        resultRef={resultPanelRef}
                        slug="tech-stack-recommender"
                        appName="Tech Stack Recommender"
                        filename={`stack-${result.project_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`}
                        subject={result.project_name}
                        plainText={buildTechStackRecommenderPlainText(result)}
                      />
                      <button className="run-again" type="button" onClick={handleReset}>
                        New project
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
                className={clsx('tsr-state', 'error-state', { active: appState === 'error' })}
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
                <h2 className="err-title">Recommendation failed</h2>
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
              From brief to <span className="accent">stack</span> in seconds
            </>
          }
          subtitle="Describe the product. Get a pragmatic architecture and an estimate you can defend."
          steps={HOW_IT_WORKS_STEPS}
        />
      </main>

      <Footer />
      <PageScripts />
    </div>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { clsx } from 'clsx'
import './page-styles.css'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { HowItWorks, type HowItWorksStep } from '@/components/mini-apps/HowItWorks'
import type { ApiResponse, ProposalResult } from '@/app/api/mini-apps/proposal-engine/route'
import { InlineConsentField } from '@/components/mini-apps/InlineConsentField'
import { ExportControls } from '@/components/mini-apps/ui/ExportControls'
import { EMAIL_REGEX } from '@/lib/leads/disposable'
import { PageScripts } from './PageScripts'
import {
  ProposalEngineResult,
  TONE_LABEL,
  buildProposalEnginePlainText,
} from './components/ProposalEngineResult'

type AppState = 'idle' | 'loading' | 'result' | 'error'
type Tone = 'formal' | 'conversational' | 'technical'

const STAGES = [
  {
    num: '01',
    title: 'Reading the brief',
    logs: ['parsing input', 'extracting requirements', 'brief understood'],
  },
  {
    num: '02',
    title: 'Scoping the project',
    logs: ['mapping deliverables', 'structuring phases', 'scope defined'],
  },
  {
    num: '03',
    title: 'Recommending stack',
    logs: ['evaluating options', 'matching to brief', 'stack selected'],
  },
  {
    num: '04',
    title: 'Writing proposal',
    logs: ['drafting sections', 'tuning tone', 'proposal ready'],
  },
]
const STAGE_MS = 5000

const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    title: 'Paste the client brief',
    description:
      'Drop in an RFP, a discovery call summary, or a few paragraphs that capture what the client needs.',
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
    title: 'Pick a tone',
    description:
      'Formal, conversational, or technical. We tune voice and structure to match how this client buys.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 12h3l3-7 4 14 3-7h5" />
      </svg>
    ),
  },
  {
    title: 'See the structured draft',
    description:
      'Scope, phased delivery plan, a recommended tech stack with reasons, and a realistic timeline.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 9h10M7 13h10M7 17h6" />
      </svg>
    ),
  },
  {
    title: 'Copy or export',
    description:
      'Grab plain text for your editor, or download a PNG / PDF you can drop straight into a follow-up.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3v12" />
        <path d="M7 10l5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
    ),
  },
]

const TONE_OPTIONS: { id: Tone; label: string }[] = [
  { id: 'formal', label: 'Formal' },
  { id: 'conversational', label: 'Conversational' },
  { id: 'technical', label: 'Technical' },
]

function fmtTs(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `PROPOSAL · ${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} · ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`
}

export default function ProposalEnginePage() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [briefText, setBriefText] = useState('')
  const [tone, setTone] = useState<Tone>('formal')
  const [inputError, setInputError] = useState<string | null>(null)
  const [shakeInput, setShakeInput] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ProposalResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [resultTs, setResultTs] = useState('')
  const [tokens, setTokens] = useState<{ in: number; out: number } | null>(null)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [marketingConsent, setMarketingConsent] = useState(true)
  const [shakeEmail, setShakeEmail] = useState(0)

  const [activeStage, setActiveStage] = useState(-1)
  const [doneStages, setDoneStages] = useState<number[]>([])
  const [stageLogs, setStageLogs] = useState<string[]>(['', '', '', ''])
  const [progressPct, setProgressPct] = useState(0)
  const [loadingPct, setLoadingPct] = useState('0%')
  const [latency, setLatency] = useState('—')
  const [sysState, setSysState] = useState('idle')
  const [clock, setClock] = useState('—')
  const [loadingLabel, setLoadingLabel] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const resultPanelRef = useRef<HTMLDivElement | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const rafRef = useRef<number | null>(null)
  const runStartRef = useRef(0)

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

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current = []
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  const startLoadingAnimation = useCallback(
    (label: string) => {
      clearTimers()
      setActiveStage(0)
      setDoneStages([])
      setStageLogs(['', '', '', ''])
      setProgressPct(0)
      setLoadingPct('0%')
      setLatency('0.0s')
      setLoadingLabel(label)
      const startTime = performance.now()
      runStartRef.current = startTime
      const totalMs = STAGE_MS * STAGES.length

      const tick = (now: number) => {
        const pct = Math.min(98, ((now - startTime) / totalMs) * 100)
        setProgressPct(pct)
        setLoadingPct(Math.floor(pct) + '%')
        setLatency(((now - startTime) / 1000).toFixed(1) + 's')
        if (pct < 98) rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)

      STAGES.forEach((stage, i) => {
        timersRef.current.push(
          setTimeout(() => {
            setActiveStage(i)
            setStageLogs((prev) => {
              const n = [...prev]
              n[i] = stage.logs[0] ?? ''
              return n
            })
            stage.logs.forEach((log, li) => {
              if (li === 0) return
              timersRef.current.push(
                setTimeout(
                  () => {
                    setStageLogs((prev) => {
                      const n = [...prev]
                      n[i] = log
                      return n
                    })
                  },
                  (li * STAGE_MS) / stage.logs.length
                )
              )
            })
          }, i * STAGE_MS)
        )
        timersRef.current.push(
          setTimeout(
            () => {
              setDoneStages((prev) => [...prev, i])
              setStageLogs((prev) => {
                const n = [...prev]
                n[i] = stage.logs[stage.logs.length - 1] ?? ''
                return n
              })
            },
            (i + 1) * STAGE_MS
          )
        )
      })
    },
    [clearTimers]
  )

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (submitting) return

      let valid = true
      const trimBrief = briefText.trim()
      if (!trimBrief || trimBrief.length < 50) {
        setInputError('Paste the full client brief (at least 50 characters).')
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

      let submissionId: string | null = null
      try {
        const res = await fetch('/api/leads/submit', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email: emailClean,
            miniAppSlug: 'proposal-engine',
            marketingConsent,
            input: { brief_text: trimBrief, tone },
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

      setSysState('running')
      setAppState('loading')
      startLoadingAnimation(`${trimBrief.length} chars · ${TONE_LABEL[tone]}`)

      let data: ApiResponse
      try {
        const res = await fetch('/api/mini-apps/proposal-engine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brief_text: trimBrief, tone }),
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
        setDoneStages([0, 1, 2, 3])
        await new Promise((r) => setTimeout(r, 400))
        setResult(data.data)
        setTokens({ in: data.data.tokens_in, out: data.data.tokens_out })
        setResultTs(fmtTs(new Date()))
        setSysState('complete')
        setAppState('result')

        const completeBody: Record<string, unknown> = { submissionId, output: data.data }
        const withCost = data as ApiResponse & { cost?: unknown }
        if (withCost.cost) completeBody.cost = withCost.cost
        fetch('/api/leads/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(completeBody),
        }).catch((err) => console.error('[proposal-engine] leads/complete', err))
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
        }).catch((err) => console.error('[proposal-engine] leads/complete fail', err))
      }
      setSubmitting(false)
    },
    [briefText, tone, email, marketingConsent, submitting, startLoadingAnimation, clearTimers]
  )

  const handleReset = useCallback(() => {
    clearTimers()
    setAppState('idle')
    setResult(null)
    setErrorMsg('')
    setInputError(null)
    setEmailError(null)
    setSubmitting(false)
    setSysState('idle')
    setLatency('—')
    setProgressPct(0)
    setTokens(null)
  }, [clearTimers])

  return (
    <div className="proposal-engine mini-app-scope">
      <AuroraBackground />

      <Header />

      <main className="shell">
        <section className="hero">
          <span className="eyebrow">Proposal Draft Engine</span>
          <h1>
            Brief in, <span className="accent">proposal out.</span>
          </h1>
          <p>
            Paste a client brief or RFP. Get a structured proposal with scope, phases, tech stack,
            timeline, and a tailored why-us section, in seconds.
          </p>
          <div className="meta-tags">
            <span>· Scope</span>
            <span>· Phases</span>
            <span>· Tech Stack</span>
            <span>· Timeline</span>
          </div>
        </section>

        <div className="panel-wrap">
          <div className="panel">
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />

            <div className="panel-readouts">
              <div className="prl">
                <span>
                  <span className="stat-key">sys</span> <span className="stat-val">{sysState}</span>
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
                      <span className="stat-val">{(tokens.in + tokens.out).toLocaleString()}</span>
                    </span>
                    <span className="pr-sep hide-sm" />
                  </>
                )}
                <span className="hide-sm">
                  <span className="stat-key">lat</span> <span className="stat-val">{latency}</span>
                </span>
                <span className="pr-sep hide-sm" />
                <span>
                  <span className="stat-key">ts</span> <span className="stat-val">{clock}</span>
                </span>
              </div>
            </div>

            <div className="panel-body">
              <section className={clsx('pe-state', { active: appState === 'idle' })}>
                <div className="idle-label">Client brief</div>
                <form noValidate onSubmit={handleSubmit} autoComplete="off">
                  <div className="input-field">
                    <label>Brief or RFP text</label>
                    <div
                      key={`t-${shakeInput}`}
                      className={clsx('textarea-box', { error: inputError })}
                    >
                      <textarea
                        ref={textareaRef}
                        placeholder={`We need a custom SaaS platform for managing field operations...\nMust integrate with Salesforce and support mobile offline mode...\nTimeline: Q3 launch, budget TBD...`}
                        value={briefText}
                        disabled={submitting}
                        onChange={(e) => {
                          setBriefText(e.target.value)
                          if (inputError) setInputError(null)
                        }}
                      />
                    </div>
                    {inputError && <div className="field-error">{inputError}</div>}
                    <div className="char-count">{briefText.length} chars</div>
                  </div>

                  <div className="idle-label" style={{ marginTop: '8px' }}>
                    Proposal tone
                  </div>
                  <div className="tone-selector">
                    {TONE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={clsx('tone-pill', { active: tone === opt.id })}
                        onClick={() => setTone(opt.id)}
                        disabled={submitting}
                      >
                        {opt.label}
                      </button>
                    ))}
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
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                      </svg>
                      Generate proposal
                    </button>
                  </div>
                </form>
              </section>

              <section className={clsx('pe-state', { active: appState === 'loading' })}>
                <div className="progress-track">
                  <div className="progress-bar" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="loading-header">
                  <span>
                    Drafting <strong>{loadingLabel}</strong>
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

              <section className={clsx('pe-state', { active: appState === 'result' })}>
                {result && (
                  <>
                    <div ref={resultPanelRef}>
                      <ProposalEngineResult
                        bare
                        input={{ brief_text: briefText, tone }}
                        output={result}
                        tsLabel={resultTs}
                      />
                    </div>

                    <div className="result-footer">
                      <div className="export-actions">
                        <ExportControls
                          resultRef={resultPanelRef}
                          slug="proposal-engine"
                          appName="Proposal Draft Engine"
                          filename="proposal-draft"
                          plainText={buildProposalEnginePlainText(result)}
                        />
                        <button className="run-again" type="button" onClick={handleReset}>
                          New proposal
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

              <section
                className={clsx('pe-state', 'error-state', { active: appState === 'error' })}
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
                <h2 className="err-title">Generation failed</h2>
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
              From brief to <span className="accent">proposal</span> in under a minute
            </>
          }
          subtitle="Paste, pick a tone, and get a structured draft you can hand to the client."
          steps={HOW_IT_WORKS_STEPS}
        />
      </main>

      <Footer />
      <PageScripts />
    </div>
  )
}

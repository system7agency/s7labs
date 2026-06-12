'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { clsx } from 'clsx'
import './page-styles.css'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { InlineConsentField } from '@/components/mini-apps/InlineConsentField'
import { Input } from '@/components/mini-apps/ui/Input'
import { Textarea } from '@/components/mini-apps/ui/Textarea'
import { ExportControls } from '@/components/mini-apps/ui/ExportControls'
import { useMiniAppLoader } from '@/components/mini-apps/useMiniAppLoader'
import { LoadingStages } from '@/components/mini-apps/LoadingStages'
import { EMAIL_REGEX } from '@/lib/leads/disposable'
import { HowItWorks, type HowItWorksStep } from '@/components/mini-apps/HowItWorks'
import type { ApiResponse, Hook, HookResult } from '@/app/api/mini-apps/linkedin-hook/route'
import {
  LinkedinHookResult,
  buildLinkedinHookPlainText,
  CHANNEL_LABEL,
  CHANNEL_CLASS,
} from './components/LinkedinHookResult'
import { PageScripts } from './PageScripts'

type AppState = 'idle' | 'loading' | 'result' | 'error'

const HOOK_STEPS: HowItWorksStep[] = [
  {
    title: 'Paste a LinkedIn post',
    description:
      'Any public post: yours, your prospect’s, or a thought-leader you want to bring into your outreach.',
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
        <path d="M8 11v6M8 7h.01M12 17v-4M16 17v-3a2 2 0 10-4 0" />
      </svg>
    ),
  },
  {
    title: 'We extract the trigger, author, and signals',
    description:
      'Opinion, news, pain, or achievement: the specific moment in the post that creates an opening for outreach.',
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
    title: 'AI generates personalized outbound hooks',
    description:
      'Each hook uses a different tone and channel (LinkedIn DM, email, or cold call) mapped to the buyer persona.',
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
    title: 'Get hooks ranked by reply likelihood',
    description:
      'The hook most likely to land is flagged first so you can send it without second-guessing.',
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
    title: 'Reading the post',
    logs: ['parsing text', 'extracting context', 'content ready'],
  },
  {
    num: '02',
    title: 'Identifying trigger',
    logs: ['scanning for signals', 'classifying intent', 'trigger found'],
  },
  {
    num: '03',
    title: 'Profiling persona',
    logs: ['mapping buyer role', 'scoring fit', 'persona locked'],
  },
  {
    num: '04',
    title: 'Writing hooks',
    logs: ['drafting angles', 'crafting openers', 'hooks ready'],
  },
]
const STAGE_MS = 4000

function fmtTs(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `REPORT · ${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} · ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`
}

function HookCard({ hook, isBest }: { hook: Hook; isBest: boolean }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    const text = `${hook.opening_line}\n\n${hook.follow_up}`
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }, [hook])

  return (
    <div className={clsx('hook-card', { best: isBest })}>
      <div className="hook-card-header">
        <span className="hook-angle">{`// ${hook.angle}`}</span>
        <div className="hook-badges">
          {isBest && <span className="badge best-badge">Best</span>}
          <span className={`badge ${CHANNEL_CLASS[hook.channel] ?? ''}`}>
            {CHANNEL_LABEL[hook.channel] ?? hook.channel}
          </span>
          <span className="badge">{hook.tone}</span>
          <button
            type="button"
            className={clsx('hook-copy-btn', { copied })}
            onClick={handleCopy}
            aria-label="Copy hook"
            data-export-ignore="true"
          >
            {copied ? (
              <>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>
      <p className="hook-opening">{hook.opening_line}</p>
      <div className="hook-followup-label">{'// Follow-up'}</div>
      <p className="hook-followup">{hook.follow_up}</p>
    </div>
  )
}

export default function LinkedInHookPage() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [postText, setPostText] = useState('')
  const [postError, setPostError] = useState<string | null>(null)
  const [shakePost, setShakePost] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<HookResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [resultTs, setResultTs] = useState('')
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
      const postClean = postText.trim()
      if (!postClean || postClean.length < 30) {
        setPostError('Paste the full LinkedIn post text (at least 30 characters).')
        setShakePost((k) => k + 1)
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

      setPostError(null)
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
            miniAppSlug: 'linkedin-post-outbound-hook',
            marketingConsent,
            input: { post_text: postClean },
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
        const res = await fetch('/api/mini-apps/linkedin-hook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_text: postClean }),
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
        }).catch((err) => console.error('[linkedin-hook] leads/complete', err))
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
        }).catch((err) => console.error('[linkedin-hook] leads/complete fail', err))
      }
      setSubmitting(false)
    },
    [
      postText,
      email,
      marketingConsent,
      submitting,
      startLoader,
      stopLoader,
      completeLoader,
      resetLoader,
    ]
  )

  const handleReset = useCallback(() => {
    resetLoader()
    setAppState('idle')
    setResult(null)
    setErrorMsg('')
    setPostError(null)
    setEmailError(null)
    setSubmitting(false)
    setSysState('idle')
    setTokens(null)
  }, [resetLoader])

  return (
    <div className="linkedin-hook mini-app-scope">
      <AuroraBackground />

      <Header />

      <main className="shell">
        <section className="hero">
          <span className="eyebrow">LinkedIn Post to Outbound Hook</span>
          <h1>
            Turn any post into a <span className="accent">personalised opener.</span>
          </h1>
          <p>
            Paste a LinkedIn post. We detect the trigger, profile the persona, and write three
            ready-to-send hooks, each with a different angle and channel.
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
              {/* IDLE */}
              <section className={clsx('lh-state', { active: appState === 'idle' })}>
                <div className="idle-label">LinkedIn post text</div>
                <form className="idle-form" noValidate onSubmit={handleSubmit} autoComplete="off">
                  <Textarea
                    ref={textareaRef}
                    label="Paste the full post"
                    placeholder={`Just raised our Series A...\nHiring 10 engineers in Q3...\nWhy I stopped using spreadsheets for sales...`}
                    value={postText}
                    disabled={submitting}
                    count={postText.length}
                    error={postError}
                    shakeKey={shakePost}
                    onChange={(e) => {
                      setPostText(e.target.value)
                      if (postError) setPostError(null)
                    }}
                  />
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
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                      Generate hooks
                    </button>
                  </div>
                </form>
              </section>

              {/* LOADING */}
              <section className={clsx('lh-state', { active: appState === 'loading' })}>
                <LoadingStages
                  stages={STAGES}
                  label="Analysing post"
                  progressPct={progressPct}
                  loadingPct={loadingPct}
                  activeStage={activeStage}
                  doneStages={doneStages}
                  stageLogs={stageLogs}
                  waiting={waiting}
                />
              </section>

              {/* RESULT */}
              <section className={clsx('lh-state', { active: appState === 'result' })}>
                {result && (
                  <>
                    <div ref={resultPanelRef}>
                      <LinkedinHookResult
                        bare
                        input={{ post_text: postText }}
                        output={result}
                        tsLabel={resultTs}
                        renderHook={(hook, _i, isBest) => <HookCard hook={hook} isBest={isBest} />}
                      />
                    </div>

                    <div className="result-actions">
                      <ExportControls
                        resultRef={resultPanelRef}
                        slug="linkedin-hook"
                        appName="LinkedIn Post to Outbound Hook"
                        filename={`linkedin-hook-${result.post_author.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`}
                        subject={result.post_author}
                        plainText={buildLinkedinHookPlainText(result)}
                      />
                      <button className="run-again" type="button" onClick={handleReset}>
                        New post
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
                className={clsx('lh-state', 'error-state', { active: appState === 'error' })}
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

        <HowItWorks
          title={
            <>
              From a single post to <span className="accent">ranked hooks</span>
            </>
          }
          subtitle="No login, no install. Four steps from paste to a ready-to-send opener."
          steps={HOOK_STEPS}
        />
      </main>

      <Footer />
      <PageScripts />
    </div>
  )
}

'use client'

import { Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { clsx } from 'clsx'
import './page-styles.css'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { HowItWorks, type HowItWorksStep } from '@/components/mini-apps/HowItWorks'
import { InlineConsentField } from '@/components/mini-apps/InlineConsentField'
import { Input } from '@/components/mini-apps/ui/Input'
import { Textarea } from '@/components/mini-apps/ui/Textarea'
import { ExportControls } from '@/components/mini-apps/ui/ExportControls'
import { useMiniAppLoader } from '@/components/mini-apps/useMiniAppLoader'
import { useResultParam } from '@/components/mini-apps/useResultParam'
import { LoadingStages } from '@/components/mini-apps/LoadingStages'
import { ResultRestoreNotice } from '@/components/mini-apps/ResultRestoreNotice'
import { EMAIL_REGEX } from '@/lib/leads/disposable'

import type {
  ApiResponse,
  ProfileReviewResult,
  TopAction,
} from '@/app/api/mini-apps/linkedin-profile-reviewer/route'
import { PageScripts } from './PageScripts'

type AppState = 'idle' | 'loading' | 'result' | 'error'
type InputMode = 'url' | 'paste'

const STAGES = [
  {
    num: '01',
    title: 'Collecting profile content',
    logs: ['validating input', 'preparing source'],
  },
  {
    num: '02',
    title: 'Extracting core signals',
    logs: ['headline and about read', 'experience parsed'],
  },
  { num: '03', title: 'Scoring profile sections', logs: ['section scoring', 'consistency checks'] },
  { num: '04', title: 'Ranking top actions', logs: ['prioritizing fixes', 'review packaging'] },
]
const STAGE_MS = 4200

const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    title: 'Choose URL or paste mode',
    description:
      'Use a public LinkedIn profile URL, or paste the profile text directly when LinkedIn blocks scraping.',
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
        <path d="M3 9h18" />
        <path d="M8 14h8" />
      </svg>
    ),
  },
  {
    title: 'We evaluate six profile sections',
    description:
      'Headline, About, Experience, Skills, Recommendations, and Photo/Banner are reviewed with practical feedback.',
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
    title: 'AI scores profile clarity',
    description:
      'You get one score plus section-level verdicts so you can quickly spot what helps or hurts recruiter and buyer trust.',
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
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </svg>
    ),
  },
  {
    title: 'Get five ranked improvements',
    description:
      'Top actions are prioritized by impact so you know exactly what to change first before updating your profile.',
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

function fmtTs(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `REVIEW · ${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} · ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
}

function impactClass(impact: TopAction['impact']) {
  if (impact === 'high') return 'high'
  if (impact === 'medium') return 'mid'
  return 'low'
}

function scoreClass(score: number) {
  if (score >= 80) return 'good'
  if (score >= 60) return 'mid'
  return 'bad'
}

function buildPlainText(result: ProfileReviewResult): string {
  return [
    'LinkedIn Profile Reviewer',
    '='.repeat(60),
    result.sourceUrl ? `Source: ${result.sourceUrl}` : 'Source: pasted profile text',
    `Score: ${result.score}/100`,
    '',
    result.summary,
    '',
    '// SECTION SCORES',
    ...result.sections.map((section) => {
      return `${section.name}: ${section.score}/100\n${section.verdict}\n${section.feedback}`
    }),
    '',
    '// TOP 5 ACTIONS',
    ...result.topActions.map(
      (action) =>
        `${action.rank}. [${action.impact.toUpperCase()}] ${action.action}\n   ${action.rationale}`
    ),
    '',
    `Tokens: ${(result.tokens_in + result.tokens_out).toLocaleString()} (${result.tokens_in.toLocaleString()} in / ${result.tokens_out.toLocaleString()} out)`,
    'Generated by S7 Labs LinkedIn Profile Reviewer',
  ].join('\n')
}

export default function LinkedInProfileReviewerPage() {
  return (
    <Suspense fallback={null}>
      <LinkedInProfileReviewerPageInner />
    </Suspense>
  )
}

function LinkedInProfileReviewerPageInner() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [mode, setMode] = useState<InputMode>('url')
  const [url, setUrl] = useState('')
  const [profileText, setProfileText] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  const [shakeInput, setShakeInput] = useState(0)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [marketingConsent, setMarketingConsent] = useState(true)
  const [shakeEmail, setShakeEmail] = useState(0)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ProfileReviewResult | null>(null)
  const [resultTs, setResultTs] = useState('')
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
    const r = output as ProfileReviewResult
    setResult(r)
    setResultTs(fmtTs(new Date()))
    setAppState('result')
  }, [])
  const { restoring, hasResultParam, publish } = useResultParam(applyResult)

  const urlInputRef = useRef<HTMLInputElement | null>(null)
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const resultPanelRef = useRef<HTMLDivElement | null>(null)

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
    if (appState !== 'idle') return
    const t = setTimeout(() => {
      if (mode === 'url') {
        urlInputRef.current?.focus()
      } else {
        textAreaRef.current?.focus()
      }
    }, 150)
    return () => clearTimeout(t)
  }, [appState, mode])

  const resetToInput = useCallback(() => {
    resetLoader()
    setAppState('idle')
    setInputError(null)
    setErrorCode(null)
    setErrorMsg('')
    setSubmitting(false)
    setResult(null)
    setEmailError(null)
  }, [resetLoader])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (submitting) return

      const trimmedUrl = url.trim()
      const trimmedText = profileText.trim()
      let valid = true

      if (mode === 'url') {
        if (!trimmedUrl) {
          setInputError('Paste a LinkedIn profile URL to continue.')
          setShakeInput((k) => k + 1)
          valid = false
        }
      } else if (trimmedText.length < 100 || trimmedText.length > 8000) {
        setInputError('Paste between 100 and 8000 characters of profile text.')
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
      setErrorCode(null)
      setErrorMsg('')
      setSubmitting(true)
      setResult(null)

      // Show the loading state immediately on a valid submit so there is no dead
      // time while the lead-save round-trips. On lead-save failure, revert to the
      // idle form and surface the error.
      setAppState('loading')
      startLoader()

      let submissionId: string | null = null
      try {
        const leadRes = await fetch('/api/leads/submit', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email: emailClean,
            miniAppSlug: 'linkedin-profile-reviewer',
            input: {
              mode,
              url: trimmedUrl || undefined,
              profileText: trimmedText || undefined,
            },
            marketingConsent,
          }),
        })
        const leadJson = (await leadRes.json()) as {
          ok: boolean
          submissionId?: string
          error?: string
        }
        if (!leadRes.ok || !leadJson.ok || !leadJson.submissionId) {
          resetLoader()
          setAppState('idle')
          setEmailError(leadJson.error || "Couldn't save your info. Try again.")
          setShakeEmail((k) => k + 1)
          setSubmitting(false)
          return
        }
        submissionId = leadJson.submissionId
      } catch {
        resetLoader()
        setAppState('idle')
        setEmailError("Couldn't save your info. Try again.")
        setShakeEmail((k) => k + 1)
        setSubmitting(false)
        return
      }

      try {
        const res = await fetch('/api/mini-apps/linkedin-profile-reviewer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode,
            url: trimmedUrl || undefined,
            profileText: trimmedText || undefined,
          }),
        })
        const data = (await res.json()) as ApiResponse

        if (data.ok) {
          completeLoader()
          setResult(data.data)
          setResultTs(fmtTs(new Date()))
          setAppState('result')

          fetch('/api/leads/complete', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              submissionId,
              output: data.data,
              ...(data.cost ? { cost: data.cost } : {}),
            }),
          }).catch((err) => console.error('[linkedin-profile-reviewer] leads/complete', err))

          if (submissionId) publish(submissionId)
        } else {
          stopLoader()
          setErrorCode(data.code ?? null)
          setErrorMsg(data.message)
          setAppState('error')
        }
      } catch {
        stopLoader()
        setErrorCode(null)
        setErrorMsg('Network error. Please check your connection and try again.')
        setAppState('error')
      } finally {
        setSubmitting(false)
      }
    },
    [
      mode,
      profileText,
      email,
      marketingConsent,
      startLoader,
      stopLoader,
      completeLoader,
      resetLoader,
      submitting,
      url,
      publish,
    ]
  )

  return (
    <div className="linkedin-profile-reviewer mini-app-scope">
      <AuroraBackground />
      <Header />

      <main className="shell">
        <section className="hero">
          <span className="eyebrow">LinkedIn Profile Reviewer</span>
          <h1>
            Improve your profile with <span className="accent">ranked actions</span>.
          </h1>
          <p>
            Get a structured review across six sections and five priority fixes so your profile
            reads clearer to prospects, recruiters, and partners.
          </p>
        </section>

        <div className="panel-wrap">
          <div className="panel">
            {appState !== 'idle' && (
              <div className="panel-readouts">
                <div className="pr-left">
                  <span className="stat-key">mode</span>
                  <span className="stat-val">{mode}</span>
                </div>
                <div className="pr-right">
                  <span className="stat-key hide-sm">lat</span>
                  <span className="stat-val hide-sm">{latency}</span>
                  <span className="pr-sep hide-sm" />
                  <span className="stat-key">ts</span>
                  <span className="stat-val">{clock}</span>
                </div>
              </div>
            )}

            <div className="panel-body">
              {(restoring || (appState === 'idle' && hasResultParam)) && (
                <section className="lpr-state active">
                  <ResultRestoreNotice />
                </section>
              )}
              <section
                className={clsx('lpr-state', {
                  active: appState === 'idle' && !restoring && !hasResultParam,
                })}
              >
                <div className="mode-toggle">
                  <button
                    type="button"
                    className={clsx('mode-btn', { active: mode === 'url' })}
                    onClick={() => {
                      setMode('url')
                      setInputError(null)
                    }}
                  >
                    LinkedIn URL
                  </button>
                  <button
                    type="button"
                    className={clsx('mode-btn', { active: mode === 'paste' })}
                    onClick={() => {
                      setMode('paste')
                      setInputError(null)
                    }}
                  >
                    Paste text
                  </button>
                </div>

                <form className="idle-form" noValidate onSubmit={handleSubmit}>
                  {mode === 'url' ? (
                    <Input
                      ref={urlInputRef}
                      id="linkedin-url"
                      label="Profile URL"
                      required
                      type="url"
                      placeholder="https://www.linkedin.com/in/username"
                      spellCheck={false}
                      value={url}
                      disabled={submitting}
                      error={inputError}
                      shakeKey={shakeInput}
                      onChange={(e) => {
                        setUrl(e.target.value)
                        if (inputError) setInputError(null)
                      }}
                    />
                  ) : (
                    <Textarea
                      ref={textAreaRef}
                      id="profile-text"
                      label="Profile text"
                      required
                      placeholder="Paste headline, about, experience, skills, and recommendations here..."
                      value={profileText}
                      disabled={submitting}
                      error={inputError}
                      shakeKey={shakeInput}
                      count={profileText.length}
                      maxLength={8000}
                      onChange={(e) => {
                        setProfileText(e.target.value)
                        if (inputError) setInputError(null)
                      }}
                    />
                  )}

                  <Input
                    id="work-email"
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
                        <path d="M5 12h14" />
                        <path d="M13 5l7 7-7 7" />
                      </svg>
                      Review profile
                    </button>
                  </div>
                </form>
              </section>

              <section className={clsx('lpr-state', { active: appState === 'loading' })}>
                <LoadingStages
                  stages={STAGES}
                  label="Analyzing profile"
                  progressPct={progressPct}
                  loadingPct={loadingPct}
                  activeStage={activeStage}
                  doneStages={doneStages}
                  stageLogs={stageLogs}
                  waiting={waiting}
                />
              </section>

              <section className={clsx('lpr-state', { active: appState === 'result' })}>
                {result && (
                  <>
                    <div ref={resultPanelRef}>
                      <div className="result-head">
                        <span className="ts">{resultTs}</span>
                        <span className={clsx('score-pill', scoreClass(result.score))}>
                          Score {result.score}/100
                        </span>
                      </div>
                      <p className="result-summary">{result.summary}</p>

                      <div className="section-grid">
                        {result.sections.map((section) => (
                          <article key={section.name} className="section-card">
                            <div className="section-row">
                              <span className="section-name">{section.name}</span>
                              <span className={clsx('section-score', scoreClass(section.score))}>
                                {section.score}
                              </span>
                            </div>
                            <p className="section-verdict">{section.verdict}</p>
                            <p className="section-feedback">{section.feedback}</p>
                          </article>
                        ))}
                      </div>

                      <div className="actions-block">
                        <div className="actions-header">
                          <span>{'// Top 5 actions'}</span>
                          <span className="actions-sub">ranked by impact</span>
                        </div>
                        <div className="actions-list">
                          {result.topActions.map((item) => (
                            <article key={item.rank} className="action-card">
                              <div className="action-row">
                                <span className="action-rank">0{item.rank}</span>
                                <span className={clsx('impact-chip', impactClass(item.impact))}>
                                  {item.impact}
                                </span>
                              </div>
                              <h3>{item.action}</h3>
                              <p>{item.rationale}</p>
                            </article>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="result-actions">
                      <ExportControls
                        resultRef={resultPanelRef}
                        slug="linkedin-profile-reviewer"
                        appName="LinkedIn Profile Reviewer"
                        filename={`linkedin-review-score-${result.score}`}
                        subject={result.sourceUrl ?? 'pasted profile'}
                        plainText={buildPlainText(result)}
                      />
                      <button className="run-again" type="button" onClick={resetToInput}>
                        Review another
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
                className={clsx('lpr-state', 'error-state', { active: appState === 'error' })}
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
                <h2 className="err-title">Review failed</h2>
                <p className="err-msg">{errorMsg}</p>
                <div className="error-actions">
                  <button type="button" className="err-btn" onClick={resetToInput}>
                    Try again
                  </button>
                  {errorCode === 'SCRAPE_BLOCKED' && (
                    <button
                      type="button"
                      className="run-again"
                      onClick={() => {
                        setMode('paste')
                        setAppState('idle')
                        setInputError(null)
                      }}
                    >
                      Switch to paste mode
                    </button>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>

        <HowItWorks
          title={
            <>
              From profile to <span className="accent">clear next steps</span>
            </>
          }
          subtitle="Four steps from input to a ranked LinkedIn profile improvement plan."
          steps={HOW_IT_WORKS_STEPS}
        />
      </main>

      <Footer />
      <PageScripts />
    </div>
  )
}

'use client'

import { Suspense, useCallback, useMemo, useRef, useState, type FormEvent } from 'react'

import { clsx } from 'clsx'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { HowItWorks, type HowItWorksStep } from '@/components/mini-apps/HowItWorks'
import { InlineConsentField } from '@/components/mini-apps/InlineConsentField'
import { Input } from '@/components/mini-apps/ui/Input'
import { Textarea } from '@/components/mini-apps/ui/Textarea'
import { ExportControls } from '@/components/mini-apps/ui/ExportControls'
import { useMiniAppLoader } from '@/components/mini-apps/useMiniAppLoader'
import { LoadingStages } from '@/components/mini-apps/LoadingStages'
import { useResultParam } from '@/components/mini-apps/useResultParam'
import { ResultRestoreNotice } from '@/components/mini-apps/ResultRestoreNotice'
import { EMAIL_REGEX } from '@/lib/leads/disposable'

import type {
  ApiResponse,
  EmailCopyOptimizerResult,
} from '@/app/api/mini-apps/email-copy-optimizer/route'
import './page-styles.css'
import { PageScripts } from './PageScripts'

type AppState = 'input' | 'loading' | 'result' | 'error'
type Tone = 'Formal' | 'Conversational' | 'Direct'

const STAGES = [
  {
    num: '01',
    title: 'Reading your email',
    logs: ['parsing subject + body', 'understanding the ask', 'email read'],
  },
  {
    num: '02',
    title: 'Diagnosing weak points',
    logs: ['scoring clarity', 'flagging issues', 'diagnosis ready'],
  },
  {
    num: '03',
    title: 'Writing variations',
    logs: ['drafting angles', 'tightening hooks', 'variations drafted'],
  },
  {
    num: '04',
    title: 'Polishing the rewrites',
    logs: ['refining CTAs', 'final pass', 'copy ready'],
  },
]
const STAGE_MS = 1700

const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    title: 'Paste your subject and body',
    description: 'Drop in a draft email. Add optional goal, audience, and tone context.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 8h10M7 12h10M7 16h6" />
      </svg>
    ),
  },
  {
    title: 'Get a quick diagnosis',
    description: 'We score clarity and flag up to five high-impact copy issues.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 19h16M7 16V9m5 7V5m5 11v-4" />
      </svg>
    ),
  },
  {
    title: 'Receive three new angles',
    description: 'You get three compact rewrites with distinct approaches and one clear CTA each.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 6h16M4 12h16M4 18h10" />
        <path d="m16 17 2 2 3-3" />
      </svg>
    ),
  },
  {
    title: 'Copy, ship, and iterate',
    description: 'Copy one variation or all three, then rerun with your next draft.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    ),
  },
]

const SAMPLE_SUBJECT = 'Quick idea to increase reply rate this quarter'
const SAMPLE_BODY = `Hi {{first_name}},

I noticed your team is hiring two RevOps roles while scaling outbound. That usually means pipeline quality and handoff speed are under pressure.

At S7 Labs, we help teams tighten targeting and automate follow-up sequences so reps spend less time on manual prep and more time in qualified conversations.

If useful, I can send a short teardown with three quick wins based on your current motion.

Best,
Alex`

function stripTemplateTokens(text: string): string {
  return text.replace(/\{\{.*?\}\}/g, '').trim()
}

function buildVariationText(variation: EmailCopyOptimizerResult['variations'][number]): string {
  return [`${variation.subject}`, '', `${variation.body}`].join('\n')
}

function buildAllVariations(result: EmailCopyOptimizerResult): string {
  const header = [`Email Copy Optimizer`, `Score: ${result.diagnosis.score}/100`, '']
  const blocks = result.variations.map((variation, index) =>
    [`Variation ${index + 1}: ${variation.name}`, buildVariationText(variation)].join('\n')
  )
  return [...header, ...blocks].join('\n\n')
}

export default function EmailCopyOptimizerPage() {
  // useResultParam (useSearchParams) requires a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <EmailCopyOptimizerPageInner />
    </Suspense>
  )
}

function EmailCopyOptimizerPageInner() {
  const [appState, setAppState] = useState<AppState>('input')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [goal, setGoal] = useState('')
  const [audience, setAudience] = useState('')
  const [tone, setTone] = useState<Tone>('Conversational')
  const [showContext, setShowContext] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<EmailCopyOptimizerResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [copiedVariation, setCopiedVariation] = useState<number | null>(null)

  const [subjectError, setSubjectError] = useState<string | null>(null)
  const [bodyError, setBodyError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [marketingConsent, setMarketingConsent] = useState(true)
  const [shakeKey, setShakeKey] = useState(0)

  const resultPanelRef = useRef<HTMLDivElement | null>(null)

  const {
    start: startLoader,
    stop: stopLoader,
    complete: completeLoader,
    reset: resetLoader,
    progressPct,
    loadingPct,
    activeStage,
    doneStages,
    stageLogs,
    waiting,
  } = useMiniAppLoader(STAGES, STAGE_MS)

  // Restore a saved result from ?result=<id> (email link / reload).
  const applyResult = useCallback((output: Record<string, unknown>) => {
    const r = output as EmailCopyOptimizerResult
    setResult(r)
    setAppState('result')
  }, [])
  const { restoring, hasResultParam, publish } = useResultParam(applyResult)

  const runReadout = useMemo(() => {
    if (appState === 'loading') return 'running'
    if (appState === 'result') return 'complete'
    if (appState === 'error') return 'failed'
    return 'idle'
  }, [appState])

  const clearErrors = useCallback(() => {
    setSubjectError(null)
    setBodyError(null)
    setEmailError(null)
  }, [])

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      const area = document.createElement('textarea')
      area.value = text
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.focus()
      area.select()
      const success = document.execCommand('copy')
      document.body.removeChild(area)
      return success
    }
  }, [])

  const handleTrySample = useCallback(() => {
    setSubject(SAMPLE_SUBJECT)
    setBody(SAMPLE_BODY)
    setGoal('Book 15-minute discovery calls with VP Sales prospects.')
    setAudience('US B2B SaaS leaders with 10-50 sales reps.')
    setTone('Conversational')
    setShowContext(true)
    clearErrors()
  }, [clearErrors])

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      if (submitting) return

      const trimmedSubject = subject.trim()
      const trimmedBody = body.trim()
      let valid = true

      clearErrors()
      if (!trimmedSubject || trimmedSubject.length > 200) {
        setSubjectError('Subject is required and must be 200 characters or fewer.')
        valid = false
      }
      if (trimmedBody.length < 50 || trimmedBody.length > 4000) {
        setBodyError('Body must be between 50 and 4000 characters.')
        valid = false
      }
      const emailClean = email.trim().toLowerCase()
      if (!emailClean) {
        setEmailError('Please enter your work email.')
        setShakeKey((k) => k + 1)
        valid = false
      } else if (!EMAIL_REGEX.test(emailClean)) {
        setEmailError('Please enter a valid email.')
        setShakeKey((k) => k + 1)
        valid = false
      }
      if (!valid) return

      setSubmitting(true)
      setResult(null)
      setErrorMessage('')
      setCopiedVariation(null)

      const leadInput = {
        subject: trimmedSubject,
        body: stripTemplateTokens(trimmedBody),
        context: {
          goal: goal.trim() || undefined,
          audience: audience.trim() || undefined,
          tone,
        },
      }

      // Show the loading state immediately on a valid submit so there is no dead
      // time while the lead-save round-trips. If the lead-save fails (e.g. a
      // disposable / free-provider email the server rejects), we revert to the
      // idle form below and surface the error.
      setAppState('loading')
      startLoader()

      let submissionId: string | null = null
      try {
        const res = await fetch('/api/leads/submit', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email: emailClean,
            miniAppSlug: 'email-copy-optimizer',
            input: leadInput,
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
          setAppState('input')
          setEmailError(json.error || "Couldn't save your info. Try again.")
          setShakeKey((k) => k + 1)
          setSubmitting(false)
          return
        }
        submissionId = json.submissionId
      } catch {
        resetLoader()
        setAppState('input')
        setEmailError("Couldn't save your info. Try again.")
        setShakeKey((k) => k + 1)
        setSubmitting(false)
        return
      }

      try {
        const response = await fetch('/api/mini-apps/email-copy-optimizer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: trimmedSubject,
            body: trimmedBody,
            context: leadInput.context,
          }),
        })

        const payload = (await response.json()) as ApiResponse
        if (!response.ok || !payload.ok) {
          stopLoader()
          setErrorMessage(
            payload.ok ? 'Unable to optimize right now. Please try again.' : payload.message
          )
          setAppState('error')
          setSubmitting(false)
          return
        }

        completeLoader()
        setResult(payload.data)
        setAppState('result')

        fetch('/api/leads/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            submissionId,
            output: payload.data,
            ...(payload.cost ? { cost: payload.cost } : {}),
          }),
        }).catch((err) => console.error('[email-copy-optimizer] leads/complete', err))
        // Make the URL shareable / reload-safe (?result=<id>).
        publish(submissionId)
      } catch {
        stopLoader()
        setErrorMessage('Network error. Please retry in a moment.')
        setAppState('error')
      } finally {
        setSubmitting(false)
      }
    },
    [
      audience,
      body,
      clearErrors,
      email,
      goal,
      marketingConsent,
      startLoader,
      stopLoader,
      completeLoader,
      resetLoader,
      subject,
      submitting,
      tone,
      publish,
    ]
  )

  const handleReset = useCallback(() => {
    resetLoader()
    setAppState('input')
    setSubmitting(false)
    setResult(null)
    setErrorMessage('')
    setCopiedVariation(null)
  }, [resetLoader])

  const handleCopyVariation = useCallback(
    async (index: number) => {
      if (!result) return
      const variation = result.variations[index]
      if (!variation) return
      const copied = await copyToClipboard(buildVariationText(variation))
      if (!copied) return
      setCopiedVariation(index)
      setTimeout(() => setCopiedVariation((prev) => (prev === index ? null : prev)), 1500)
    },
    [copyToClipboard, result]
  )

  return (
    <div className="eco-page mini-app-scope">
      <AuroraBackground />
      <Header />

      <main className="shell">
        <section className="hero">
          <span className="eyebrow">Email Copy Optimizer</span>
          <h1>
            Turn weak outbound drafts into <span className="accent">high-clarity emails</span>.
          </h1>
          <p>
            Paste your subject and body. Get a quick diagnosis plus three rewritten variations you
            can ship now.
          </p>
        </section>

        <div className="panel-wrap">
          <section className="panel">
            {appState !== 'input' && (
              <div className="panel-readouts">
                <span>
                  <span className="readout-key">sys</span>{' '}
                  <span className="readout-value">{runReadout}</span>
                </span>
                <span className="readout-sep" />
                <span>
                  <span className="readout-key">model</span>{' '}
                  <span className="readout-value">claude-sonnet-4-6</span>
                </span>
                {result && (
                  <>
                    <span className="readout-sep" />
                    <span>
                      <span className="readout-key">tokens</span>{' '}
                      <span className="readout-value">
                        {(result.tokens_in + result.tokens_out).toLocaleString()}
                      </span>
                    </span>
                  </>
                )}
              </div>
            )}

            <div className="panel-body">
              {(restoring || (appState === 'input' && hasResultParam)) && (
                <section className="view active">
                  <ResultRestoreNotice />
                </section>
              )}
              <section
                className={clsx('view', {
                  active: appState === 'input' && !restoring && !hasResultParam,
                })}
              >
                <form
                  key={shakeKey}
                  className="idle-form"
                  onSubmit={handleSubmit}
                  noValidate
                  autoComplete="off"
                >
                  <div className="idle-label">Your email draft</div>
                  <Input
                    id="eco-subject"
                    label="Subject"
                    required
                    type="text"
                    value={subject}
                    disabled={submitting}
                    placeholder="Quick way to unblock outbound this month"
                    error={subjectError}
                    onChange={(event) => {
                      setSubject(event.target.value)
                      if (subjectError) setSubjectError(null)
                    }}
                  />
                  <Textarea
                    id="eco-body"
                    label="Email body"
                    required
                    value={body}
                    disabled={submitting}
                    placeholder="Paste your draft email here..."
                    maxLength={4000}
                    count={body.length}
                    error={bodyError}
                    onChange={(event) => {
                      setBody(event.target.value)
                      if (bodyError) setBodyError(null)
                    }}
                  />

                  <button
                    type="button"
                    className="context-toggle"
                    onClick={() => setShowContext((open) => !open)}
                    aria-expanded={showContext}
                  >
                    {showContext ? 'Hide context' : 'Add context'}
                  </button>

                  {showContext && (
                    <div className="context-wrap">
                      <Input
                        id="eco-goal"
                        label="Goal (optional)"
                        type="text"
                        value={goal}
                        disabled={submitting}
                        placeholder="Book demos with VP Sales leaders"
                        onChange={(event) => setGoal(event.target.value)}
                      />
                      <Input
                        id="eco-audience"
                        label="Audience (optional)"
                        type="text"
                        value={audience}
                        disabled={submitting}
                        placeholder="Mid-market B2B SaaS"
                        onChange={(event) => setAudience(event.target.value)}
                      />

                      <span className="chip-label">Tone</span>
                      <div className="tone-chips">
                        {(['Formal', 'Conversational', 'Direct'] as const).map((option) => (
                          <button
                            key={option}
                            type="button"
                            className={clsx('tone-chip', { active: tone === option })}
                            onClick={() => setTone(option)}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

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
                    <button type="button" className="secondary-btn" onClick={handleTrySample}>
                      Try a sample
                    </button>
                    <button type="submit" className="submit-btn" disabled={submitting}>
                      Optimize copy
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

              <section className={clsx('view', { active: appState === 'loading' })}>
                <LoadingStages
                  stages={STAGES}
                  label={
                    <>
                      Optimizing <strong>your copy</strong>
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

              <section className={clsx('view', { active: appState === 'result' })}>
                {result && (
                  <>
                    <div ref={resultPanelRef}>
                      <div className="result-hero">
                        <p className="result-title">Diagnostic score</p>
                        <p className="result-score">{result.diagnosis.score}/100</p>
                        <div className="issues">
                          {result.diagnosis.issues.map((issue) => (
                            <article
                              key={`${issue.label}-${issue.severity}`}
                              className="issue-card"
                            >
                              <div className="issue-head">
                                <h3>{issue.label}</h3>
                                <span className={clsx('severity-chip', issue.severity)}>
                                  {issue.severity}
                                </span>
                              </div>
                              <p>{issue.note}</p>
                            </article>
                          ))}
                        </div>
                      </div>

                      <div className="variations-grid">
                        {result.variations.map((variation, index) => (
                          <article key={`${variation.name}-${index}`} className="variation-card">
                            <div className="variation-head">
                              <h3>{variation.name}</h3>
                              <button
                                type="button"
                                onClick={() => void handleCopyVariation(index)}
                                data-export-ignore="true"
                              >
                                {copiedVariation === index ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                            <p className="variation-subject">{variation.subject}</p>
                            <p className="variation-body">{variation.body}</p>
                            <div className="change-list">
                              {variation.changes.map((change, changeIndex) => (
                                <div
                                  key={`${change.change}-${changeIndex}`}
                                  className="change-item"
                                >
                                  <p className="change-text">{change.change}</p>
                                  <p className="change-reason">{change.reason}</p>
                                </div>
                              ))}
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>

                    <div className="result-actions">
                      <ExportControls
                        resultRef={resultPanelRef}
                        slug="email-copy-optimizer"
                        appName="Email Copy Optimizer"
                        filename={`email-copy-optimizer-${(
                          subject.trim() || result.variations[0].subject
                        )
                          .replace(/[^a-z0-9]/gi, '-')
                          .toLowerCase()}`}
                        subject={subject.trim() || result.variations[0].subject}
                        plainText={buildAllVariations(result)}
                      />
                      <button className="run-again" type="button" onClick={handleReset}>
                        Optimize another
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

              <section className={clsx('view', 'error-view', { active: appState === 'error' })}>
                <h2>Could not optimize this draft</h2>
                <p>{errorMessage}</p>
                <button type="button" onClick={handleReset}>
                  Try again
                </button>
              </section>
            </div>
          </section>
        </div>

        <HowItWorks
          title={
            <>
              From rough draft to <span className="accent">ready-to-send copy</span>
            </>
          }
          subtitle="One pass gives diagnosis, rewrites, and rationale."
          steps={HOW_IT_WORKS_STEPS}
        />
      </main>

      <Footer />
      <PageScripts />
    </div>
  )
}

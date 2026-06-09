'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'

import { clsx } from 'clsx'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { HowItWorks, type HowItWorksStep } from '@/components/mini-apps/HowItWorks'
import { EMAIL_REGEX } from '@/lib/leads/disposable'

import type {
  ApiResponse,
  EmailCopyOptimizerResult,
} from '@/app/api/mini-apps/email-copy-optimizer/route'
import './page-styles.css'
import { PageScripts } from './PageScripts'

type AppState = 'input' | 'loading' | 'result' | 'error'
type Tone = 'Formal' | 'Conversational' | 'Direct'

const LOADING_STAGES = ['Reading email', 'Diagnosing weak points', 'Writing variations']

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
  const [appState, setAppState] = useState<AppState>('input')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [goal, setGoal] = useState('')
  const [audience, setAudience] = useState('')
  const [tone, setTone] = useState<Tone>('Conversational')
  const [showContext, setShowContext] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [stageIndex, setStageIndex] = useState(0)
  const [result, setResult] = useState<EmailCopyOptimizerResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [copiedVariation, setCopiedVariation] = useState<number | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)

  const [subjectError, setSubjectError] = useState<string | null>(null)
  const [bodyError, setBodyError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [shakeKey, setShakeKey] = useState(0)

  useEffect(() => {
    if (appState !== 'loading') return
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev < LOADING_STAGES.length - 1 ? prev + 1 : prev))
    }, 1400)
    return () => clearInterval(interval)
  }, [appState])

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
      setStageIndex(0)
      setResult(null)
      setErrorMessage('')
      setCopiedVariation(null)
      setCopiedAll(false)

      const leadInput = {
        subject: trimmedSubject,
        body: stripTemplateTokens(trimmedBody),
        context: {
          goal: goal.trim() || undefined,
          audience: audience.trim() || undefined,
          tone,
        },
      }

      let submissionId: string | null = null
      try {
        const res = await fetch('/api/leads/submit', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email: emailClean,
            miniAppSlug: 'email-copy-optimizer',
            input: leadInput,
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

      setAppState('loading')

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
          setErrorMessage(
            payload.ok ? 'Unable to optimize right now. Please try again.' : payload.message
          )
          setAppState('error')
          setSubmitting(false)
          return
        }

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
      } catch {
        setErrorMessage('Network error. Please retry in a moment.')
        setAppState('error')
      } finally {
        setSubmitting(false)
      }
    },
    [audience, body, clearErrors, email, goal, subject, submitting, tone]
  )

  const handleReset = useCallback(() => {
    setAppState('input')
    setSubmitting(false)
    setStageIndex(0)
    setResult(null)
    setErrorMessage('')
    setCopiedVariation(null)
    setCopiedAll(false)
  }, [])

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

  const handleCopyAll = useCallback(async () => {
    if (!result) return
    const copied = await copyToClipboard(buildAllVariations(result))
    if (!copied) return
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 1500)
  }, [copyToClipboard, result])

  return (
    <div className="eco-page">
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
            <span className="corner tl" aria-hidden />
            <span className="corner tr" aria-hidden />
            <span className="corner bl" aria-hidden />
            <span className="corner br" aria-hidden />
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
              <section className={clsx('view', { active: appState === 'input' })}>
                <form
                  key={shakeKey}
                  className="pd-form"
                  onSubmit={handleSubmit}
                  noValidate
                  autoComplete="off"
                >
                  <div className="idle-label">
                    Subject <span className="required-mark">*</span>
                  </div>
                  <div className={clsx('pd-input-box', { error: subjectError })}>
                    <input
                      id="eco-subject"
                      type="text"
                      value={subject}
                      disabled={submitting}
                      placeholder="Quick way to unblock outbound this month"
                      onChange={(event) => {
                        setSubject(event.target.value)
                        if (subjectError) setSubjectError(null)
                      }}
                    />
                  </div>
                  <div className={clsx('pd-helper', { error: subjectError })}>
                    {subjectError ?? 'Required · 200 characters max'}
                  </div>

                  <div className="idle-label">
                    Email body <span className="required-mark">*</span>
                  </div>
                  <div className={clsx('pd-input-box', { error: bodyError })}>
                    <textarea
                      id="eco-body"
                      value={body}
                      disabled={submitting}
                      placeholder="Paste your draft email here..."
                      onChange={(event) => {
                        setBody(event.target.value)
                        if (bodyError) setBodyError(null)
                      }}
                    />
                  </div>
                  <div className={clsx('pd-helper', { error: bodyError })}>
                    {bodyError ?? `${body.length} / 4000 chars (min 50)`}
                  </div>

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
                      <div className="idle-label">Goal (optional)</div>
                      <div className="pd-input-box">
                        <input
                          id="eco-goal"
                          type="text"
                          value={goal}
                          disabled={submitting}
                          placeholder="Book demos with VP Sales leaders"
                          onChange={(event) => setGoal(event.target.value)}
                        />
                      </div>

                      <div className="idle-label">Audience (optional)</div>
                      <div className="pd-input-box">
                        <input
                          id="eco-audience"
                          type="text"
                          value={audience}
                          disabled={submitting}
                          placeholder="Mid-market B2B SaaS"
                          onChange={(event) => setAudience(event.target.value)}
                        />
                      </div>

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
                      onChange={(event) => {
                        setEmail(event.target.value)
                        if (emailError) setEmailError(null)
                      }}
                    />
                  </div>
                  <div className={clsx('pd-helper', { error: emailError })}>
                    {emailError ?? 'We send the report to your work email. No spam.'}
                  </div>

                  <div className="pd-submit-row">
                    <button type="button" className="secondary-btn" onClick={handleTrySample}>
                      Try a sample
                    </button>
                    <button type="submit" className="pd-submit-btn" disabled={submitting}>
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
                <div className="loading-stage">
                  <span className="loading-label">Working...</span>
                  <ul>
                    {LOADING_STAGES.map((stage, index) => (
                      <li
                        key={stage}
                        className={clsx({ active: index === stageIndex, done: index < stageIndex })}
                      >
                        {stage}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section className={clsx('view', { active: appState === 'result' })}>
                {result && (
                  <>
                    <div className="result-hero">
                      <p className="result-title">Diagnostic score</p>
                      <p className="result-score">{result.diagnosis.score}/100</p>
                      <div className="issues">
                        {result.diagnosis.issues.map((issue) => (
                          <article key={`${issue.label}-${issue.severity}`} className="issue-card">
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
                            <button type="button" onClick={() => void handleCopyVariation(index)}>
                              {copiedVariation === index ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <p className="variation-subject">{variation.subject}</p>
                          <p className="variation-body">{variation.body}</p>
                          <div className="change-list">
                            {variation.changes.map((change, changeIndex) => (
                              <div key={`${change.change}-${changeIndex}`} className="change-item">
                                <p className="change-text">{change.change}</p>
                                <p className="change-reason">{change.reason}</p>
                              </div>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>

                    <div className="result-footer">
                      <button type="button" onClick={handleReset}>
                        Optimize another
                      </button>
                      <button type="button" onClick={() => void handleCopyAll()}>
                        {copiedAll ? 'Copied all' : 'Copy all'}
                      </button>
                      <a href="https://www.system7.ai/contact" target="_blank" rel="noreferrer">
                        Book a call
                      </a>
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

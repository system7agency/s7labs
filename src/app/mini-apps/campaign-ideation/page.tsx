'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
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
import { LoadingStages } from '@/components/mini-apps/LoadingStages'
import { EMAIL_REGEX } from '@/lib/leads/disposable'
import type {
  ApiResponse,
  CampaignIdea,
  CampaignIdeationResult,
} from '@/app/api/mini-apps/campaign-ideation/route'
import { PageScripts } from './PageScripts'

type AppState = 'idle' | 'loading' | 'result' | 'error'
type MotionChip = 'Outbound' | 'Inbound' | 'Content' | 'Paid' | 'None yet'

const MOTION_CHIPS: MotionChip[] = ['Outbound', 'Inbound', 'Content', 'Paid', 'None yet']

const HIW_STEPS: HowItWorksStep[] = [
  {
    title: 'Describe your offer and audience',
    description: 'Add what you sell, who it is for, and optional motion + goals.',
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
        <path d="M7 8h10M7 12h10M7 16h6" />
      </svg>
    ),
  },
  {
    title: 'We map your positioning',
    description: 'The app identifies the sharpest message angle for this exact context.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 12l9-9 9 9-9 9-9-9z" />
        <path d="M12 7v10M8 12h8" />
      </svg>
    ),
  },
  {
    title: 'Get 7 campaign concepts',
    description: 'Each idea includes channels, format, first step, effort, and expected outcome.',
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
        <path d="M12 7v5l3 3" />
      </svg>
    ),
  },
  {
    title: 'Ship the strongest one today',
    description: 'Copy one card or the full plan, print it, and brief your team immediately.',
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
        <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
      </svg>
    ),
  },
]

const STAGES = [
  {
    num: '01',
    title: 'Framing campaign brief',
    logs: ['reading product + audience', 'finding the angle', 'brief framed'],
  },
  {
    num: '02',
    title: 'Matching channels to audience',
    logs: ['mapping channels', 'weighing fit', 'channels matched'],
  },
  {
    num: '03',
    title: 'Drafting ideas and hooks',
    logs: ['generating concepts', 'writing hooks', 'ideas drafted'],
  },
  {
    num: '04',
    title: 'Finalizing execution steps',
    logs: ['adding first steps', 'setting outcomes', 'plan ready'],
  },
]
const STAGE_MS = 1700

const SAMPLE_INPUT = {
  product:
    'We help SaaS teams automatically enrich and route inbound leads with intent scoring and CRM sync.',
  audience:
    'VP Sales and RevOps leaders at B2B SaaS companies (50-500 employees) struggling with slow lead follow-up and poor MQL quality.',
  currentMotion: 'Outbound + inbound mix with light content',
  goal: 'Book 20 qualified demos in the next 45 days without increasing SDR headcount.',
}

function formatReportTs(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `REPORT · ${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} · ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
}

function ideaToText(idea: CampaignIdea, index: number) {
  return [
    `${index + 1}. ${idea.name}`,
    `Hook: ${idea.hook}`,
    `Channels: ${idea.channels.join(', ')}`,
    `Format: ${idea.format}`,
    `First step: ${idea.firstStep}`,
    `Expected outcome: ${idea.expectedOutcome}`,
    `Effort: ${idea.effort.toUpperCase()}`,
  ].join('\n')
}

function buildPlainText(result: CampaignIdeationResult) {
  return [
    'Campaign Ideation Plan',
    '='.repeat(60),
    '',
    '// POSITIONING',
    result.summary.positioning,
    '',
    '// IDEAS',
    ...result.ideas.map((idea, index) => ideaToText(idea, index)),
    '',
    `Tokens: ${(result.tokens_in + result.tokens_out).toLocaleString()} (${result.tokens_in.toLocaleString()} in / ${result.tokens_out.toLocaleString()} out)`,
    'Generated by S7 Labs Campaign Ideation',
  ].join('\n\n')
}

function Field({
  label,
  required,
  value,
  placeholder,
  onChange,
  disabled,
  error,
  rows = 4,
}: {
  label: string
  required?: boolean
  value: string
  placeholder: string
  onChange: (next: string) => void
  disabled: boolean
  minChars?: number
  error?: string | null
  helper?: string
  rows?: number
}) {
  // Canonical glassy MONO textarea + char counter come from the shared
  // <Textarea> component (minChars/helper kept in the prop API but the counter
  // now renders "n chars"; the min is still enforced in validation).
  return (
    <Textarea
      label={label}
      required={required}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      error={error}
      count={value.length}
      rows={rows}
    />
  )
}

function IdeaCard({ idea, index }: { idea: CampaignIdea; index: number }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    const text = ideaToText(idea, index)
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
    setTimeout(() => setCopied(false), 1600)
  }, [idea, index])

  return (
    <article className="ci-idea-card">
      <div className="ci-idea-head">
        <span className="ci-idea-num">{String(index + 1).padStart(2, '0')}</span>
        <span className={clsx('ci-effort', idea.effort)}>{idea.effort}</span>
      </div>
      <h3>{idea.name}</h3>
      <p>{idea.hook}</p>
      <div className="ci-row">
        <span className="ci-key">Channels</span>
        <span className="ci-val">{idea.channels.join(' · ')}</span>
      </div>
      <div className="ci-row">
        <span className="ci-key">Format</span>
        <span className="ci-val">{idea.format}</span>
      </div>
      <div className="ci-row">
        <span className="ci-key">First step</span>
        <span className="ci-val">{idea.firstStep}</span>
      </div>
      <div className="ci-row">
        <span className="ci-key">Expected outcome</span>
        <span className="ci-val">{idea.expectedOutcome}</span>
      </div>
      <button className="ci-copy-btn" type="button" onClick={handleCopy} data-export-ignore="true">
        {copied ? 'Copied' : 'Copy card'}
      </button>
    </article>
  )
}

export default function CampaignIdeationPage() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [product, setProduct] = useState('')
  const [audience, setAudience] = useState('')
  const [currentMotion, setCurrentMotion] = useState('')
  const [goal, setGoal] = useState('')
  const [selectedMotion, setSelectedMotion] = useState<MotionChip | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<CampaignIdeationResult | null>(null)
  const [resultTs, setResultTs] = useState('')
  const [clock, setClock] = useState('—')
  const [prodError, setProdError] = useState<string | null>(null)
  const [audError, setAudError] = useState<string | null>(null)
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

  useEffect(() => {
    const tick = () => {
      const d = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      setClock(`${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}Z`)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  const handleTrySample = useCallback(() => {
    setProduct(SAMPLE_INPUT.product)
    setAudience(SAMPLE_INPUT.audience)
    setCurrentMotion(SAMPLE_INPUT.currentMotion)
    setGoal(SAMPLE_INPUT.goal)
    setSelectedMotion(null)
    setProdError(null)
    setAudError(null)
    setEmailError(null)
  }, [])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (submitting) return

      const p = product.trim()
      const a = audience.trim()
      const motion = currentMotion.trim()
      const goalTrimmed = goal.trim()

      let valid = true
      if (p.length < 20 || p.length > 1500) {
        setProdError('Product must be 20-1500 chars.')
        valid = false
      } else {
        setProdError(null)
      }
      if (a.length < 20 || a.length > 1500) {
        setAudError('Audience must be 20-1500 chars.')
        valid = false
      } else {
        setAudError(null)
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

      setEmailError(null)
      setSubmitting(true)
      setErrorMsg('')
      setResult(null)

      const leadInput = {
        product: p,
        audience: a,
        ...(motion ? { currentMotion: motion } : {}),
        ...(goalTrimmed ? { goal: goalTrimmed } : {}),
      }

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
            miniAppSlug: 'campaign-ideation',
            input: leadInput,
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
          setShakeKey((k) => k + 1)
          setSubmitting(false)
          return
        }
        submissionId = leadJson.submissionId
      } catch {
        resetLoader()
        setAppState('idle')
        setEmailError("Couldn't save your info. Try again.")
        setShakeKey((k) => k + 1)
        setSubmitting(false)
        return
      }

      let data: ApiResponse
      try {
        const res = await fetch('/api/mini-apps/campaign-ideation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product: p,
            audience: a,
            currentMotion: motion || undefined,
            goal: goalTrimmed || undefined,
          }),
        })
        data = (await res.json()) as ApiResponse
      } catch {
        stopLoader()
        setErrorMsg('Network error. Please check your connection and try again.')
        setAppState('error')
        setSubmitting(false)
        return
      }

      if (data.ok) {
        completeLoader()
        setResult(data.data)
        setResultTs(formatReportTs(new Date()))
        setAppState('result')

        fetch('/api/leads/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            submissionId,
            output: data.data,
            ...('cost' in data && data.cost ? { cost: data.cost } : {}),
          }),
        }).catch((err) => console.error('[campaign-ideation] leads/complete', err))
      } else {
        stopLoader()
        setErrorMsg(data.message)
        setAppState('error')
      }
      setSubmitting(false)
    },
    [
      audience,
      completeLoader,
      currentMotion,
      email,
      goal,
      marketingConsent,
      product,
      resetLoader,
      startLoader,
      stopLoader,
      submitting,
    ]
  )

  const handleReset = useCallback(() => {
    resetLoader()
    setAppState('idle')
    setSubmitting(false)
    setErrorMsg('')
    setResult(null)
    setEmailError(null)
  }, [resetLoader])

  return (
    <div className="campaign-ideation mini-app-scope">
      <AuroraBackground />
      <Header />

      <main className="shell">
        <section className="hero">
          <span className="eyebrow">Campaign Ideation</span>
          <h1>
            Turn product context into <span className="accent">7 campaign concepts</span>.
          </h1>
          <p>
            Share your offer, audience, and goal. We return ready-to-execute ideas across channels
            with clear first steps.
          </p>
        </section>

        <div className="panel-wrap">
          <section className="panel">
            {appState !== 'idle' && (
              <div className="panel-topline">
                <span>campaign ideation engine</span>
                <span>{clock}</span>
              </div>
            )}

            {appState === 'idle' && (
              <form
                key={shakeKey}
                className="idle-form"
                onSubmit={handleSubmit}
                noValidate
                autoComplete="off"
              >
                <div className="idle-label">Tell us about your campaign</div>
                <Field
                  label="Product / Offer"
                  required
                  value={product}
                  placeholder="What you sell, for whom, and why it matters."
                  onChange={setProduct}
                  disabled={submitting}
                  minChars={20}
                  error={prodError}
                  rows={4}
                />
                <Field
                  label="Audience"
                  required
                  value={audience}
                  placeholder="ICP, role, company stage, and pain points."
                  onChange={setAudience}
                  disabled={submitting}
                  minChars={20}
                  error={audError}
                  rows={4}
                />
                <Field
                  label="Current Motion (optional)"
                  value={currentMotion}
                  placeholder="How you currently go to market."
                  onChange={setCurrentMotion}
                  disabled={submitting}
                  rows={3}
                />
                <div className="ci-chip-row">
                  {MOTION_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      className={clsx('ci-chip', { active: selectedMotion === chip })}
                      onClick={() => {
                        setSelectedMotion(chip)
                        setCurrentMotion(chip)
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <Field
                  label="Primary Goal (optional)"
                  value={goal}
                  placeholder="What outcome matters most in this cycle."
                  onChange={setGoal}
                  disabled={submitting}
                  rows={3}
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
                  shakeKey={shakeKey}
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
                  <button className="ci-ghost" type="button" onClick={handleTrySample}>
                    Try a sample
                  </button>
                  <button className="submit-btn" type="submit" disabled={submitting}>
                    Generate ideas
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
            )}

            {appState === 'loading' && (
              <section className="ci-loading">
                <LoadingStages
                  stages={STAGES}
                  label={
                    <>
                      Generating <strong>campaign ideas</strong>
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
            )}

            {appState === 'result' && result && (
              <section className="ci-result-wrap">
                <div ref={resultPanelRef}>
                  <div className="ci-report-head">
                    <span className="ci-report-title">Campaign ideas ready</span>
                    <span className="ci-report-ts">{resultTs}</span>
                  </div>

                  <article className="ci-positioning">
                    <span>{'// Positioning summary'}</span>
                    <p>{result.summary.positioning}</p>
                  </article>

                  <div className="ci-grid">
                    {result.ideas.map((idea, index) => (
                      <IdeaCard key={index} idea={idea} index={index} />
                    ))}
                  </div>
                </div>

                <div className="result-actions">
                  <ExportControls
                    resultRef={resultPanelRef}
                    slug="campaign-ideation"
                    appName="Campaign Ideation"
                    filename="campaign-ideas"
                    plainText={buildPlainText(result)}
                  />
                  <button className="run-again" type="button" onClick={handleReset}>
                    Generate again
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
              </section>
            )}

            {appState === 'error' && (
              <section className="ci-error">
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
                <h2 className="err-title">Couldn&apos;t generate ideas</h2>
                <p className="err-msg">{errorMsg}</p>
                <button className="err-btn" type="button" onClick={handleReset}>
                  Try again
                </button>
              </section>
            )}
          </section>
        </div>

        <HowItWorks
          title={
            <>
              From context to campaigns in <span className="accent">minutes</span>
            </>
          }
          subtitle="Four quick steps from inputs to campaign plan."
          steps={HIW_STEPS}
        />
      </main>

      <Footer />
      <PageScripts />
    </div>
  )
}

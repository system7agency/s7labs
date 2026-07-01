'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'

import { clsx } from 'clsx'
import './page-styles.css'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { HowItWorks, type HowItWorksStep } from '@/components/mini-apps/HowItWorks'
import { InlineConsentField } from '@/components/mini-apps/InlineConsentField'
import { ExportControls } from '@/components/mini-apps/ui/ExportControls'
import { Input } from '@/components/mini-apps/ui/Input'
import { useMiniAppLoader } from '@/components/mini-apps/useMiniAppLoader'
import { LoadingStages } from '@/components/mini-apps/LoadingStages'
import { useResultParam } from '@/components/mini-apps/useResultParam'
import { ResultRestoreNotice } from '@/components/mini-apps/ResultRestoreNotice'
import { EMAIL_REGEX } from '@/lib/leads/disposable'
import type {
  TechStackFinderApiResponse,
  TechStackFinderResult,
  TechnologyCategory,
} from '@/lib/mini-apps/tech-stack-types'
import { PageScripts } from './PageScripts'

type AppState = 'idle' | 'loading' | 'result' | 'error'

const STAGES = [
  {
    num: '01',
    title: 'Validating domain',
    logs: ['host normalized', 'dns format checks', 'query prepared'],
  },
  {
    num: '02',
    title: 'Scanning technology footprint',
    logs: ['scripts and headers parsed', 'vendor fingerprints matched', 'taxonomy mapping'],
  },
  {
    num: '03',
    title: 'Normalizing categories',
    logs: ['canonical buckets enforced', 'duplicates merged', 'confidence reconciled'],
  },
  {
    num: '04',
    title: 'Assembling report',
    logs: ['category totals computed', 'tiles rendered', 'report ready'],
  },
]

const STAGE_MS = 4200

const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    title: 'Enter any company domain',
    description: 'Use a root domain like `acme.com` and launch a single scan.',
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
    title: 'We detect technologies by category',
    description:
      'Signals are grouped into analytics, CMS, framework, hosting, CRM, and other normalized stacks.',
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
    title: 'Logos load with smart fallback',
    description: 'Known slugs render from CDN, and unknown ones gracefully fall back to monograms.',
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
    title: 'Get a shareable stack snapshot',
    description: 'You receive category cards, technology count, and a clean exportable summary.',
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

function trimDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
}

function formatResultTs(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'REPORT READY'
  const p = (n: number) => String(n).padStart(2, '0')
  return `REPORT · ${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} · ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`
}

function buildPlainText(result: TechStackFinderResult): string {
  const lines: string[] = [
    `Tech Stack Finder — ${result.domain}`,
    '='.repeat(60),
    '',
    `Categories: ${result.categories.length}`,
    `Technologies detected: ${result.totalTechnologies}`,
    `Provider: ${result.provider}${result.cached ? ' (cached)' : ''}`,
    '',
    '// CATEGORY BREAKDOWN',
  ]

  for (const category of result.categories) {
    lines.push(`- ${category.name} (${category.technologies.length})`)
    for (const tech of category.technologies) {
      const confidence =
        typeof tech.confidence === 'number' ? ` · ${(tech.confidence * 100).toFixed(0)}%` : ''
      lines.push(`  • ${tech.name}${confidence}`)
    }
  }

  return lines.join('\n')
}

function monogram(label: string): string {
  const cleaned = label.replace(/[^a-z0-9 ]/gi, '').trim()
  if (!cleaned) return '??'
  const parts = cleaned.split(/\s+/).filter(Boolean)
  const first = parts[0] ?? ''
  const second = parts[1] ?? ''
  if (!second) return first.slice(0, 2).toUpperCase()
  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase()
}

function TechLogoTile({
  name,
  slug,
  confidence,
}: {
  name: string
  slug: string
  confidence?: number
}) {
  const [broken, setBroken] = useState(false)
  const iconUrl = `https://cdn.simpleicons.org/${slug}`

  return (
    <div className="tsf-tech-tile">
      <div className="tsf-logo-box">
        {broken ? (
          <span className="tsf-logo-fallback">{monogram(name)}</span>
        ) : (
          <img
            src={iconUrl}
            alt={`${name} logo`}
            loading="lazy"
            onError={() => setBroken(true)}
            referrerPolicy="no-referrer"
          />
        )}
      </div>
      <div className="tsf-tech-meta">
        <span className="tsf-tech-name">{name}</span>
        {typeof confidence === 'number' ? (
          <span className="tsf-tech-confidence">{Math.round(confidence * 100)}%</span>
        ) : null}
      </div>
    </div>
  )
}

function CategoryCard({ category }: { category: TechnologyCategory }) {
  // Plain div/span (not article/header/h3): the html-to-image PNG/PDF export
  // mis-positions semantic flow elements inside a <foreignObject>, which piled
  // every category header at the top-left of the capture. Divs export cleanly.
  return (
    <div className="tsf-category-card">
      <div className="tsf-category-head">
        <span className="tsf-category-name">{category.name}</span>
        <span className="tsf-category-count">{category.technologies.length}</span>
      </div>
      <div className="tsf-tech-grid">
        {category.technologies.map((tech) => (
          <TechLogoTile
            key={`${category.name}-${tech.slug}`}
            name={tech.name}
            slug={tech.slug}
            confidence={tech.confidence}
          />
        ))}
      </div>
    </div>
  )
}

export default function TechStackFinderPage() {
  // useResultParam (useSearchParams) requires a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <TechStackFinderPageInner />
    </Suspense>
  )
}

function TechStackFinderPageInner() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [domain, setDomain] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  const [shakeKey, setShakeKey] = useState(0)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [marketingConsent, setMarketingConsent] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<TechStackFinderResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [resultTs, setResultTs] = useState('')

  const [sysState, setSysState] = useState<'idle' | 'running' | 'complete' | 'error'>('idle')
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

  // Restore a saved result from ?result=<id> (email link / reload).
  const applyResult = useCallback((output: Record<string, unknown>) => {
    const r = output as TechStackFinderResult
    setResult(r)
    setSysState('complete')
    setAppState('result')
  }, [])
  const { restoring, hasResultParam, publish } = useResultParam(applyResult)

  const domainInputRef = useRef<HTMLInputElement | null>(null)
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
    if (appState !== 'idle') return
    const t = setTimeout(() => domainInputRef.current?.focus(), 200)
    return () => clearTimeout(t)
  }, [appState])

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      if (submitting) return

      let valid = true
      const normalized = trimDomain(domain)
      if (!normalized || !/^(?:[a-z0-9-]+\.)+[a-z]{2,63}$/i.test(normalized)) {
        setInputError('Enter a valid domain like acme.com')
        valid = false
      } else {
        setInputError(null)
      }
      const emailClean = email.trim().toLowerCase()
      if (!emailClean) {
        setEmailError('Please enter your work email.')
        valid = false
      } else if (!EMAIL_REGEX.test(emailClean)) {
        setEmailError('Please enter a valid email.')
        valid = false
      } else {
        setEmailError(null)
      }
      if (!valid) {
        setShakeKey((k) => k + 1)
        return
      }

      setSubmitting(true)
      setResult(null)
      setErrorMsg('')

      // Show the loading state immediately on a valid submit so there is no dead
      // time while the lead-save round-trips. If the lead-save fails (e.g. a
      // disposable / free-provider email the server rejects), revert to the idle
      // form below and surface the error. (Reference: website-roast handleSubmit.)
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
            miniAppSlug: 'tech-stack-finder',
            input: { domain: normalized },
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
          setSysState('idle')
          setAppState('idle')
          setEmailError(json.error || "Couldn't save your info. Try again.")
          setShakeKey((k) => k + 1)
          setSubmitting(false)
          return
        }
        submissionId = json.submissionId
      } catch {
        resetLoader()
        setSysState('idle')
        setAppState('idle')
        setEmailError("Couldn't save your info. Try again.")
        setShakeKey((k) => k + 1)
        setSubmitting(false)
        return
      }

      let data: TechStackFinderApiResponse
      try {
        const res = await fetch('/api/mini-apps/tech-stack-finder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: normalized }),
        })
        data = (await res.json()) as TechStackFinderApiResponse
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
        await new Promise((r) => setTimeout(r, 220))
        setResult(data.data)
        setResultTs(formatResultTs(data.data.analyzedAt))
        setSysState('complete')
        setAppState('result')

        fetch('/api/leads/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            submissionId,
            output: data.data,
          }),
        }).catch((err) => console.error('[tech-stack-finder] leads/complete', err))
        // Make the URL shareable / reload-safe (?result=<id>).
        publish(submissionId)
      } else {
        stopLoader()
        setErrorMsg(data.message)
        setSysState('error')
        setAppState('error')
      }

      setSubmitting(false)
    },
    [
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
    setInputError(null)
    setEmailError(null)
    setSubmitting(false)
    setSysState('idle')
  }, [resetLoader])

  const loadingHost = trimDomain(domain) || 'target-domain'

  const categorySummary = useMemo(() => {
    if (!result) return ''
    return `${result.categories.length} categories · ${result.totalTechnologies} technologies`
  }, [result])

  return (
    <div className="tech-stack-finder mini-app-scope">
      <AuroraBackground />
      <Header />

      <main className="tsf-shell">
        <section className="tsf-hero">
          <span className="tsf-eyebrow">Tech Stack Finder</span>
          <h1>
            Reveal what powers any site, <span className="accent">instantly.</span>
          </h1>
          <p>
            Drop in a domain and get a normalized, category-based technology snapshot with logo
            tiles and confidence hints.
          </p>
        </section>

        <div className="tsf-panel-wrap">
          <div className="tsf-panel">
            {appState !== 'idle' ? (
              <div className="tsf-readouts">
                <span>
                  <span className="k">sys</span> <span className="v">{sysState}</span>
                </span>
                <span className="sep" />
                <span className="hide-sm">
                  <span className="k">lat</span> <span className="v">{latency}</span>
                </span>
                <span className="sep hide-sm" />
                <span>
                  <span className="k">ts</span> <span className="v">{clock}</span>
                </span>
              </div>
            ) : null}

            <div className="tsf-panel-body">
              {(restoring || (appState === 'idle' && hasResultParam)) && (
                <section className="tsf-state active">
                  <ResultRestoreNotice />
                </section>
              )}
              <section
                className={clsx('tsf-state', {
                  active: appState === 'idle' && !restoring && !hasResultParam,
                })}
              >
                <div className="idle-label">Enter a company domain</div>
                <form className="idle-form" noValidate onSubmit={handleSubmit} autoComplete="off">
                  <Input
                    label="Target domain"
                    required
                    error={inputError}
                    shakeKey={shakeKey}
                    ref={domainInputRef}
                    type="text"
                    value={domain}
                    placeholder="acme.com"
                    spellCheck={false}
                    disabled={submitting}
                    onChange={(event) => {
                      setDomain(event.target.value)
                      if (inputError) setInputError(null)
                    }}
                  />
                  <Input
                    label="Work email"
                    required
                    error={emailError}
                    shakeKey={shakeKey}
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
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-4.3-4.3" />
                      </svg>
                      Analyze Stack
                    </button>
                  </div>
                </form>
              </section>

              <section className={clsx('tsf-state', { active: appState === 'loading' })}>
                <LoadingStages
                  stages={STAGES}
                  label={
                    <>
                      Analyzing <strong>{loadingHost}</strong>
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

              <section className={clsx('tsf-state', { active: appState === 'result' })}>
                {result ? (
                  <>
                    <div ref={resultPanelRef}>
                      <div className="tsf-result-head">
                        <div>
                          <h2>{result.domain}</h2>
                          <p>{categorySummary}</p>
                        </div>
                        <span className="tsf-result-ts">{resultTs}</span>
                      </div>

                      <div className="tsf-category-grid">
                        {result.categories.map((category) => (
                          <CategoryCard key={category.name} category={category} />
                        ))}
                      </div>

                      <div className="tsf-provider-line">
                        provider: {result.provider}
                        {result.cached ? ' · cached 24h' : ''}
                      </div>
                    </div>

                    <div className="result-actions">
                      <ExportControls
                        resultRef={resultPanelRef}
                        slug="tech-stack-finder"
                        appName="Tech Stack Finder"
                        filename={`tech-stack-finder-${result.domain.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`}
                        subject={result.domain}
                        plainText={buildPlainText(result)}
                      />
                      <button type="button" className="run-again" onClick={handleReset}>
                        Analyze another
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
                ) : null}
              </section>

              <section
                className={clsx('tsf-state', 'tsf-error-state', { active: appState === 'error' })}
              >
                <h2>Analysis failed</h2>
                <p>{errorMsg}</p>
                <button type="button" onClick={handleReset}>
                  Try again
                </button>
              </section>
            </div>
          </div>
        </div>

        <HowItWorks
          title={
            <>
              From domain to <span className="accent">full technology map</span>
            </>
          }
          subtitle="One input, normalized categories, and a clean readout your team can act on."
          steps={HOW_IT_WORKS_STEPS}
        />
      </main>

      <Footer />
      <PageScripts />
    </div>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'

import { clsx } from 'clsx'
import './page-styles.css'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { HowItWorks, type HowItWorksStep } from '@/components/mini-apps/HowItWorks'
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
] as const

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
  return (
    <article className="tsf-category-card">
      <header className="tsf-category-head">
        <h3>{category.name}</h3>
        <span>{category.technologies.length}</span>
      </header>
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
    </article>
  )
}

export default function TechStackFinderPage() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [domain, setDomain] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  const [shakeKey, setShakeKey] = useState(0)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [shakeEmail, setShakeEmail] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<TechStackFinderResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [resultTs, setResultTs] = useState('')
  const [copyState, setCopyState] = useState<'idle' | 'done'>('idle')

  const [activeStage, setActiveStage] = useState(-1)
  const [doneStages, setDoneStages] = useState<number[]>([])
  const [stageLogs, setStageLogs] = useState<string[]>(['', '', '', ''])
  const [progressPct, setProgressPct] = useState(0)
  const [loadingPct, setLoadingPct] = useState('0%')
  const [latency, setLatency] = useState('—')
  const [sysState, setSysState] = useState<'idle' | 'running' | 'complete' | 'error'>('idle')
  const [clock, setClock] = useState('—')

  const domainInputRef = useRef<HTMLInputElement | null>(null)
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
    if (appState !== 'idle') return
    const t = setTimeout(() => domainInputRef.current?.focus(), 200)
    return () => clearTimeout(t)
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

  const startLoadingAnimation = useCallback(() => {
    clearTimers()
    setActiveStage(0)
    setDoneStages([])
    setStageLogs(['', '', '', ''])
    setProgressPct(0)
    setLoadingPct('0%')
    setLatency('0.0s')
    const startTime = performance.now()
    runStartRef.current = startTime
    const totalMs = STAGE_MS * STAGES.length

    const tick = (now: number) => {
      const pct = Math.min(97, ((now - startTime) / totalMs) * 100)
      setProgressPct(pct)
      setLoadingPct(`${Math.floor(pct)}%`)
      setLatency(`${((now - startTime) / 1000).toFixed(1)}s`)
      if (pct < 97) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    STAGES.forEach((stage, i) => {
      timersRef.current.push(
        setTimeout(() => {
          setActiveStage(i)
          setStageLogs((prev) => {
            const next = [...prev]
            next[i] = stage.logs[0] ?? ''
            return next
          })
          stage.logs.forEach((log, li) => {
            if (li === 0) return
            timersRef.current.push(
              setTimeout(
                () => {
                  setStageLogs((prev) => {
                    const next = [...prev]
                    next[i] = log
                    return next
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
              const next = [...prev]
              next[i] = stage.logs[stage.logs.length - 1] ?? ''
              return next
            })
          },
          (i + 1) * STAGE_MS
        )
      )
    })
  }, [clearTimers])

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      if (submitting) return

      let valid = true
      const normalized = trimDomain(domain)
      if (!normalized || !/^(?:[a-z0-9-]+\.)+[a-z]{2,63}$/i.test(normalized)) {
        setInputError('Enter a valid domain like acme.com')
        setShakeKey((k) => k + 1)
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
            miniAppSlug: 'tech-stack-finder',
            input: { domain: normalized },
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
      startLoadingAnimation()

      let data: TechStackFinderApiResponse
      try {
        const res = await fetch('/api/mini-apps/tech-stack-finder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: normalized }),
        })
        data = (await res.json()) as TechStackFinderApiResponse
      } catch {
        clearTimers()
        setErrorMsg('Network error. Please check your connection and try again.')
        setSysState('error')
        setAppState('error')
        setSubmitting(false)
        return
      }

      clearTimers()
      setLatency(`${((performance.now() - runStartRef.current) / 1000).toFixed(1)}s`)
      setProgressPct(100)
      setLoadingPct('100%')

      if (data.ok) {
        setDoneStages([0, 1, 2, 3])
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
      } else {
        setErrorMsg(data.message)
        setSysState('error')
        setAppState('error')
      }

      setSubmitting(false)
    },
    [clearTimers, domain, email, startLoadingAnimation, submitting]
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
    setCopyState('idle')
  }, [clearTimers])

  const handleCopy = useCallback(async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(buildPlainText(result))
      setCopyState('done')
      setTimeout(() => setCopyState('idle'), 1400)
    } catch {
      setCopyState('idle')
    }
  }, [result])

  const loadingHost = trimDomain(domain) || 'target-domain'

  const categorySummary = useMemo(() => {
    if (!result) return ''
    return `${result.categories.length} categories · ${result.totalTechnologies} technologies`
  }, [result])

  return (
    <div className="tech-stack-finder">
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
              <section className={clsx('tsf-state', { active: appState === 'idle' })}>
                <div className="tsf-input-label">Target domain</div>
                <form key={shakeKey} onSubmit={handleSubmit} noValidate>
                  <div className="tsf-domain-form">
                    <input
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
                    <button type="submit" disabled={submitting}>
                      Analyze
                    </button>
                  </div>
                  <p className={clsx('tsf-helper', { error: Boolean(inputError) })}>
                    {inputError ?? 'Examples: stripe.com · shopify.com · linear.app'}
                  </p>
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
                        onChange={(event) => {
                          setEmail(event.target.value)
                          if (emailError) setEmailError(null)
                        }}
                      />
                    </div>
                    {emailError ? <div className="field-error">{emailError}</div> : null}
                  </div>
                </form>
              </section>

              <section className={clsx('tsf-state', { active: appState === 'loading' })}>
                <div className="tsf-progress-track">
                  <div className="tsf-progress-bar" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="tsf-loading-head">
                  <span>
                    Analyzing <strong>{loadingHost}</strong>
                  </span>
                  <span>{loadingPct}</span>
                </div>
                <div className="tsf-stages">
                  {STAGES.map((stage, idx) => {
                    const isActive = idx === activeStage && !doneStages.includes(idx)
                    const isDone = doneStages.includes(idx)
                    return (
                      <article
                        key={stage.num}
                        className={clsx('tsf-stage', { active: isActive, done: isDone })}
                      >
                        <div className="tsf-stage-top">
                          <span>{stage.num}</span>
                          <span className="tsf-stage-status">
                            {isDone ? 'done' : isActive ? 'run' : '…'}
                          </span>
                        </div>
                        <div className="tsf-stage-title">{stage.title}</div>
                        <div className="tsf-stage-log">{stageLogs[idx]}</div>
                      </article>
                    )
                  })}
                </div>
              </section>

              <section className={clsx('tsf-state', { active: appState === 'result' })}>
                {result ? (
                  <>
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

                    <div className="tsf-result-foot">
                      <span className="tsf-provider-pill">
                        provider: {result.provider}
                        {result.cached ? ' · cached 24h' : ''}
                      </span>
                      <div className="tsf-actions">
                        <button
                          type="button"
                          className={clsx({ done: copyState === 'done' })}
                          onClick={handleCopy}
                        >
                          {copyState === 'done' ? 'Copied' : 'Copy summary'}
                        </button>
                        <button type="button" className="secondary" onClick={handleReset}>
                          Analyze another
                        </button>
                      </div>
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

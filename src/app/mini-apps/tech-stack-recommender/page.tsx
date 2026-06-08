'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { clsx } from 'clsx'
import './page-styles.css'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { HowItWorks, type HowItWorksStep } from '@/components/mini-apps/HowItWorks'
import type {
  ApiResponse,
  StackChoice,
  StackResult,
} from '@/app/api/mini-apps/tech-stack-recommender/route'
import { EMAIL_REGEX } from '@/lib/leads/disposable'
import { PageScripts } from './PageScripts'

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

const LAYER_ACCENTS: Record<string, string> = {
  Frontend: 'layer-frontend',
  Backend: 'layer-backend',
  Database: 'layer-database',
  Hosting: 'layer-hosting',
  Auth: 'layer-auth',
  Payments: 'layer-payments',
}

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

function complexityClass(c: string): string {
  if (c === 'Simple') return 'is-simple'
  if (c === 'Moderate') return 'is-moderate'
  if (c === 'Ambitious') return 'is-ambitious'
  return 'is-complex'
}

function buildPlainText(r: StackResult): string {
  return [
    `Tech Stack — ${r.project_name}`,
    r.project_type,
    '='.repeat(60),
    '',
    r.one_liner,
    '',
    `Complexity: ${r.complexity} (${r.complexity_score}/10)`,
    `Build (est.): ${r.build_estimate}`,
    `Monthly cost (est.): ${r.monthly_cost_estimate}`,
    '',
    '// STACK',
    ...r.layers.map(
      (l) =>
        `${l.layer}: ${l.pick} (${l.monthly_cost})\n  ${l.why}\n  Alt: ${l.alternatives.join(', ')}`
    ),
    '',
    '// KEY SERVICES',
    ...r.key_services.map((s) => `  ${s.name} — ${s.purpose}`),
    '',
    '// CONSIDERATIONS',
    ...r.considerations.map((c, i) => `  ${i + 1}. ${c}`),
    '',
    'Generated by S7 Labs Tech Stack Recommender',
  ].join('\n')
}

function StatMini({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="stat-mini">
      <span className="stat-label">{label}</span>
      <span className={clsx('stat-value', valueClass)}>{value}</span>
    </div>
  )
}

function StackDiagram({ layers }: { layers: StackChoice[] }) {
  return (
    <div className="stack-diagram" aria-label="Recommended architecture layers">
      <div className="stack-diagram-header">
        <span>{'// architecture'}</span>
        <span className="stack-diagram-hint">Screenshot-ready</span>
      </div>
      <div className="stack-diagram-body">
        {layers.map((layer, i) => (
          <div key={layer.layer} className="stack-diagram-row">
            {i > 0 && <div className="stack-connector" aria-hidden />}
            <div className={clsx('stack-layer', LAYER_ACCENTS[layer.layer])}>
              <span className="stack-layer-label">{layer.layer}</span>
              <span className="stack-layer-pick">{layer.pick}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LayerCard({ layer }: { layer: StackChoice }) {
  return (
    <div className="layer-card">
      <div className="layer-card-header">
        <span className="layer-name">{layer.layer}</span>
        <span className="pick-badge">{layer.pick}</span>
        <span className="cost-tag">{layer.monthly_cost}</span>
      </div>
      <p className="layer-why">{layer.why}</p>
      {layer.alternatives.length > 0 && (
        <p className="layer-alts">or: {layer.alternatives.join(', ')}</p>
      )}
    </div>
  )
}

export default function TechStackRecommenderPage() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [brief, setBrief] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  const [shakeInput, setShakeInput] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<StackResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [exportState, setExportState] = useState<'idle' | 'copying' | 'png' | 'pdf'>('idle')
  const [tokens, setTokens] = useState<{ in: number; out: number } | null>(null)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [shakeEmail, setShakeEmail] = useState(0)

  const [activeStage, setActiveStage] = useState(-1)
  const [doneStages, setDoneStages] = useState<number[]>([])
  const [stageLogs, setStageLogs] = useState<string[]>(['', '', '', ''])
  const [progressPct, setProgressPct] = useState(0)
  const [loadingPct, setLoadingPct] = useState('0%')
  const [latency, setLatency] = useState('—')
  const [sysState, setSysState] = useState('idle')
  const [clock, setClock] = useState('—')

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const stackDiagramRef = useRef<HTMLDivElement | null>(null)
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
  }, [clearTimers])

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

      let submissionId: string | null = null
      try {
        const res = await fetch('/api/leads/submit', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email: emailClean,
            miniAppSlug: 'tech-stack-recommender',
            input: { brief: trimmed },
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

      let data: ApiResponse
      try {
        const res = await fetch('/api/mini-apps/tech-stack-recommender', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brief: trimmed }),
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
      setLatency(((performance.now() - runStartRef.current) / 1000).toFixed(1) + 's')
      setProgressPct(100)
      setLoadingPct('100%')

      if (data.ok) {
        setDoneStages([0, 1, 2, 3])
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
      } else {
        setErrorMsg(data.message)
        setSysState('error')
        setAppState('error')
      }
      setSubmitting(false)
    },
    [brief, email, submitting, startLoadingAnimation, clearTimers]
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

  const handleCopy = useCallback(async () => {
    if (!result) return
    setExportState('copying')
    try {
      await navigator.clipboard.writeText(buildPlainText(result))
    } catch {
      const ta = document.createElement('textarea')
      ta.value = buildPlainText(result)
      ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setTimeout(() => setExportState('idle'), 1800)
  }, [result])

  const captureDiagram = useCallback(async () => {
    if (!stackDiagramRef.current || !result) return null
    const { default: html2canvas } = await import('html2canvas')
    return html2canvas(stackDiagramRef.current, {
      backgroundColor: '#101014',
      scale: 2,
      useCORS: true,
      logging: false,
    })
  }, [result])

  const handleDownloadPng = useCallback(async () => {
    if (!result) return
    setExportState('png')
    try {
      const canvas = await captureDiagram()
      if (!canvas) return
      const a = document.createElement('a')
      a.download = `stack-${result.project_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    } catch (e) {
      console.error(e)
    }
    setExportState('idle')
  }, [result, captureDiagram])

  const handleDownloadPdf = useCallback(async () => {
    if (!result) return
    setExportState('pdf')
    try {
      const canvas = await captureDiagram()
      if (!canvas) return
      const { jsPDF } = await import('jspdf')
      const imgW = 190
      const imgH = (canvas.height / canvas.width) * imgW
      const pdf = new jsPDF({ orientation: imgH > imgW ? 'portrait' : 'landscape', unit: 'mm' })
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, imgW, imgH)
      pdf.save(`stack-${result.project_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`)
    } catch (e) {
      console.error(e)
    }
    setExportState('idle')
  }, [result, captureDiagram])

  return (
    <div className="tech-stack-recommender">
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
              <section className={clsx('tsr-state', { active: appState === 'idle' })}>
                <div className="idle-label">Describe what you want to build</div>
                <form noValidate onSubmit={handleSubmit} autoComplete="off">
                  <div className="input-field">
                    <label>Project brief</label>
                    <div
                      key={`b-${shakeInput}`}
                      className={clsx('textarea-box', { error: inputError })}
                    >
                      <textarea
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
                    </div>
                    {inputError && <div className="field-error">{inputError}</div>}
                    <div className="char-count">{brief.length} chars</div>
                  </div>
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
                <div className="progress-track">
                  <div className="progress-bar" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="loading-header">
                  <span>
                    Analysing <strong>{brief.length} chars</strong>
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

              <section className={clsx('tsr-state', { active: appState === 'result' })}>
                {result && (
                  <>
                    <div className="result-head">
                      <span className="title">Recommended stack</span>
                      <span className="ts-label">{result.project_name}</span>
                    </div>

                    <div className="one-liner-block">
                      <p className="one-liner-text">&ldquo;{result.one_liner}&rdquo;</p>
                      <div className="one-liner-meta">
                        <span className="project-name">{result.project_name}</span>
                        <span className="type-pill">{result.project_type}</span>
                      </div>
                      <p className="estimate-note">
                        Cost, complexity, and build time are estimates at MVP scale.
                      </p>
                    </div>

                    <div className="stats-row">
                      <div className="score-card cost-card">
                        <div className="sc-label">Monthly cost (est.)</div>
                        <div className="sc-value">
                          <span className="sc-big">{result.monthly_cost_estimate}</span>
                        </div>
                        <div className="sc-delta">Build: {result.build_estimate}</div>
                      </div>
                      <div className="score-card glance-card">
                        <div className="sc-label">At a glance</div>
                        <div className="stat-grid">
                          <StatMini
                            label="Complexity"
                            value={result.complexity}
                            valueClass={`complexity-badge ${complexityClass(result.complexity)}`}
                          />
                          <StatMini label="Layers" value="6" />
                          <StatMini label="Build time" value={result.build_estimate} />
                          <StatMini label="Services" value={String(result.key_services.length)} />
                        </div>
                      </div>
                    </div>

                    <div ref={stackDiagramRef}>
                      <StackDiagram layers={result.layers} />
                    </div>

                    <div className="section-header">
                      <span>{'// Layer breakdown'}</span>
                      <span>6 layers</span>
                    </div>
                    <div className="layer-grid">
                      {result.layers.map((layer) => (
                        <LayerCard key={layer.layer} layer={layer} />
                      ))}
                    </div>

                    {result.key_services.length > 0 && (
                      <>
                        <div className="section-header">
                          <span>{'// third-party services'}</span>
                        </div>
                        <div className="services-row">
                          {result.key_services.map((svc) => (
                            <div key={svc.name} className="service-pill">
                              <span className="service-name">{svc.name}</span>
                              <span className="service-purpose">{svc.purpose}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    <div className="considerations-block">
                      <div className="considerations-eyebrow">{'// before you build'}</div>
                      <ol className="considerations-list">
                        {result.considerations.map((item, i) => (
                          <li key={i} className="consideration-row">
                            <span className="consideration-number">
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <span className="consideration-text">{item}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="result-footer">
                      <div className="export-actions">
                        <button
                          className={clsx('export-btn', { done: exportState === 'copying' })}
                          type="button"
                          onClick={handleCopy}
                          disabled={exportState !== 'idle'}
                        >
                          {exportState === 'copying' ? (
                            <>
                              <svg
                                width="12"
                                height="12"
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
                                width="12"
                                height="12"
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
                        <button
                          className={clsx('export-btn', { loading: exportState === 'png' })}
                          type="button"
                          onClick={handleDownloadPng}
                          disabled={exportState !== 'idle'}
                          title="Exports architecture card"
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                          </svg>
                          {exportState === 'png' ? '…' : 'PNG'}
                        </button>
                        <button
                          className={clsx('export-btn', { loading: exportState === 'pdf' })}
                          type="button"
                          onClick={handleDownloadPdf}
                          disabled={exportState !== 'idle'}
                          title="Exports architecture card"
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <path d="M14 2v6h6" />
                            <path d="M12 18v-6M9 15l3 3 3-3" />
                          </svg>
                          {exportState === 'pdf' ? '…' : 'PDF'}
                        </button>
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

'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { clsx } from 'clsx'

import './page-styles.css'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { EmailGate } from '@/components/mini-apps/EmailGate'
import { HowItWorks, type HowItWorksStep } from '@/components/mini-apps/HowItWorks'
import { SubmitOnce } from '@/components/mini-apps/SubmitOnce'

import type {
  ApiResponse,
  IntentSignal,
  IntentSignalsResult,
} from '@/app/api/mini-apps/intent-signals/route'
import { PageScripts } from './PageScripts'

type AppState = 'idle' | 'loading' | 'result' | 'error'

type StageConfig = { num: string; title: string; logs: string[] }

const STAGES: StageConfig[] = [
  {
    num: '01',
    title: 'Normalizing domain',
    logs: ['validating hostname', 'resolved canonical host', 'target locked'],
  },
  {
    num: '02',
    title: 'Collecting public signals',
    logs: ['hiring surfaces checked', 'news results scanned', 'tech markers extracted'],
  },
  {
    num: '03',
    title: 'Ranking intent strength',
    logs: ['signals sorted by confidence', 'intent score calibrated', 'summary drafted'],
  },
  {
    num: '04',
    title: 'Drafting outreach angle',
    logs: ['angle generated', 'message framed to trigger', 'report complete'],
  },
]

const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    title: 'Enter a company domain',
    description: 'Start with one domain. We normalize and resolve the host before scanning.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="8" />
        <path d="M4 12h16M12 4c2 2.2 3 5.2 3 8s-1 5.8-3 8c-2-2.2-3-5.2-3-8s1-5.8 3-8z" />
      </svg>
    ),
  },
  {
    title: 'Collectors run in parallel',
    description:
      'Hiring, news, and tech collectors run together to capture fresh external context.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 7h6v4H4zM14 7h6v4h-6zM9 13h6v4H9z" />
        <path d="M7 11v2M17 11v2M12 11v2" />
      </svg>
    ),
  },
  {
    title: 'AI scores only observed evidence',
    description: 'Claude ranks provided signals and computes intent without inventing extra facts.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 12l4-4 4 4 8-8" />
        <path d="M4 18h16" />
      </svg>
    ),
  },
  {
    title: 'Get actionable outreach angle',
    description: 'You receive a clear score, concise summary, ranked signals, and an angle to use.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M22 2L11 13" />
        <path d="M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    ),
  },
]

const STAGE_MS = 4800

function formatReportTs(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `REPORT · ${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} · ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`
}

function normalizeHostInput(value: string): string {
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return ''
  try {
    const withProto = /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`
    const url = new URL(withProto)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return trimmed
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/^www\./, '')
  }
}

function scoreClass(score: number): string {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

function scoreNote(score: number): string {
  if (score >= 70) return 'active timing window'
  if (score >= 40) return 'mixed timing signals'
  return 'quiet timing profile'
}

function signalTypeLabel(type: IntentSignal['type']): string {
  if (type === 'hiring') return 'Hiring'
  if (type === 'news') return 'News'
  return 'Tech'
}

function buildPlainText(result: IntentSignalsResult): string {
  return [
    `Intent Signals — ${result.domain}`,
    '='.repeat(56),
    '',
    `Intent Score: ${result.intentScore}/100`,
    '',
    '// Summary',
    result.summary,
    '',
    '// Ranked Signals',
    ...result.signals.map(
      (signal, index) =>
        `${index + 1}. [${signal.strength.toUpperCase()}] ${signal.headline}\n   (${signalTypeLabel(signal.type)}) ${signal.detail}\n   Source: ${signal.source} · ${signal.sourceUrl}`
    ),
    '',
    '// Outreach Angle',
    result.outreachAngle,
    '',
    `Tokens: ${(result.tokensIn + result.tokensOut).toLocaleString()} (${result.tokensIn.toLocaleString()} in / ${result.tokensOut.toLocaleString()} out)`,
  ].join('\n')
}

export default function IntentSignalsPage() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [domain, setDomain] = useState('')
  const [domainError, setDomainError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<IntentSignalsResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [resultTs, setResultTs] = useState('')
  const [copying, setCopying] = useState(false)

  const [activeStage, setActiveStage] = useState(-1)
  const [doneStages, setDoneStages] = useState<number[]>([])
  const [stageLogs, setStageLogs] = useState<string[]>(['', '', '', ''])
  const [progressPct, setProgressPct] = useState(0)
  const [loadingPct, setLoadingPct] = useState('0%')
  const [latency, setLatency] = useState('—')
  const [clock, setClock] = useState('—')
  const [sysState, setSysState] = useState('idle')
  const [cost, setCost] = useState<{
    model: string
    inputTokens: number
    outputTokens: number
    costUsd: number
  } | null>(null)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const rafRef = useRef<number | null>(null)
  const runStartRef = useRef(0)

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const pad = (value: number) => String(value).padStart(2, '0')
      setClock(`${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}Z`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (appState !== 'idle') return
    const timer = setTimeout(() => inputRef.current?.focus(), 200)
    return () => clearTimeout(timer)
  }, [appState])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer))
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

    const start = performance.now()
    const totalMs = STAGE_MS * STAGES.length
    runStartRef.current = start

    const tick = (now: number) => {
      const pct = Math.min(98, ((now - start) / totalMs) * 100)
      setProgressPct(pct)
      setLoadingPct(`${Math.floor(pct)}%`)
      setLatency(`${((now - start) / 1000).toFixed(1)}s`)
      if (pct < 98) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    STAGES.forEach((stage, index) => {
      timersRef.current.push(
        setTimeout(() => {
          setActiveStage(index)
          setStageLogs((prev) => {
            const next = [...prev]
            next[index] = stage.logs[0] ?? ''
            return next
          })
          stage.logs.forEach((log, logIndex) => {
            if (logIndex === 0) return
            timersRef.current.push(
              setTimeout(
                () => {
                  setStageLogs((prev) => {
                    const next = [...prev]
                    next[index] = log
                    return next
                  })
                },
                (logIndex * STAGE_MS) / stage.logs.length
              )
            )
          })
        }, index * STAGE_MS)
      )
      timersRef.current.push(
        setTimeout(
          () => {
            setDoneStages((prev) => [...prev, index])
          },
          (index + 1) * STAGE_MS
        )
      )
    })
  }, [clearTimers])

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      if (submitting) return

      const domainNormalized = normalizeHostInput(domain)
      if (!domainNormalized || !/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(domainNormalized)) {
        setDomainError('Enter a valid domain, e.g. acme.com')
        return
      }

      setDomainError(null)
      setSubmitting(true)
      setResult(null)
      setErrorMsg('')
      setCost(null)
      setSysState('running')
      setAppState('loading')
      startLoadingAnimation()

      let data: ApiResponse
      try {
        const response = await fetch('/api/mini-apps/intent-signals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: domainNormalized }),
        })
        data = (await response.json()) as ApiResponse
      } catch {
        clearTimers()
        setErrorMsg('Network error. Please check your connection and try again.')
        setSysState('error')
        setAppState('error')
        setSubmitting(false)
        return
      }

      clearTimers()
      const elapsed = `${((performance.now() - runStartRef.current) / 1000).toFixed(1)}s`
      setLatency(elapsed)
      setProgressPct(100)
      setLoadingPct('100%')

      if (data.ok) {
        setDoneStages([0, 1, 2, 3])
        setResult(data.data)
        setResultTs(formatReportTs(new Date()))
        setSysState('complete')
        setAppState('result')
        if (data.cost) setCost(data.cost)
      } else {
        setErrorMsg(data.message)
        setSysState('error')
        setAppState('error')
      }

      setSubmitting(false)
    },
    [clearTimers, domain, startLoadingAnimation, submitting]
  )

  const handleReset = useCallback(() => {
    clearTimers()
    setAppState('idle')
    setResult(null)
    setErrorMsg('')
    setDomainError(null)
    setSubmitting(false)
    setProgressPct(0)
    setLoadingPct('0%')
    setLatency('—')
    setSysState('idle')
    setCost(null)
  }, [clearTimers])

  const handleCopy = useCallback(async () => {
    if (!result || copying) return
    setCopying(true)
    try {
      await navigator.clipboard.writeText(buildPlainText(result))
    } catch {
      const ta = document.createElement('textarea')
      ta.value = buildPlainText(result)
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    window.setTimeout(() => setCopying(false), 1500)
  }, [copying, result])

  const targetLabel = useMemo(() => normalizeHostInput(domain) || 'target', [domain])

  return (
    <div className="intent-signals">
      <AuroraBackground />
      <Header />

      <main className="shell">
        <section className="hero">
          <span className="eyebrow">Intent Signals</span>
          <h1>
            Catch intent windows before your <span className="accent">competitors do</span>.
          </h1>
          <p>
            Drop in a domain. We check hiring, news, and tech movement, then return a ranked signal
            feed and outreach angle your team can use immediately.
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
                </div>
                <div className="prr">
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
              <section className={`state${appState === 'idle' ? 'active' : ''}`}>
                <div className="idle-label">Input target domain</div>
                <form className="domain-form" onSubmit={handleSubmit} noValidate>
                  <div className={`input-box${domainError ? 'error' : ''}`}>
                    <input
                      ref={inputRef}
                      type="text"
                      value={domain}
                      placeholder="acme.com"
                      onChange={(event) => {
                        setDomain(event.target.value)
                        if (domainError) setDomainError(null)
                      }}
                      disabled={submitting}
                    />
                    <button type="submit" disabled={submitting}>
                      Run scan
                    </button>
                  </div>
                  {domainError ? <p className="field-error">{domainError}</p> : null}
                </form>
              </section>

              <section className={`state${appState === 'loading' ? 'active' : ''}`}>
                <div className="progress-track">
                  <div className="progress-bar" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="loading-header">
                  <span>
                    Scanning <strong>{targetLabel}</strong>
                  </span>
                  <span>{loadingPct}</span>
                </div>
                <div className="stages">
                  {STAGES.map((stage, index) => {
                    const isActive = activeStage === index && !doneStages.includes(index)
                    const isDone = doneStages.includes(index)
                    return (
                      <div
                        key={stage.num}
                        className={clsx('stage', { active: isActive, done: isDone })}
                      >
                        <div className="stage-num-row">
                          <span>{stage.num}</span>
                        </div>
                        <div className="stage-title">{stage.title}</div>
                        <div className="stage-log">{stageLogs[index]}</div>
                      </div>
                    )
                  })}
                </div>
              </section>

              <section className={`state${appState === 'result' ? 'active' : ''}`}>
                {result ? (
                  <EmailGate
                    miniAppSlug="intent-signals"
                    pattern="upfront"
                    initialInput={{ domain: result.domain }}
                  >
                    {({ submitToApi }) => (
                      <>
                        <SubmitOnce
                          submit={submitToApi}
                          input={{ domain: result.domain }}
                          output={result}
                          cost={cost ?? undefined}
                        />

                        <div className="result-head">
                          <span className="title">Signal report ready</span>
                          <span className="ts-label">{resultTs}</span>
                        </div>

                        <div className="score-grid">
                          <article className={`score-card ${scoreClass(result.intentScore)}`}>
                            <div className="score-label">Intent score</div>
                            <div className="score-value">{result.intentScore}</div>
                            <div className="score-note">{scoreNote(result.intentScore)}</div>
                          </article>
                          <article className="summary-card">
                            <div className="score-label">Summary</div>
                            <p>{result.summary}</p>
                          </article>
                        </div>

                        <article className="angle-card">
                          <div className="angle-eyebrow">{'// Outreach angle'}</div>
                          <p>{result.outreachAngle}</p>
                        </article>

                        <div className="section-head">
                          <span>{'// Ranked signals'}</span>
                          <span>{result.signals.length} found</span>
                        </div>
                        <div className="signal-list">
                          {result.signals.map((signal, index) => (
                            <article key={`${signal.sourceUrl}-${index}`} className="signal-item">
                              <div className="signal-top">
                                <h3>{signal.headline}</h3>
                                <span className={`chip ${signal.strength}`}>{signal.strength}</span>
                              </div>
                              <p>{signal.detail}</p>
                              <div className="signal-meta">
                                <span>{signalTypeLabel(signal.type)}</span>
                                <span>{signal.source}</span>
                              </div>
                            </article>
                          ))}
                          {result.signals.length === 0 ? (
                            <article className="signal-item empty">
                              <h3>Quiet signal profile</h3>
                              <p>No strong public triggers were detected in this scan window.</p>
                            </article>
                          ) : null}
                        </div>

                        <div className="result-footer">
                          <button type="button" className="footer-btn" onClick={handleReset}>
                            Scan another
                          </button>
                          <button type="button" className="footer-btn" onClick={handleCopy}>
                            {copying ? 'Copied' : 'Copy signals'}
                          </button>
                          <a
                            className="footer-btn primary"
                            href="https://www.system7.ai/contact"
                            target="_blank"
                          >
                            Book a call
                          </a>
                        </div>
                      </>
                    )}
                  </EmailGate>
                ) : null}
              </section>

              <section className={`state error${appState === 'error' ? 'active' : ''}`}>
                <h2>Scan failed</h2>
                <p>{errorMsg}</p>
                <button type="button" className="footer-btn" onClick={handleReset}>
                  Try again
                </button>
              </section>
            </div>
          </div>
        </div>

        <HowItWorks
          title={
            <>
              From domain to <span className="accent">ranked buyer intent</span>
            </>
          }
          subtitle="Signal collection, ranking, and outreach framing in four steps."
          steps={HOW_IT_WORKS_STEPS}
        />
      </main>

      <Footer />
      <PageScripts />
    </div>
  )
}

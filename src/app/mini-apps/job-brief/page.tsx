'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { clsx } from 'clsx'
import './page-styles.css'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { EmailGate } from '@/components/mini-apps/EmailGate'
import { HowItWorks, type HowItWorksStep } from '@/components/mini-apps/HowItWorks'
import { SubmitOnce } from '@/components/mini-apps/SubmitOnce'
import type { ApiResponse, BriefResult, Signal } from '@/app/api/mini-apps/job-brief/route'
import { PageScripts } from './PageScripts'

type AppState = 'idle' | 'loading' | 'result' | 'error'
type InputMode = 'url' | 'text'

const BRIEF_STEPS: HowItWorksStep[] = [
  {
    title: 'Paste a job posting URL or text',
    description:
      'Public listings work great. Internal postings — just paste the text directly. Either way, no scraping you need to set up.',
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
    title: 'We extract requirements, tech stack, and budget signals',
    description:
      'Every responsibility, named tool, and seniority cue is decoded into something a salesperson can actually use.',
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
    title: 'AI infers pain points and the best sales angle',
    description:
      'What this hire tells you about what is broken or overloaded — and the specific angle that lands with this buyer.',
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
    title: 'Get your sales brief with the ideal contact',
    description:
      'Executive summary, tech fingerprint, pain points, budget signals — plus the role + persona to reach out to first.',
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
    title: 'Fetching job post',
    logs: ['requesting URL', '200 OK · parsing', 'content ready'],
  },
  {
    num: '02',
    title: 'Extracting signals',
    logs: ['reading requirements', 'scanning tech stack', 'signals found'],
  },
  {
    num: '03',
    title: 'Inferring pain points',
    logs: ['mapping priorities', 'identifying gaps', 'pains mapped'],
  },
  {
    num: '04',
    title: 'Writing sales brief',
    logs: ['profiling buyer', 'crafting angle', 'brief ready'],
  },
]
const STAGE_MS = 5000

const SIGNAL_ICONS: Record<string, string> = {
  priority: '🎯',
  pain: '⚡',
  tech: '⚙️',
  budget: '💰',
  team: '👥',
  timing: '🕐',
}

const SENIORITY_LABEL: Record<string, string> = {
  ic: 'Individual Contributor',
  lead: 'Tech Lead',
  manager: 'Manager',
  director: 'Director',
  vp: 'VP',
  'c-suite': 'C-Suite',
}

function fmtTs(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `BRIEF · ${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} · ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`
}

function buildPlainText(r: BriefResult): string {
  return [
    `Job Posting to Sales Brief — ${r.company}`,
    '='.repeat(60),
    '',
    `Role      : ${r.role}`,
    `Department: ${r.department} · ${SENIORITY_LABEL[r.seniority] ?? r.seniority}`,
    `Urgency   : ${r.urgency.toUpperCase()}`,
    '',
    '// EXECUTIVE SUMMARY',
    r.summary,
    '',
    '// BEST SALES ANGLE',
    r.best_angle,
    `Ideal contact: ${r.ideal_contact}`,
    '',
    '// TECH STACK',
    r.tech_stack.join(', '),
    '',
    '// PAIN POINTS',
    ...r.pain_points.map((p) => `  · ${p}`),
    '',
    '// BUDGET INDICATORS',
    ...r.budget_indicators.map((b) => `  · ${b}`),
    '',
    '// SIGNALS',
    ...r.signals.map((s) => `  [${s.category.toUpperCase()}] ${s.label}\n  ${s.detail}`),
    '',
    `Tokens: ${(r.tokens_in + r.tokens_out).toLocaleString()} (${r.tokens_in.toLocaleString()} in / ${r.tokens_out.toLocaleString()} out)`,
    'Generated by S7 Labs Job Posting to Sales Brief',
  ].join('\n')
}

function SignalCard({ signal }: { signal: Signal }) {
  return (
    <div className="signal">
      <div className="signal-icon">{SIGNAL_ICONS[signal.category] ?? '📌'}</div>
      <div className="signal-body">
        <div className="signal-label">{signal.label}</div>
        <div className="signal-detail">{signal.detail}</div>
      </div>
      <span className={`signal-cat ${signal.category}`}>{signal.category}</span>
    </div>
  )
}

export default function JobBriefPage() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [inputMode, setInputMode] = useState<InputMode>('url')
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  const [shakeInput, setShakeInput] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<BriefResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [resultTs, setResultTs] = useState('')
  const [exportState, setExportState] = useState<'idle' | 'copying' | 'png' | 'pdf'>('idle')
  const [tokens, setTokens] = useState<{ in: number; out: number } | null>(null)
  const [cost, setCost] = useState<{
    model: string
    inputTokens: number
    outputTokens: number
    costUsd: number
  } | null>(null)

  const [activeStage, setActiveStage] = useState(-1)
  const [doneStages, setDoneStages] = useState<number[]>([])
  const [stageLogs, setStageLogs] = useState<string[]>(['', '', '', ''])
  const [progressPct, setProgressPct] = useState(0)
  const [loadingPct, setLoadingPct] = useState('0%')
  const [latency, setLatency] = useState('—')
  const [sysState, setSysState] = useState('idle')
  const [clock, setClock] = useState('—')
  const [loadingLabel, setLoadingLabel] = useState('')

  const urlInputRef = useRef<HTMLInputElement | null>(null)
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
      const t = setTimeout(() => urlInputRef.current?.focus(), 200)
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

      const trimUrl = url.trim()
      const trimText = text.trim()

      if (inputMode === 'url') {
        if (!trimUrl || !/^https?:\/\//i.test(trimUrl)) {
          setInputError('Enter a valid job posting URL starting with https://')
          setShakeInput((k) => k + 1)
          return
        }
      } else {
        if (!trimText || trimText.length < 50) {
          setInputError('Paste the full job description (at least 50 characters).')
          setShakeInput((k) => k + 1)
          return
        }
      }

      setInputError(null)
      setSubmitting(true)
      setResult(null)
      setErrorMsg('')
      setSysState('running')
      setAppState('loading')
      const label =
        inputMode === 'url'
          ? (trimUrl.replace(/^https?:\/\//, '').split('/')[0] ?? trimUrl)
          : 'pasted text'
      startLoadingAnimation(label)

      let data: ApiResponse
      try {
        const res = await fetch('/api/mini-apps/job-brief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inputMode === 'url' ? { url: trimUrl } : { text: trimText }),
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
        if (data.cost) setCost(data.cost)
        setResultTs(fmtTs(new Date()))
        setSysState('complete')
        setAppState('result')
      } else {
        setErrorMsg(data.message)
        setSysState('error')
        setAppState('error')
      }
      setSubmitting(false)
    },
    [url, text, inputMode, submitting, startLoadingAnimation, clearTimers]
  )

  const handleReset = useCallback(() => {
    clearTimers()
    setAppState('idle')
    setResult(null)
    setErrorMsg('')
    setInputError(null)
    setSubmitting(false)
    setSysState('idle')
    setLatency('—')
    setProgressPct(0)
    setTokens(null)
    setCost(null)
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

  const handleDownloadPng = useCallback(async () => {
    if (!resultPanelRef.current || !result) return
    setExportState('png')
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(resultPanelRef.current, {
        backgroundColor: '#101014',
        scale: 2,
        useCORS: true,
        logging: false,
      })
      const a = document.createElement('a')
      a.download = `brief-${result.company.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    } catch (e) {
      console.error(e)
    }
    setExportState('idle')
  }, [result])

  const handleDownloadPdf = useCallback(async () => {
    if (!resultPanelRef.current || !result) return
    setExportState('pdf')
    try {
      const { default: html2canvas } = await import('html2canvas')
      const { jsPDF } = await import('jspdf')
      const canvas = await html2canvas(resultPanelRef.current, {
        backgroundColor: '#101014',
        scale: 2,
        useCORS: true,
        logging: false,
      })
      const imgW = 190
      const imgH = (canvas.height / canvas.width) * imgW
      const pdf = new jsPDF({ orientation: imgH > imgW ? 'portrait' : 'landscape', unit: 'mm' })
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, imgW, imgH)
      pdf.save(`brief-${result.company.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`)
    } catch (e) {
      console.error(e)
    }
    setExportState('idle')
  }, [result])

  return (
    <div className="job-brief">
      <AuroraBackground />

      <Header />

      <main className="shell">
        <section className="hero">
          <span className="eyebrow">Job Posting to Sales Brief</span>
          <h1>
            Read the job, <span className="accent">know the pitch.</span>
          </h1>
          <p>
            Drop a job posting URL or paste the text. We decode what the company is actually
            building, what&apos;s broken, and exactly how to sell into them right now.
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
              <section className={`jb-state${appState === 'idle' ? 'active' : ''}`}>
                <div className="idle-label">Job posting source</div>
                <form noValidate onSubmit={handleSubmit} autoComplete="off">
                  {/* Mode toggle */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    {(['url', 'text'] as InputMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setInputMode(mode)
                          setInputError(null)
                        }}
                        style={{
                          border: `1px solid ${inputMode === mode ? 'var(--blue)' : 'var(--border-strong)'}`,
                          background:
                            inputMode === mode ? 'rgba(79,140,255,0.1)' : 'rgba(255,255,255,0.02)',
                          color: inputMode === mode ? 'var(--blue)' : 'var(--text-muted)',
                          fontFamily: 'var(--mono)',
                          fontSize: '10.5px',
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          padding: '7px 14px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 160ms',
                        }}
                      >
                        {mode === 'url' ? 'URL' : 'Paste text'}
                      </button>
                    ))}
                  </div>

                  {inputMode === 'url' ? (
                    <div className="input-field">
                      <label>Job posting URL</label>
                      <div
                        key={`u-${shakeInput}`}
                        className={`input-box${inputError ? 'error' : ''}`}
                      >
                        <input
                          ref={urlInputRef}
                          type="url"
                          placeholder="https://jobs.ashbyhq.com/acme/..."
                          value={url}
                          disabled={submitting}
                          onChange={(e) => {
                            setUrl(e.target.value)
                            if (inputError) setInputError(null)
                          }}
                        />
                      </div>
                      {inputError && <div className="field-error">{inputError}</div>}
                    </div>
                  ) : (
                    <div className="input-field">
                      <label>Job description text</label>
                      <div
                        key={`t-${shakeInput}`}
                        className={`textarea-box${inputError ? 'error' : ''}`}
                      >
                        <textarea
                          placeholder={`We're hiring a Senior RevOps Manager...\nYou'll own our Salesforce instance...\nRequirements: 5+ years in Revenue Operations...`}
                          value={text}
                          disabled={submitting}
                          onChange={(e) => {
                            setText(e.target.value)
                            if (inputError) setInputError(null)
                          }}
                        />
                      </div>
                      {inputError && <div className="field-error">{inputError}</div>}
                      <div className="char-count">{text.length} chars</div>
                    </div>
                  )}

                  <div className="submit-row">
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
                      Generate brief
                    </button>
                  </div>
                </form>
              </section>

              {/* LOADING */}
              <section className={`jb-state${appState === 'loading' ? 'active' : ''}`}>
                <div className="progress-track">
                  <div className="progress-bar" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="loading-header">
                  <span>
                    Analysing <strong>{loadingLabel}</strong>
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

              {/* RESULT */}
              <section className={`jb-state${appState === 'result' ? 'active' : ''}`}>
                {result && (
                  <EmailGate
                    miniAppSlug="job-posting-sales-brief"
                    pattern="upfront"
                    initialInput={inputMode === 'url' ? { url: url.trim() } : { text: text.trim() }}
                  >
                    {({ submitToApi }) => (
                      <>
                        <SubmitOnce
                          submit={submitToApi}
                          input={inputMode === 'url' ? { url: url.trim() } : { text: text.trim() }}
                          output={result}
                          cost={cost ?? undefined}
                        />
                        <div ref={resultPanelRef}>
                          <div className="result-head">
                            <span className="title">Brief ready — {result.company}</span>
                            <span className="ts-label">{resultTs}</span>
                          </div>

                          <div className="summary-block">
                            <div className="summary-eyebrow">
                              {'// Executive summary'}
                              <div className="role-badges">
                                <span className={`badge urgency-${result.urgency}`}>
                                  {result.urgency} urgency
                                </span>
                                <span className="badge dept">{result.department}</span>
                                <span className="badge">
                                  {SENIORITY_LABEL[result.seniority] ?? result.seniority}
                                </span>
                              </div>
                            </div>
                            <p className="summary-text">{result.summary}</p>
                          </div>

                          <div className="angle-block">
                            <div className="angle-eyebrow">{'// Best sales angle'}</div>
                            <p className="angle-text">{result.best_angle}</p>
                            <div className="contact-row">
                              Ideal first contact: <strong>{result.ideal_contact}</strong>
                            </div>
                          </div>

                          {result.tech_stack.length > 0 && (
                            <>
                              <div className="section-header">
                                <span>{'// Tech stack'}</span>
                                <span>{result.tech_stack.length} tools</span>
                              </div>
                              <div className="tag-cloud">
                                {result.tech_stack.map((t) => (
                                  <span key={t} className="tag tech">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}

                          {result.pain_points.length > 0 && (
                            <>
                              <div className="section-header">
                                <span>{'// Implied pain points'}</span>
                              </div>
                              <div className="tag-cloud">
                                {result.pain_points.map((p) => (
                                  <span key={p} className="tag pain">
                                    {p}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}

                          {result.budget_indicators.length > 0 && (
                            <>
                              <div className="section-header">
                                <span>{'// Budget indicators'}</span>
                              </div>
                              <div className="tag-cloud" style={{ marginBottom: '20px' }}>
                                {result.budget_indicators.map((b) => (
                                  <span key={b} className="tag budget">
                                    {b}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}

                          <div className="section-header">
                            <span>{'// Sales signals'}</span>
                            <span>{result.signals.length} found</span>
                          </div>
                          <div className="signals">
                            {result.signals.map((s, i) => (
                              <SignalCard key={i} signal={s} />
                            ))}
                          </div>
                        </div>

                        <div className="result-footer">
                          <span className="token-pill">
                            {tokens
                              ? `${(tokens.in + tokens.out).toLocaleString()} tokens · ${tokens.in.toLocaleString()} in / ${tokens.out.toLocaleString()} out`
                              : ''}
                          </span>
                          <div className="export-actions">
                            <button
                              className={`export-btn${exportState === 'copying' ? 'done' : ''}`}
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
                              className={`export-btn${exportState === 'png' ? 'loading' : ''}`}
                              type="button"
                              onClick={handleDownloadPng}
                              disabled={exportState !== 'idle'}
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
                              className={`export-btn${exportState === 'pdf' ? 'loading' : ''}`}
                              type="button"
                              onClick={handleDownloadPdf}
                              disabled={exportState !== 'idle'}
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
                              New brief
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
                  </EmailGate>
                )}
              </section>

              {/* ERROR */}
              <section className={`jb-state error-state${appState === 'error' ? 'active' : ''}`}>
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
              From job posting to <span className="accent">ready-to-pitch brief</span>
            </>
          }
          subtitle="No login, no install. Four steps from paste to a sales-ready brief."
          steps={BRIEF_STEPS}
        />
      </main>

      <Footer />
      <PageScripts />
    </div>
  )
}

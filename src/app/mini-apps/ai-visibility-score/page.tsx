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
import type { AVSApiResponse, AVSResult } from '@/app/api/mini-apps/ai-visibility-score/route'
import { PageScripts } from './PageScripts'

type AppState = 'idle' | 'loading' | 'result' | 'error'

const DOMAIN_RE = /^([a-z0-9-]+\.)+[a-z]{2,}$/i
const STAGE_MS = 5000

const AVS_STEPS: HowItWorksStep[] = [
  {
    title: 'Enter your domain',
    description:
      'We infer your brand and category, then frame buyer-intent questions for AI engines.',
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
    title: 'We ask the AIs',
    description:
      'Claude plus optional ChatGPT, Perplexity, and Google AI Overview — coverage shown on each sub-score.',
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
    title: 'Four sub-scores, one AVS',
    description:
      'Presence 35%, Citations 30%, Entity Clarity 20%, Drift 15% — fixed methodology every run.',
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
    title: 'Get your score and short read',
    description:
      'A 0–100 AVS, four sub-scores, and a plain-language breakdown of what is dragging visibility down.',
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
    title: 'Reading the brand',
    logs: ['identifying the brand', 'finding the category', 'framing the questions'],
  },
  {
    num: '02',
    title: 'Asking the AIs',
    logs: ['checking presence', 'checking citations', 'reading the answers'],
  },
  {
    num: '03',
    title: 'Testing entity clarity',
    logs: ['scanning structured data', 'probing what AI knows', 'checking drift'],
  },
  {
    num: '04',
    title: 'Scoring visibility',
    logs: ['weighting the four parts', 'grading', 'score ready'],
  },
]

function normalizeDomainInput(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
}

function gradeClass(grade: string): string {
  const g = grade.toLowerCase()
  if (g === 'a' || g === 'b') return 'grade-a'
  if (g === 'c') return 'grade-c'
  return 'grade-d'
}

function fmtTs(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `AVS · ${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} · ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`
}

function buildPlainText(r: AVSResult): string {
  const lines = [
    `AI Visibility Score — ${r.domain}`,
    `Brand: ${r.brand} · ${r.category}`,
    '='.repeat(60),
    '',
    `AVS: ${r.avs}/100 (${r.grade})`,
    `"${r.one_liner}"`,
    '',
    '// SUB-SCORES',
    ...r.sub_scores.map((s) => `  ${s.name}: ${s.score}/100 (${s.grade}) — ${s.coverage}`),
    '',
    '// BIGGEST DRAG',
    `${r.biggest_drag.sub_score}: ${r.biggest_drag.why}`,
    '',
    '// SHORT READ',
    ...r.short_read.map((s) => `  ${s.sub_score}: ${s.diagnosis}`),
  ]
  return lines.join('\n')
}

function AvsResultBody({ result }: { result: AVSResult }) {
  return (
    <div className="shareable-block">
      <div className="avs-hero">
        <div className="avs-hero-top">
          <div>
            <div className={`avs-number ${gradeClass(result.grade)}`}>{result.avs}</div>
            <div className="avs-of">/100</div>
          </div>
          <span className={`grade-badge ${gradeClass(result.grade)}`}>{result.grade}</span>
        </div>
        <p className="avs-one-liner">&ldquo;{result.one_liner}&rdquo;</p>
        <div className="avs-meta">
          <span className="type-pill">{result.brand}</span>
          <span className="type-pill">{result.category}</span>
        </div>
      </div>
      <div className="subscore-grid">
        {result.sub_scores.map((s) => (
          <div key={s.key} className={`subscore-card ${gradeClass(s.grade)}`}>
            <div className="subscore-name">{s.name}</div>
            <div>
              <span className="subscore-value">{s.score}</span>
              <span className="subscore-grade">{s.grade}</span>
            </div>
            <div className="coverage-note">{s.coverage}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AiVisibilityScorePage() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [domain, setDomain] = useState('')
  const [domainError, setDomainError] = useState<string | null>(null)
  const [shakeKey, setShakeKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<AVSResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [resultTs, setResultTs] = useState('')
  const [exportState, setExportState] = useState<'idle' | 'copying' | 'png' | 'pdf'>('idle')
  const [tokens, setTokens] = useState<{ in: number; out: number } | null>(null)
  const [activeStage, setActiveStage] = useState(-1)
  const [doneStages, setDoneStages] = useState<number[]>([])
  const [stageLogs, setStageLogs] = useState<string[]>(['', '', '', ''])
  const [progressPct, setProgressPct] = useState(0)
  const [loadingPct, setLoadingPct] = useState('0%')
  const [latency, setLatency] = useState('—')
  const [sysState, setSysState] = useState('idle')
  const [clock, setClock] = useState('—')

  const domainInputRef = useRef<HTMLInputElement | null>(null)
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
      const t = setTimeout(() => domainInputRef.current?.focus(), 200)
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
      const normalized = normalizeDomainInput(domain)
      if (!DOMAIN_RE.test(normalized)) {
        setDomainError('Enter a valid domain.')
        setShakeKey((k) => k + 1)
        return
      }
      setDomainError(null)
      setSubmitting(true)
      setResult(null)
      setErrorMsg('')
      setTokens(null)
      setAppState('loading')
      setSysState('running')
      startLoadingAnimation()

      let data: AVSApiResponse
      try {
        const res = await fetch('/api/mini-apps/ai-visibility-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: normalized }),
        })
        data = (await res.json()) as AVSApiResponse
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
        await new Promise((r) => setTimeout(r, 350))
        setResult(data.data)
        setTokens({ in: data.data.tokens_in, out: data.data.tokens_out })
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
    [submitting, domain, startLoadingAnimation, clearTimers]
  )

  const handleReset = useCallback(() => {
    clearTimers()
    setAppState('idle')
    setResult(null)
    setErrorMsg('')
    setSubmitting(false)
    setSysState('idle')
    setLatency('—')
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

  const captureShareable = useCallback(async () => {
    const el = resultPanelRef.current
    if (!el) return null
    const { default: html2canvas } = await import('html2canvas')
    const capture = html2canvas(el, {
      backgroundColor: '#101014',
      scale: 2,
      useCORS: true,
      logging: false,
      onclone: (_doc, cloned) => {
        let node: HTMLElement | null = cloned
        while (node) {
          node.style.backdropFilter = 'none'
          node.style.setProperty('-webkit-backdrop-filter', 'none')
          node = node.parentElement
        }
      },
    })
    const timeoutMs = 30_000
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      return await Promise.race([
        capture,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('Screenshot capture timed out')), timeoutMs)
        }),
      ])
    } finally {
      if (timer) clearTimeout(timer)
    }
  }, [])

  const downloadCanvasPng = useCallback((canvas: HTMLCanvasElement, filename: string) => {
    const link = document.createElement('a')
    link.download = filename
    link.href = canvas.toDataURL('image/png')
    document.body.appendChild(link)
    link.click()
    link.remove()
  }, [])

  const handleDownloadPng = useCallback(async () => {
    if (!resultPanelRef.current || !result) return
    setExportState('png')
    try {
      const canvas = await captureShareable()
      if (!canvas) {
        console.error('[ai-visibility-score] PNG export: capture target not found')
        return
      }
      downloadCanvasPng(canvas, `avs-${result.domain}.png`)
    } catch (e) {
      console.error('[ai-visibility-score] PNG export failed', e)
    } finally {
      setExportState('idle')
    }
  }, [result, captureShareable, downloadCanvasPng])

  const handleDownloadPdf = useCallback(async () => {
    if (!resultPanelRef.current || !result) return
    setExportState('pdf')
    try {
      const canvas = await captureShareable()
      if (!canvas) {
        console.error('[ai-visibility-score] PDF export: capture target not found')
        return
      }
      const { jsPDF } = await import('jspdf')
      const imgW = 190
      const imgH = (canvas.height / canvas.width) * imgW
      const pdf = new jsPDF({
        orientation: imgH > imgW ? 'portrait' : 'landscape',
        unit: 'mm',
      })
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, imgW, imgH)
      pdf.save(`avs-${result.domain}.pdf`)
    } catch (e) {
      console.error('[ai-visibility-score] PDF export failed', e)
    } finally {
      setExportState('idle')
    }
  }, [result, captureShareable])

  const leadInput = { domain: normalizeDomainInput(domain) }
  const loadingDomain = normalizeDomainInput(domain) || 'domain'

  return (
    <div className="ai-visibility-score">
      <AuroraBackground />

      <Header />

      <main className="shell">
        <section className="hero">
          <span className="eyebrow">AI Visibility Score</span>
          <h1>
            One number for how <span className="accent">visible you are to AI</span>
          </h1>
          <p>
            A single 0–100 AVS built from presence in AI answers, citations, entity clarity, and
            drift — the metric to measure yourself against over time.
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
              <section className={`avs-state${appState === 'idle' ? 'active' : ''}`}>
                <div className="idle-label">Enter your domain</div>
                <form className="idle-form" noValidate onSubmit={handleSubmit} autoComplete="off">
                  <div className="input-field">
                    <label>Domain</label>
                    <div
                      key={`d-${shakeKey}`}
                      className={clsx('input-box', { error: domainError })}
                    >
                      <input
                        ref={domainInputRef}
                        type="text"
                        placeholder="yourbrand.com"
                        value={domain}
                        disabled={submitting}
                        onChange={(e) => {
                          setDomain(e.target.value)
                          if (domainError) setDomainError(null)
                        }}
                      />
                    </div>
                    {domainError && <div className="field-error">{domainError}</div>}
                  </div>
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
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                      Get visibility score
                    </button>
                  </div>
                </form>
              </section>

              <section className={`avs-state${appState === 'loading' ? 'active' : ''}`}>
                <div className="progress-track">
                  <div className="progress-bar" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="loading-header">
                  <span>
                    Scoring <strong>{loadingDomain}</strong>
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

              <section className={`avs-state${appState === 'result' ? 'active' : ''}`}>
                {result && (
                  <EmailGate
                    miniAppSlug="ai-visibility-score"
                    pattern="upfront"
                    initialInput={leadInput}
                  >
                    {({ submitToApi }) => (
                      <>
                        <SubmitOnce submit={submitToApi} input={leadInput} output={result} />
                        <div ref={resultPanelRef}>
                          <AvsResultBody result={result} />
                          <div className="short-read-block">
                            <div className="section-header">
                              {"// what's dragging your score down"}
                            </div>
                            <p className="biggest-drag">
                              <span>{result.biggest_drag.sub_score}</span> —{' '}
                              {result.biggest_drag.why}
                            </p>
                            {result.short_read.map((item) => (
                              <div key={item.sub_score} className="short-read-item">
                                <h4>{item.sub_score}</h4>
                                <p>{item.diagnosis}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="result-footer">
                          <span className="token-pill">
                            {tokens
                              ? `${(tokens.in + tokens.out).toLocaleString()} tokens · ${tokens.in.toLocaleString()} in / ${tokens.out.toLocaleString()} out`
                              : ''}
                          </span>
                          <span className="result-ts hide-sm">{resultTs}</span>
                          <div className="export-actions">
                            <button
                              type="button"
                              className={`export-btn${exportState === 'copying' ? 'done' : ''}`}
                              onClick={handleCopy}
                              disabled={exportState !== 'idle'}
                            >
                              {exportState === 'copying' ? 'Copied' : 'Copy'}
                            </button>
                            <button
                              type="button"
                              className={`export-btn${exportState === 'png' ? 'loading' : ''}`}
                              onClick={() => void handleDownloadPng()}
                              disabled={exportState !== 'idle'}
                            >
                              {exportState === 'png' ? '…' : 'PNG'}
                            </button>
                            <button
                              type="button"
                              className={`export-btn${exportState === 'pdf' ? 'loading' : ''}`}
                              onClick={() => void handleDownloadPdf()}
                              disabled={exportState !== 'idle'}
                            >
                              {exportState === 'pdf' ? '…' : 'PDF'}
                            </button>
                            <button type="button" className="run-again" onClick={handleReset}>
                              Score another
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

              <section className={`avs-state error-state${appState === 'error' ? 'active' : ''}`}>
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
                <h2 className="err-title">Score failed</h2>
                <p className="err-msg">{errorMsg}</p>
                <button type="button" className="err-btn" onClick={handleReset}>
                  Try again
                </button>
              </section>
            </div>
          </div>
        </div>

        <HowItWorks
          title={
            <>
              From domain to AVS in <span className="accent">under a minute</span>
            </>
          }
          subtitle="One headline score from four fixed parts — presence, citations, entity clarity, and drift."
          steps={AVS_STEPS}
        />
      </main>

      <Footer />
      <PageScripts />
    </div>
  )
}

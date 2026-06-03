'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent, type RefObject } from 'react'
import './page-styles.css'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { EmailGate } from '@/components/mini-apps/EmailGate'
import { SubmitOnce } from '@/components/mini-apps/SubmitOnce'
import type { AVSApiResponse, AVSResult } from '@/app/api/mini-apps/ai-visibility-score/route'
import { PageScripts } from './PageScripts'

type AppState = 'idle' | 'loading' | 'result' | 'error'

const DOMAIN_RE = /^([a-z0-9-]+\.)+[a-z]{2,}$/i
const STAGE_MS = 5000
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

function AvsShareableBlock({
  result,
  captureRef,
}: {
  result: AVSResult
  captureRef?: RefObject<HTMLDivElement | null>
}) {
  return (
    <div ref={captureRef} className="shareable-block">
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
  const shareableRef = useRef<HTMLDivElement | null>(null)
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

  const captureShareable = useCallback(async () => {
    const el = shareableRef.current
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
    if (!result) return
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
    if (!result) return
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

  return (
    <div className="ai-visibility-score pricing-diag">
      <div className="bg-layer bg-aurora">
        <div className="blob3" />
      </div>
      <div className="bg-layer bg-dots" />
      <div className="bg-layer bg-vignette" />
      <div className="bg-layer bg-spotlight" id="avs-spotlight" />
      <div className="bg-layer bg-grain" />

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
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />

            {appState !== 'idle' && (
              <div className="panel-readouts">
                <div className="prl">
                  <span>
                    <span className="stat-key">sys</span>{' '}
                    <span className="stat-val">{sysState}</span>
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
              <section className={`pd-state${appState === 'idle' ? 'active' : ''}`}>
                <div className="idle-label">Enter your domain</div>
                <form
                  key={shakeKey}
                  className={`url-input${domainError ? 'error' : ''}`}
                  noValidate
                  onSubmit={handleSubmit}
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
                  <button type="submit" aria-label="Get score" disabled={submitting}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="M13 5l7 7-7 7" />
                    </svg>
                  </button>
                </form>
                <div className={`helper${domainError ? 'error' : ''}`}>
                  <span>
                    {domainError ??
                      'Press enter or the arrow — scores presence, citations, entity & drift.'}
                  </span>
                </div>
              </section>

              <section className={`pd-state${appState === 'loading' ? 'active' : ''}`}>
                <div className="progress-track">
                  <div className="progress-bar" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="loading-header">
                  <span>
                    Scoring <strong>{normalizeDomainInput(domain) || 'domain'}</strong>
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
                        className={`stage${isActive ? 'active' : ''}${isDone ? 'done' : ''}`}
                      >
                        <div className="stage-num-row">
                          <span>{s.num}</span>
                        </div>
                        <div className="stage-title">{s.title}</div>
                        <div className="stage-log">{stageLogs[i]}</div>
                      </div>
                    )
                  })}
                </div>
              </section>

              <section className={`pd-state${appState === 'result' ? 'active' : ''}`}>
                {result && (
                  <EmailGate
                    miniAppSlug="ai-visibility-score"
                    pattern="after-teaser"
                    initialInput={leadInput}
                    teaser={<AvsShareableBlock result={result} />}
                  >
                    {({ submitToApi }) => (
                      <>
                        <SubmitOnce submit={submitToApi} input={leadInput} output={result} />
                        <AvsShareableBlock result={result} captureRef={shareableRef} />
                        <div className="short-read-block">
                          <div className="section-header">
                            {"// what's dragging your score down"}
                          </div>
                          <p className="biggest-drag">
                            <span>{result.biggest_drag.sub_score}</span> — {result.biggest_drag.why}
                          </p>
                          {result.short_read.map((item) => (
                            <div key={item.sub_score} className="short-read-item">
                              <h4>{item.sub_score}</h4>
                              <p>{item.diagnosis}</p>
                            </div>
                          ))}
                        </div>
                        <div className="result-footer">
                          <span className="token-pill">
                            {(result.tokens_in + result.tokens_out).toLocaleString()} tokens
                          </span>
                          <span className="result-ts hide-sm">{resultTs}</span>
                          <div className="export-actions">
                            <button
                              type="button"
                              className={`export-btn${exportState === 'copying' ? 'done' : ''}`}
                              onClick={async () => {
                                setExportState('copying')
                                await navigator.clipboard.writeText(buildPlainText(result))
                                setTimeout(() => setExportState('idle'), 900)
                              }}
                            >
                              Copy
                            </button>
                            <button
                              type="button"
                              className={`export-btn${exportState === 'png' ? 'loading' : ''}`}
                              onClick={() => void handleDownloadPng()}
                            >
                              PNG
                            </button>
                            <button
                              type="button"
                              className={`export-btn${exportState === 'pdf' ? 'loading' : ''}`}
                              onClick={() => void handleDownloadPdf()}
                            >
                              PDF
                            </button>
                            <button type="button" className="run-again" onClick={handleReset}>
                              Score another
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </EmailGate>
                )}
              </section>

              <section className={`pd-state error-state${appState === 'error' ? 'active' : ''}`}>
                <h2 className="err-title">Score failed</h2>
                <p className="err-msg">{errorMsg}</p>
                <button type="button" className="err-btn" onClick={handleReset}>
                  Try again
                </button>
              </section>
            </div>
          </div>
        </div>

        <section className="how-it-works">
          <div className="hiw-head">
            <span className="hiw-eyebrow">How it works</span>
            <h2>
              How the <span className="accent">AI Visibility Score</span> works
            </h2>
            <p>
              One headline number from four fixed parts — presence, citations, entity clarity, and
              drift.
            </p>
          </div>
          <ol className="hiw-steps">
            <li className="hiw-step" data-side="left">
              <div className="hiw-rail">
                <span className="hiw-dot" />
              </div>
              <div className="hiw-card">
                <span className="hiw-step-label">Step 01</span>
                <div className="hiw-card-row">
                  <div className="hiw-icon" aria-hidden>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="M7 9h10" />
                    </svg>
                  </div>
                  <div className="hiw-text">
                    <h3>Enter your domain</h3>
                    <p>We infer your brand and category, then frame buyer-intent questions.</p>
                  </div>
                </div>
              </div>
            </li>
            <li className="hiw-step" data-side="right">
              <div className="hiw-rail">
                <span className="hiw-dot" />
              </div>
              <div className="hiw-card">
                <span className="hiw-step-label">Step 02</span>
                <div className="hiw-card-row">
                  <div className="hiw-icon" aria-hidden>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <circle cx="12" cy="12" r="8" />
                      <path d="M8 12h8M12 8v8" />
                    </svg>
                  </div>
                  <div className="hiw-text">
                    <h3>We ask the AIs</h3>
                    <p>
                      Claude plus optional ChatGPT, Perplexity, and Google AI Overview — coverage
                      shown honestly on each sub-score.
                    </p>
                  </div>
                </div>
              </div>
            </li>
            <li className="hiw-step" data-side="left">
              <div className="hiw-rail">
                <span className="hiw-dot" />
              </div>
              <div className="hiw-card">
                <span className="hiw-step-label">Step 03</span>
                <div className="hiw-card-row">
                  <div className="hiw-icon" aria-hidden>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M4 6h16M4 12h10M4 18h6" />
                    </svg>
                  </div>
                  <div className="hiw-text">
                    <h3>Four sub-scores, one AVS</h3>
                    <p>
                      Presence 35%, Citations 30%, Entity Clarity 20%, Drift 15% — fixed
                      methodology.
                    </p>
                  </div>
                </div>
              </div>
            </li>
            <li className="hiw-step" data-side="right">
              <div className="hiw-rail">
                <span className="hiw-dot" />
              </div>
              <div className="hiw-card">
                <span className="hiw-step-label">Step 04</span>
                <div className="hiw-card-row">
                  <div className="hiw-icon" aria-hidden>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M12 3v18M3 12h18" />
                    </svg>
                  </div>
                  <div className="hiw-text">
                    <h3>Unlock the short read</h3>
                    <p>
                      See your AVS and four parts free; email unlocks what is dragging the score
                      down.
                    </p>
                  </div>
                </div>
              </div>
            </li>
          </ol>
        </section>
      </main>

      <Footer />
      <PageScripts />
    </div>
  )
}

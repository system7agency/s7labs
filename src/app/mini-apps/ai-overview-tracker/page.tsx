'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import './page-styles.css'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { EmailGate } from '@/components/mini-apps/EmailGate'
import type { KeywordStatus, ScanApiResponse, ScanFree, ScanGated } from '@/lib/mini-apps/aio-types'
import { parseScanApiResponse } from '@/lib/mini-apps/aio-types'
import { GatedBreakdown } from './GatedBreakdown'
import { PageScripts } from './PageScripts'

type AppState = 'idle' | 'loading' | 'result' | 'error'

const DOMAIN_RE = /^([a-z0-9-]+\.)+[a-z]{2,}$/i
const STAGE_MS = 5000
const MAX_KEYWORDS = 5
const STAGES = [
  {
    num: '01',
    title: 'Running the searches',
    logs: ['querying Google', 'pulling each keyword', 'capturing the SERPs'],
  },
  {
    num: '02',
    title: 'Finding the AI Overviews',
    logs: ['detecting AI answers', 'reading the citations', 'matching your domain'],
  },
  {
    num: '03',
    title: "Checking who's cited",
    logs: ['listing the sources', 'spotting the leaders', 'finding your gaps'],
  },
  {
    num: '04',
    title: 'Scoring visibility',
    logs: ['trigger rate', 'citation rate', 'verdict ready'],
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

function keywordsFromText(value: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const line of value.split('\n')) {
    const k = line.trim()
    if (!k) continue
    const key = k.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(k)
  }
  return out
}

function statusLabel(status: KeywordStatus): string {
  if (status === 'blind_spot') return 'Blind spot'
  if (status === 'no_aio') return 'No AI Overview'
  if (status === 'error') return 'Error'
  if (status === 'ghost') return 'Ghost'
  return 'Cited'
}

function fmtTs(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `AIO · ${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} · ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`
}

function buildPlainText(free: ScanFree, gated: ScanGated | null): string {
  const lines = [
    `AI Overview Tracker — ${free.domain}`,
    `Location: ${free.location}`,
    '='.repeat(60),
    '',
    free.one_liner,
    '',
    `Citation rate: ${free.citation_rate}%`,
    `AIO trigger rate: ${free.aio_trigger_rate}%`,
    `Blind spots: ${free.blind_spot_count}`,
    `Ghost keywords: ${free.ghost_count}`,
    '',
    '// KEYWORDS',
    ...free.keyword_statuses.map((k) => `  ${k.keyword}: ${statusLabel(k.status)}`),
  ]
  if (gated) {
    lines.push('', '// CITATION LEADERS')
    gated.citation_leaders.forEach((l) => lines.push(`  ${l.domain}: ${l.appearances}`))
    lines.push('', '// RECOMMENDATIONS')
    gated.recommendations.forEach((r, i) => lines.push(`  ${i + 1}. ${r}`))
    lines.push('', `Tokens: ${(gated.tokens_in + gated.tokens_out).toLocaleString()}`)
  }
  return lines.join('\n')
}

export default function AiOverviewTrackerPage() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [domain, setDomain] = useState('')
  const [keywordsText, setKeywordsText] = useState('')
  const [location, setLocation] = useState('United States')
  const [domainError, setDomainError] = useState<string | null>(null)
  const [keywordsError, setKeywordsError] = useState<string | null>(null)
  const [shakeInput, setShakeInput] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [scanId, setScanId] = useState<string | null>(null)
  const [free, setFree] = useState<ScanFree | null>(null)
  const [gated, setGated] = useState<ScanGated | null>(null)
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

  const parsedKeywords = useMemo(() => keywordsFromText(keywordsText), [keywordsText])

  const leadInput = useMemo(
    () => ({
      domain: normalizeDomainInput(domain),
      keywords: parsedKeywords,
      location,
    }),
    [domain, parsedKeywords, location]
  )

  const handleGatedLoaded = useCallback((data: ScanGated) => {
    setGated(data)
  }, [])

  const handleTokens = useCallback((t: { in: number; out: number }) => {
    setTokens(t)
  }, [])

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

      const normalizedDomain = normalizeDomainInput(domain)
      const keywords = keywordsFromText(keywordsText).slice(0, MAX_KEYWORDS)
      const domainInvalid = !DOMAIN_RE.test(normalizedDomain)
      const keywordInvalid = keywords.length === 0
      setDomainError(domainInvalid ? 'Enter a valid domain.' : null)
      setKeywordsError(keywordInvalid ? 'Enter at least one keyword.' : null)
      if (domainInvalid || keywordInvalid) {
        setShakeInput((k) => k + 1)
        return
      }

      setSubmitting(true)
      setScanId(null)
      setFree(null)
      setGated(null)
      setErrorMsg('')
      setTokens(null)
      setAppState('loading')
      setSysState('running')
      startLoadingAnimation()

      let data: ScanApiResponse
      try {
        const res = await fetch('/api/mini-apps/ai-overview-tracker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: normalizedDomain, keywords, location }),
        })
        data = parseScanApiResponse(await res.json())
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
        setScanId(data.scanId)
        setFree(data.free)
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
    [submitting, domain, keywordsText, location, startLoadingAnimation, clearTimers]
  )

  const handleReset = useCallback(() => {
    clearTimers()
    setAppState('idle')
    setFree(null)
    setGated(null)
    setScanId(null)
    setErrorMsg('')
    setSubmitting(false)
    setSysState('idle')
    setLatency('—')
    setTokens(null)
  }, [clearTimers])

  const captureShareable = useCallback(async () => {
    if (!shareableRef.current) return null
    const { default: html2canvas } = await import('html2canvas')
    return html2canvas(shareableRef.current, {
      backgroundColor: '#101014',
      scale: 2,
      useCORS: true,
      logging: false,
    })
  }, [])

  return (
    <div className="share-of-voice ai-overview-tracker">
      <div className="bg-layer bg-aurora">
        <div className="blob3" />
      </div>
      <div className="bg-layer bg-dots" />
      <div className="bg-layer bg-vignette" />
      <div className="bg-layer bg-spotlight" id="aot-spotlight" />
      <div className="bg-layer bg-grain" />
      <Header />
      <main className="shell">
        <section className="hero">
          <span className="eyebrow">AI Overview Tracker</span>
          <h1>
            Track AI citation visibility, <span className="accent">not rank positions</span>
          </h1>
          <p>
            See which keywords trigger Google AI Overviews, who gets cited, and where your brand is
            missing from the AI answer.
          </p>
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
              </div>
              <div className="prr">
                {tokens && (
                  <span className="hide-sm">
                    <span className="stat-key">tok</span>{' '}
                    <span className="stat-val">{(tokens.in + tokens.out).toLocaleString()}</span>
                  </span>
                )}
                <span className="pr-sep hide-sm" />
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
              <section className={`sov-state${appState === 'idle' ? 'active' : ''}`}>
                <div className="idle-label">Not a rank tracker — this checks AI citations</div>
                <form noValidate onSubmit={handleSubmit}>
                  <div className="input-field">
                    <label>Your domain</label>
                    <div
                      key={`d-${shakeInput}`}
                      className={`input-box${domainError ? 'error' : ''}`}
                    >
                      <span className="prompt">@</span>
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
                  <div className="input-field">
                    <label>Keywords to check (up to 5)</label>
                    <div className={`textarea-box${keywordsError ? 'error' : ''}`}>
                      <span className="prompt">#</span>
                      <textarea
                        placeholder={
                          'best crm for agencies\nai seo agency\nsales automation consultant'
                        }
                        value={keywordsText}
                        disabled={submitting}
                        onChange={(e) => {
                          const next = e.target.value
                          const rows = keywordsFromText(next)
                          setKeywordsText(rows.slice(0, MAX_KEYWORDS).join('\n'))
                          if (keywordsError) setKeywordsError(null)
                        }}
                      />
                    </div>
                    <div className="field-helper">
                      The buyer searches you want to win. {parsedKeywords.length}/{MAX_KEYWORDS}
                    </div>
                    {keywordsError && <div className="field-error">{keywordsError}</div>}
                  </div>
                  <div className="input-field">
                    <label>Market</label>
                    <select value={location} onChange={(e) => setLocation(e.target.value)}>
                      <option>United States</option>
                      <option>United Kingdom</option>
                      <option>Canada</option>
                      <option>Australia</option>
                      <option>India</option>
                    </select>
                  </div>
                  <div className="submit-row">
                    <button type="submit" className="submit-btn" disabled={submitting}>
                      Check my AI Overview visibility
                    </button>
                  </div>
                </form>
              </section>
              <section className={`sov-state${appState === 'loading' ? 'active' : ''}`}>
                <div className="progress-track">
                  <div className="progress-bar" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="loading-header">
                  <span>Checking AI Overviews</span>
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
              <section className={`sov-state${appState === 'result' ? 'active' : ''}`}>
                {free && scanId && (
                  <EmailGate
                    miniAppSlug="ai-overview-tracker"
                    pattern="after-teaser"
                    initialInput={leadInput}
                    teaser={
                      <div ref={shareableRef} className="shareable-block">
                        <div className="one-liner-block">
                          <p className="one-liner-text">&ldquo;{free.one_liner}&rdquo;</p>
                          <div className="one-liner-meta">
                            <span className="project-name">{free.domain}</span>
                            <span className="type-pill">{free.verdict_label}</span>
                          </div>
                        </div>
                        <div className="score-row">
                          <div className="score-card">
                            <div className="sc-label">Citation rate</div>
                            <div className="sc-value">
                              <span className="sc-big">{free.citation_rate}%</span>
                            </div>
                            <div className="sc-delta">
                              {free.aio_trigger_rate}% of your keywords trigger an AI Overview
                            </div>
                          </div>
                          <div className="score-card">
                            <div className="sc-label">Gap snapshot</div>
                            <div className="stat-grid">
                              <div>
                                <span>Keywords</span>
                                <strong>{free.keywords_scored}</strong>
                              </div>
                              <div>
                                <span>AI Overviews</span>
                                <strong>
                                  {Math.round((free.keywords_scored * free.aio_trigger_rate) / 100)}
                                </strong>
                              </div>
                              <div>
                                <span>Blind spots</span>
                                <strong>{free.blind_spot_count}</strong>
                              </div>
                              <div>
                                <span>Ghosts</span>
                                <strong>{free.ghost_count}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="keyword-strip">
                          {(free.keyword_statuses ?? []).map((k) => (
                            <div key={k.keyword} className="keyword-row">
                              <span className="keyword-label">{k.keyword}</span>
                              <span className={`status-pill is-${k.status}`}>
                                {statusLabel(k.status)}
                              </span>
                            </div>
                          ))}
                        </div>
                        {free.top_cited_competitor && (
                          <div className="hook-line">
                            {free.top_cited_competitor.domain} is cited in{' '}
                            {free.top_cited_competitor.appearances} of your keywords.
                          </div>
                        )}
                      </div>
                    }
                  >
                    {({ submitToApi }) => (
                      <>
                        <GatedBreakdown
                          scanId={scanId}
                          free={free}
                          leadInput={leadInput}
                          submitToApi={submitToApi}
                          onTokens={handleTokens}
                          onGatedLoaded={handleGatedLoaded}
                        />
                        <div className="result-footer">
                          <span className="token-pill">
                            {tokens
                              ? `${(tokens.in + tokens.out).toLocaleString()} tokens`
                              : 'Loading…'}
                          </span>
                          <span className="result-ts hide-sm">{resultTs}</span>
                          <div className="export-actions">
                            <button
                              className={`export-btn${exportState === 'copying' ? 'done' : ''}`}
                              onClick={async () => {
                                setExportState('copying')
                                await navigator.clipboard.writeText(buildPlainText(free, gated))
                                setTimeout(() => setExportState('idle'), 900)
                              }}
                            >
                              Copy
                            </button>
                            <button
                              className={`export-btn${exportState === 'png' ? 'loading' : ''}`}
                              onClick={async () => {
                                setExportState('png')
                                const canvas = await captureShareable()
                                if (canvas) {
                                  const a = document.createElement('a')
                                  a.download = `aio-${free.domain}.png`
                                  a.href = canvas.toDataURL('image/png')
                                  a.click()
                                }
                                setExportState('idle')
                              }}
                            >
                              PNG
                            </button>
                            <button
                              className={`export-btn${exportState === 'pdf' ? 'loading' : ''}`}
                              onClick={async () => {
                                setExportState('pdf')
                                const canvas = await captureShareable()
                                if (canvas) {
                                  const { jsPDF } = await import('jspdf')
                                  const imgW = 190
                                  const imgH = (canvas.height / canvas.width) * imgW
                                  const pdf = new jsPDF({
                                    orientation: imgH > imgW ? 'portrait' : 'landscape',
                                    unit: 'mm',
                                  })
                                  pdf.addImage(
                                    canvas.toDataURL('image/png'),
                                    'PNG',
                                    10,
                                    10,
                                    imgW,
                                    imgH
                                  )
                                  pdf.save(`aio-${free.domain}.pdf`)
                                }
                                setExportState('idle')
                              }}
                            >
                              PDF
                            </button>
                            <button className="run-again" type="button" onClick={handleReset}>
                              Check again
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </EmailGate>
                )}

                {free && (
                  <div className="result-actions-pre-gate">
                    <button
                      className="run-again run-again-ghost"
                      type="button"
                      onClick={handleReset}
                    >
                      Check again
                    </button>
                  </div>
                )}
              </section>
              <section className={`sov-state error-state${appState === 'error' ? 'active' : ''}`}>
                <h2 className="err-title">Scan failed</h2>
                <p className="err-msg">{errorMsg}</p>
                <button className="err-btn" type="button" onClick={handleReset}>
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
              From keywords to citation gaps in <span className="accent">under a minute</span>
            </h2>
            <p>
              No login. Paste your domain and buyer keywords — we check live Google results for AI
              Overviews and who gets cited.
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
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="M7 9h10M7 13h6" />
                    </svg>
                  </div>
                  <div className="hiw-text">
                    <h3>Add your domain and keywords</h3>
                    <p>Up to five buyer searches you care about, plus your target market.</p>
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
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="M20 20l-3-3" />
                    </svg>
                  </div>
                  <div className="hiw-text">
                    <h3>We run live Google searches</h3>
                    <p>
                      Each keyword is queried with AI Overview detection — not a rank position
                      report.
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
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 19V5l8 4 8-4v14" />
                      <path d="M12 9v10" />
                    </svg>
                  </div>
                  <div className="hiw-text">
                    <h3>See your free snapshot</h3>
                    <p>
                      Citation rate, AI Overview trigger rate, blind spots, and a per-keyword status
                      strip — before you share your email.
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
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 3v18M3 12h18" />
                    </svg>
                  </div>
                  <div className="hiw-text">
                    <h3>Unlock the full breakdown</h3>
                    <p>
                      Every cited domain per keyword, citation leaders, and three ways to start
                      getting cited in AI answers.
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

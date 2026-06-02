'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import './page-styles.css'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import type { KeywordStatus, ScanApiResponse, ScanFree, ScanGated } from '@/lib/mini-apps/aio-types'
import { parseUnlockApiResponse } from '@/lib/mini-apps/aio-types'
import { PageScripts } from './PageScripts'

type AppState = 'idle' | 'loading' | 'result' | 'error'
type ResultView = 'locked' | 'unlocked'

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
  const [resultView, setResultView] = useState<ResultView>('locked')
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
  const [unlockEmail, setUnlockEmail] = useState('')
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [unlocking, setUnlocking] = useState(false)
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
      setResultView('locked')
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
        data = (await res.json()) as ScanApiResponse
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

  const handleUnlock = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (!scanId || unlocking) return
      const email = unlockEmail.trim().toLowerCase()
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        setUnlockError('Enter a valid email.')
        return
      }
      setUnlockError(null)
      setUnlocking(true)
      try {
        const res = await fetch('/api/mini-apps/ai-overview-tracker/unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scanId, email }),
        })
        const parsed = parseUnlockApiResponse(await res.json())
        if (parsed.ok) {
          setGated(parsed.data)
          setTokens({ in: parsed.data.tokens_in, out: parsed.data.tokens_out })
          setResultView('unlocked')
        } else {
          setUnlockError(parsed.message)
        }
      } catch {
        setUnlockError('Network error. Please try again.')
      }
      setUnlocking(false)
    },
    [scanId, unlockEmail, unlocking]
  )

  const handleReset = useCallback(() => {
    clearTimers()
    setAppState('idle')
    setResultView('locked')
    setFree(null)
    setGated(null)
    setScanId(null)
    setErrorMsg('')
    setUnlockEmail('')
    setUnlockError(null)
    setSubmitting(false)
    setUnlocking(false)
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
                {free && (
                  <>
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
                        {free.keyword_statuses.map((k) => (
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

                    {resultView === 'locked' && (
                      <div className="gate-block">
                        <div className="gate-preview" aria-hidden>
                          <div className="gate-preview-fake">
                            <div className="gate-fake-row" />
                            <div className="gate-fake-row" />
                            <div className="gate-fake-row" />
                          </div>
                        </div>
                        <div className="gate-card">
                          <h3 className="gate-title">
                            See exactly who&apos;s getting cited instead of you
                          </h3>
                          <p className="gate-sub">
                            Get the full per-keyword breakdown — every domain cited in each AI
                            Overview — plus 3 ways to start getting cited. We found{' '}
                            {free.blind_spot_count} blind spots.
                          </p>
                          <form noValidate onSubmit={handleUnlock} className="gate-form">
                            <div
                              className={`input-box gate-email-box${unlockError ? 'error' : ''}`}
                            >
                              <input
                                type="email"
                                placeholder="you@company.com"
                                value={unlockEmail}
                                disabled={unlocking}
                                onChange={(e) => setUnlockEmail(e.target.value)}
                              />
                            </div>
                            {unlockError && <div className="field-error">{unlockError}</div>}
                            <button
                              type="submit"
                              className="submit-btn gate-submit"
                              disabled={unlocking}
                            >
                              {unlocking ? 'Unlocking…' : 'Unlock the full breakdown'}
                            </button>
                          </form>
                        </div>
                      </div>
                    )}

                    {resultView === 'unlocked' && gated && (
                      <>
                        <div className="section-header">
                          <span>{'// per-keyword breakdown'}</span>
                        </div>
                        <div className="keyword-cards">
                          {gated.keywords.map((k) => (
                            <article key={k.keyword} className={`keyword-card is-${k.status}`}>
                              <div className="keyword-card-head">
                                <h4>{k.keyword}</h4>
                                <span className={`status-pill is-${k.status}`}>
                                  {statusLabel(k.status)}
                                </span>
                              </div>
                              {k.status === 'ghost' && (
                                <p className="ghost-note">
                                  You rank organically for this keyword, but the AI answer does not
                                  cite you.
                                </p>
                              )}
                              <div className="sources-list">
                                {k.sources.length > 0 ? (
                                  k.sources.map((s) => (
                                    <div
                                      key={`${k.keyword}-${s.url}`}
                                      className={`source-row${s.domain === free.domain ? 'is-you' : ''}`}
                                    >
                                      <span className="source-domain">{s.domain}</span>
                                      <span className="source-title">{s.title}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="source-row is-missing">
                                    No citation sources captured.
                                  </div>
                                )}
                              </div>
                            </article>
                          ))}
                        </div>
                        <div className="section-header">
                          <span>{'// who keeps getting cited'}</span>
                        </div>
                        <div className="leaders-list">
                          {gated.citation_leaders.map((l, i) => (
                            <div key={l.domain} className="leader-row">
                              <span className="leader-rank">{String(i + 1).padStart(2, '0')}</span>
                              <span className="leader-domain">{l.domain}</span>
                              <span className="leader-app">{l.appearances}</span>
                            </div>
                          ))}
                        </div>
                        <div className="reco-block">
                          <div className="plan-eyebrow">{'// how to start getting cited'}</div>
                          <ol className="plan-list">
                            {gated.recommendations.map((r, i) => (
                              <li key={r} className="plan-row">
                                <span className="reco-number">
                                  {String(i + 1).padStart(2, '0')}
                                </span>
                                <div className="plan-body">{r}</div>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </>
                    )}

                    <div className="result-footer">
                      <span className="token-pill">
                        {tokens
                          ? `${(tokens.in + tokens.out).toLocaleString()} tokens`
                          : 'Unlock for token usage'}
                      </span>
                      <span className="result-ts hide-sm">{resultTs}</span>
                      <div className="export-actions">
                        <button
                          className={`export-btn${exportState === 'copying' ? 'done' : ''}`}
                          onClick={async () => {
                            if (!free) return
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
                            if (!free) return
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
                            if (!free) return
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
                              pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, imgW, imgH)
                              pdf.save(`aio-${free.domain}.pdf`)
                            }
                            setExportState('idle')
                          }}
                        >
                          PDF
                        </button>
                        <button className="run-again" onClick={handleReset}>
                          Check again
                        </button>
                      </div>
                    </div>
                  </>
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
      </main>
      <Footer />
      <PageScripts />
    </div>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { clsx } from 'clsx'
import './page-styles.css'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { InlineConsentField } from '@/components/mini-apps/InlineConsentField'
import { EMAIL_REGEX } from '@/lib/leads/disposable'
import { HowItWorks, type HowItWorksStep } from '@/components/mini-apps/HowItWorks'
import type { ApiResponse, RoastResult } from '@/app/api/mini-apps/website-roast/route'
import { PageScripts } from './PageScripts'
import { WebsiteRoastResult, buildWebsiteRoastPlainText } from './components/WebsiteRoastResult'

type AppState = 'idle' | 'loading' | 'result' | 'error'

const ROAST_STEPS: HowItWorksStep[] = [
  {
    title: 'Paste any website URL',
    description:
      'Yours, a competitor’s, or any public page. We support marketing sites, SaaS landings, and product pages.',
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
    title: 'We scrape the page and pull Lighthouse scores',
    description:
      'Firecrawl extracts real content; PageSpeed Insights runs in parallel. Failures don’t block the roast.',
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
    title: 'AI roasts six honest categories',
    description:
      'Copy, CTAs, SEO, mobile UX, performance, and trust, each with a score, a roast, and a specific quick fix.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2v6" />
        <path d="M12 22a8 8 0 008-8c0-4-2-7-4-9 0 3-2 4-4 4s-3 1-3 3 1 3 3 3-1 2-3 2a5 5 0 105 5z" />
      </svg>
    ),
  },
  {
    title: 'Get your overall grade and top 3 fixes',
    description:
      'A friction-style score, a one-liner verdict, and the highest-impact changes ranked first: specific actions, not advice.',
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
    title: 'Fetching the site',
    logs: ['requesting URL', 'scraping content', 'page loaded'],
  },
  {
    num: '02',
    title: 'Running Lighthouse',
    logs: ['performance check', 'SEO scan', 'scores ready'],
  },
  {
    num: '03',
    title: 'Reading the copy',
    logs: ['analysing headings', 'scanning CTAs', 'trust signals checked'],
  },
  {
    num: '04',
    title: 'Writing the roast',
    logs: ['judging harshly', 'finding fixes', 'roast complete'],
  },
]
const STAGE_MS = 5000

function fmtTs(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `ROAST · ${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} · ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`
}

export default function WebsiteRoastPage() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)
  const [shakeInput, setShakeInput] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<RoastResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [resultTs, setResultTs] = useState('')
  const [exportState, setExportState] = useState<'idle' | 'copying' | 'png' | 'pdf'>('idle')
  const [tokens, setTokens] = useState<{ in: number; out: number } | null>(null)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [marketingConsent, setMarketingConsent] = useState(true)
  const [shakeEmail, setShakeEmail] = useState(0)

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

      let valid = true
      const trimmed = url.trim()
      if (!trimmed || !/^https:\/\/.+/i.test(trimmed)) {
        setUrlError('Enter a valid URL starting with https://')
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

      setUrlError(null)
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
            miniAppSlug: 'website-roast',
            marketingConsent,
            input: { url: trimmed },
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
      const host = trimmed.replace(/^https?:\/\//, '').split('/')[0] ?? trimmed
      startLoadingAnimation(host)

      let data: ApiResponse
      try {
        const res = await fetch('/api/mini-apps/website-roast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed }),
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
        setResultTs(fmtTs(new Date()))
        setSysState('complete')
        setAppState('result')

        fetch('/api/leads/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            submissionId,
            output: data.data,
            ...(data.cost ? { cost: data.cost } : {}),
          }),
        }).catch((err) => console.error('[website-roast] leads/complete', err))
      } else {
        setErrorMsg(data.message)
        setSysState('error')
        setAppState('error')
        fetch('/api/leads/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            submissionId,
            status: 'failed',
            errorMessage: data.message?.slice(0, 500),
          }),
        }).catch((err) => console.error('[website-roast] leads/complete fail', err))
      }
      setSubmitting(false)
    },
    [url, email, marketingConsent, submitting, startLoadingAnimation, clearTimers]
  )

  const handleReset = useCallback(() => {
    clearTimers()
    setAppState('idle')
    setResult(null)
    setErrorMsg('')
    setUrlError(null)
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
      await navigator.clipboard.writeText(buildWebsiteRoastPlainText(result))
    } catch {
      const ta = document.createElement('textarea')
      ta.value = buildWebsiteRoastPlainText(result)
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
      a.download = `roast-${result.site_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`
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
      pdf.save(`roast-${result.site_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`)
    } catch (e) {
      console.error(e)
    }
    setExportState('idle')
  }, [result])

  return (
    <div className="website-roast">
      <AuroraBackground />

      <Header />

      <main className="shell">
        <section className="hero">
          <span className="eyebrow">Website Roast Bot</span>
          <h1>
            Drop a URL. <span className="accent">Get roasted.</span>
          </h1>
          <p>
            Brutally honest feedback on copy, CTAs, SEO, mobile UX, and trust signals, backed by
            real Google Lighthouse scores.
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
              <section className={clsx('wr-state', { active: appState === 'idle' })}>
                <div className="idle-label">Drop a URL and get roasted</div>
                <form noValidate onSubmit={handleSubmit} autoComplete="off">
                  <div className="input-field">
                    <label>Website URL</label>
                    <div key={`u-${shakeInput}`} className={clsx('input-box', { error: urlError })}>
                      <input
                        ref={urlInputRef}
                        type="url"
                        placeholder="https://yoursite.com"
                        value={url}
                        disabled={submitting}
                        onChange={(e) => {
                          setUrl(e.target.value)
                          if (urlError) setUrlError(null)
                        }}
                      />
                    </div>
                    {urlError && <div className="field-error">{urlError}</div>}
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
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                      Roast this site
                    </button>
                  </div>
                </form>
              </section>

              <section className={clsx('wr-state', { active: appState === 'loading' })}>
                <div className="progress-track">
                  <div className="progress-bar" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="loading-header">
                  <span>
                    Roasting <strong>{loadingLabel}</strong>
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

              <section className={clsx('wr-state', { active: appState === 'result' })}>
                {result && (
                  <>
                    <div ref={resultPanelRef}>
                      <WebsiteRoastResult bare input={{ url: result.url }} output={result} />
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
                          className={clsx('export-btn', { done: exportState === 'copying' })}
                          type="button"
                          onClick={handleCopy}
                          disabled={exportState !== 'idle'}
                        >
                          {exportState === 'copying' ? 'Copied' : 'Copy'}
                        </button>
                        <button
                          className={clsx('export-btn', { loading: exportState === 'png' })}
                          type="button"
                          onClick={handleDownloadPng}
                          disabled={exportState !== 'idle'}
                        >
                          {exportState === 'png' ? '…' : 'PNG'}
                        </button>
                        <button
                          className={clsx('export-btn', { loading: exportState === 'pdf' })}
                          type="button"
                          onClick={handleDownloadPdf}
                          disabled={exportState !== 'idle'}
                        >
                          {exportState === 'pdf' ? '…' : 'PDF'}
                        </button>
                        <button className="run-again" type="button" onClick={handleReset}>
                          Roast another
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
                className={clsx('wr-state', 'error-state', { active: appState === 'error' })}
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
                <h2 className="err-title">Roast failed</h2>
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
              From URL to roast in <span className="accent">under a minute</span>
            </>
          }
          subtitle="No login, no install. Four steps from paste to ranked fixes."
          steps={ROAST_STEPS}
        />
      </main>

      <Footer />
      <PageScripts />
    </div>
  )
}

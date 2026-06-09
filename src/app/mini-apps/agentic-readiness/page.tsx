'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { clsx } from 'clsx'
import './page-styles.css'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { InlineConsentField } from '@/components/mini-apps/InlineConsentField'
import { EMAIL_REGEX } from '@/lib/leads/disposable'
import { HowItWorks, type HowItWorksStep } from '@/components/mini-apps/HowItWorks'
import type {
  CheckStatus,
  Grade,
  ScanApiResponse,
  ScanFree,
  ScanGated,
} from '@/lib/mini-apps/agentic-types'
import { GatedBreakdown } from './GatedBreakdown'
import { PageScripts } from './PageScripts'

type AppState = 'idle' | 'loading' | 'result' | 'error'

const STAGES = [
  {
    num: '01',
    title: 'Fetching the site',
    logs: ['requesting URL', 'reading the HTML', 'checking robots.txt'],
  },
  {
    num: '02',
    title: 'Looking for structure',
    logs: ['scanning for schema data', 'checking meta tags', 'testing render'],
  },
  {
    num: '03',
    title: 'Thinking like an agent',
    logs: ['can it read the content', 'can it find the actions', 'can it trust the brand'],
  },
  {
    num: '04',
    title: 'Scoring readiness',
    logs: ['grading each check', 'ranking the blockers', 'verdict ready'],
  },
]
const STAGE_MS = 5000

const AGENTIC_STEPS: HowItWorksStep[] = [
  {
    title: 'Enter your site URL',
    description: 'We fetch the page like an agent would: HTML, robots.txt, and render signals.',
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
    title: 'Six readiness checks',
    description:
      'Structured data, content clarity, crawl access, render dependency, actions, and identity, scored for machine use.',
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
  {
    title: 'See blockers free',
    description:
      'Readiness score, grade, and the biggest issues stopping agents from using your site.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    ),
  },
  {
    title: 'Unlock the full checklist',
    description:
      'Every fix, prioritised action plan, and quick wins, gated by email like our other mini-apps.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 118 0v3" />
      </svg>
    ),
  },
]

function fmtTs(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `AGENTIC · ${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} · ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`
}

function normalizeUrlInput(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  let href = trimmed
  if (!/^https?:\/\//i.test(href)) href = `https://${href}`
  try {
    const parsed = new URL(href)
    if (!parsed.hostname.includes('.')) return null
    return parsed.href
  } catch {
    return null
  }
}

function gradeClass(g: Grade): string {
  if (g === 'A' || g === 'B') return 'grade-good'
  if (g === 'C') return 'grade-mid'
  return 'grade-bad'
}

function statusDotClass(s: CheckStatus): string {
  if (s === 'pass') return 'is-pass'
  if (s === 'warn') return 'is-warn'
  return 'is-fail'
}

function buildPlainText(free: ScanFree, gated: ScanGated | null): string {
  const lines = [
    `Agentic Readiness — ${free.site_name}`,
    free.url,
    '='.repeat(60),
    '',
    free.one_liner,
    '',
    `Overall: ${free.overall_score}/100 (${free.overall_grade}) — ${free.readiness_label}`,
    '',
    '// FREE BLOCKERS',
    ...free.free_blockers.map((b) => `  ${b.name}: ${b.finding}`),
    '',
    '// CHECK STATUS',
    ...free.checks_summary.map((c) => `  ${c.name}: ${c.status}`),
  ]
  if (gated) {
    lines.push('', '// FULL CHECKLIST')
    for (const c of gated.checks) {
      lines.push('', `${c.name} — ${c.score}/10 (${c.grade}) [${c.status}]`)
      lines.push(`  ${c.finding}`)
      lines.push(`  Fix: ${c.fix}`)
    }
    lines.push('', '// FIX IN THIS ORDER')
    gated.prioritised_plan.forEach((p) => {
      lines.push(`  ${p.rank}. ${p.action} (${p.effort} effort) — ${p.impact}`)
    })
    lines.push('', '// QUICK WINS', ...gated.quick_wins.map((q) => `  • ${q}`))
    lines.push('', `Tokens: ${(gated.tokens_in + gated.tokens_out).toLocaleString()}`)
  }
  lines.push('', 'Generated by S7 Labs Agentic Readiness Checker')
  return lines.join('\n')
}

function StatusDot({ status }: { status: CheckStatus }) {
  return <span className={`status-dot ${statusDotClass(status)}`} aria-hidden />
}

export default function AgenticReadinessPage() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)
  const [shakeInput, setShakeInput] = useState(0)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [shakeEmail, setShakeEmail] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [scanId, setScanId] = useState<string | null>(null)
  const [free, setFree] = useState<ScanFree | null>(null)
  const [gated, setGated] = useState<ScanGated | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [resultTs, setResultTs] = useState('')
  const [exportState, setExportState] = useState<'idle' | 'copying' | 'png' | 'pdf'>('idle')

  const [activeStage, setActiveStage] = useState(-1)
  const [doneStages, setDoneStages] = useState<number[]>([])
  const [stageLogs, setStageLogs] = useState<string[]>(['', '', '', ''])
  const [progressPct, setProgressPct] = useState(0)
  const [loadingPct, setLoadingPct] = useState('0%')
  const [latency, setLatency] = useState('—')
  const [sysState, setSysState] = useState('idle')
  const [clock, setClock] = useState('—')
  const [tokens, setTokens] = useState<{ in: number; out: number } | null>(null)

  const urlInputRef = useRef<HTMLInputElement | null>(null)
  const shareableRef = useRef<HTMLDivElement | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const rafRef = useRef<number | null>(null)
  const runStartRef = useRef(0)

  const leadInput = useMemo(
    () => ({
      url: free?.url ?? normalizeUrlInput(url) ?? '',
      site_name: free?.site_name ?? '',
    }),
    [free, url]
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
    (host: string) => {
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
      void host
    },
    [clearTimers]
  )

  const submissionIdRef = useRef<string | null>(null)

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (submitting) return

      let valid = true
      const normalized = normalizeUrlInput(url)
      if (!normalized) {
        setUrlError('Enter a valid URL.')
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
      if (!valid || !normalized) return

      setUrlError(null)
      setEmailError(null)
      setSubmitting(true)
      setFree(null)
      setGated(null)
      setScanId(null)
      setErrorMsg('')

      let submissionId: string | null = null
      try {
        const res = await fetch('/api/leads/submit', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email: emailClean,
            miniAppSlug: 'agentic-readiness',
            input: { url: normalized },
            marketingConsent,
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
        submissionIdRef.current = submissionId
      } catch {
        setEmailError("Couldn't save your info. Try again.")
        setShakeEmail((k) => k + 1)
        setSubmitting(false)
        return
      }

      setSysState('running')
      setAppState('loading')
      const host = new URL(normalized).hostname
      startLoadingAnimation(host)

      let data: ScanApiResponse
      try {
        const res = await fetch('/api/mini-apps/agentic-readiness', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: normalized }),
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
        await new Promise((r) => setTimeout(r, 400))
        setScanId(data.scanId)
        setFree(data.free)
        setResultTs(fmtTs(new Date()))
        setSysState('complete')
        setAppState('result')

        const completeBody: Record<string, unknown> = {
          submissionId,
          output: { free: data.free, scanId: data.scanId },
        }
        if (data.cost) completeBody.cost = data.cost
        fetch('/api/leads/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(completeBody),
        }).catch((err) => console.error('[agentic-readiness] leads/complete', err))
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
        }).catch((err) => console.error('[agentic-readiness] leads/complete fail', err))
      }
      setSubmitting(false)
    },
    [url, email, marketingConsent, submitting, startLoadingAnimation, clearTimers]
  )

  const handleReset = useCallback(() => {
    clearTimers()
    setAppState('idle')
    setFree(null)
    setGated(null)
    setScanId(null)
    setErrorMsg('')
    setEmailError(null)
    setSubmitting(false)
    setSysState('idle')
    setLatency('—')
    setTokens(null)
  }, [clearTimers])

  const handleCopy = useCallback(async () => {
    if (!free) return
    setExportState('copying')
    try {
      await navigator.clipboard.writeText(buildPlainText(free, gated))
    } catch {
      const ta = document.createElement('textarea')
      ta.value = buildPlainText(free, gated)
      ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setTimeout(() => setExportState('idle'), 1800)
  }, [free, gated])

  const captureShareable = useCallback(async () => {
    if (!shareableRef.current) return null
    const { default: html2canvas } = await import('html2canvas')
    const capture = html2canvas(shareableRef.current, {
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

  const handleDownloadPng = useCallback(async () => {
    if (!free) return
    setExportState('png')
    try {
      const canvas = await captureShareable()
      if (!canvas) return
      const a = document.createElement('a')
      a.download = `agentic-${free.site_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    } catch (err) {
      console.error('[agentic-readiness] PNG export failed', err)
    } finally {
      setExportState('idle')
    }
  }, [free, captureShareable])

  const handleDownloadPdf = useCallback(async () => {
    if (!free) return
    setExportState('pdf')
    try {
      const canvas = await captureShareable()
      if (!canvas) return
      const { jsPDF } = await import('jspdf')
      const imgW = 190
      const imgH = (canvas.height / canvas.width) * imgW
      const pdf = new jsPDF({ orientation: imgH > imgW ? 'portrait' : 'landscape', unit: 'mm' })
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, imgW, imgH)
      pdf.save(`agentic-${free.site_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`)
    } catch (err) {
      console.error('[agentic-readiness] PDF export failed', err)
    } finally {
      setExportState('idle')
    }
  }, [free, captureShareable])

  const loadingHost = url
    ? (normalizeUrlInput(url)
        ?.replace(/^https?:\/\//, '')
        .split('/')[0] ?? 'site')
    : 'site'

  return (
    <div className="agentic-readiness">
      <AuroraBackground />

      <Header />

      <main className="shell">
        <section className="hero">
          <span className="eyebrow">Agentic Readiness Checker</span>
          <h1>
            Can an AI agent <span className="accent">actually use your site?</span>
          </h1>
          <p>
            We scrape your site like an agent would (structured data, crawl rules, render
            dependency, and machine-readable actions) then score how ready you are for the agentic
            web.
          </p>
          <div className="meta-tags">
            <span>· 6 readiness checks</span>
            <span>· Biggest blockers free</span>
            <span>· Full checklist by email</span>
          </div>
        </section>

        <div className="panel-wrap panel-wrap-wide">
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
              <section className={clsx('ar-state', { active: appState === 'idle' })}>
                <div className="idle-label">Can an AI agent actually use your site?</div>
                <form className="idle-form" noValidate onSubmit={handleSubmit} autoComplete="off">
                  <div className="input-field">
                    <label>Website URL</label>
                    <div key={`u-${shakeInput}`} className={clsx('input-box', { error: urlError })}>
                      <input
                        ref={urlInputRef}
                        type="text"
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
                        <path d="M12 2a4 4 0 014 4v2" />
                        <rect x="4" y="8" width="16" height="12" rx="2" />
                        <path d="M9 14h.01M15 14h.01" />
                      </svg>
                      Check agent readiness
                    </button>
                  </div>
                </form>
              </section>

              <section className={clsx('ar-state', { active: appState === 'loading' })}>
                <div className="progress-track">
                  <div className="progress-bar" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="loading-header">
                  <span>
                    Checking <strong>{loadingHost}</strong>
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

              <section className={clsx('ar-state', { active: appState === 'result' })}>
                {free && scanId && (
                  <>
                    <div ref={shareableRef} className="shareable-block">
                      <div className="one-liner-block">
                        <p className="one-liner-text">&ldquo;{free.one_liner}&rdquo;</p>
                        <div className="one-liner-meta">
                          <span className="project-name">{free.site_name}</span>
                          <span className="type-pill">{free.readiness_label}</span>
                        </div>
                        <p className="estimate-note">{free.url}</p>
                      </div>

                      <div className="score-row">
                        <div
                          className={`score-card overall-card ${gradeClass(free.overall_grade)}`}
                        >
                          <div className="sc-label">Overall readiness</div>
                          <div className="overall-score-row">
                            <span className="overall-score-num">{free.overall_score}</span>
                            <span className="overall-score-denom">/100</span>
                            <span className={`overall-grade ${gradeClass(free.overall_grade)}`}>
                              {free.overall_grade}
                            </span>
                          </div>
                          <div className="sc-delta">{free.readiness_label}</div>
                        </div>
                        <div className="score-card checks-card">
                          <div className="sc-label">6 checks</div>
                          <ul className="checks-list">
                            {free.checks_summary.map((c) => (
                              <li key={c.name} className="checks-list-row">
                                <StatusDot status={c.status} />
                                <span className="checks-list-name">{c.name}</span>
                                <span className={`checks-list-status ${statusDotClass(c.status)}`}>
                                  {c.status}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {free.free_blockers.length > 0 && (
                        <>
                          <div className="section-header">
                            <span>{'// biggest blockers'}</span>
                          </div>
                          <div className="blockers-list">
                            {free.free_blockers.map((b) => (
                              <div key={b.name} className="blocker-row">
                                <div className="blocker-name">{b.name}</div>
                                <p className="blocker-finding">{b.finding}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <GatedBreakdown
                      scanId={scanId}
                      email={email}
                      free={free}
                      leadInput={leadInput}
                      submitToApi={async (_input, output) => {
                        const submissionId = submissionIdRef.current
                        if (!submissionId || !output) return
                        try {
                          await fetch('/api/leads/complete', {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({ submissionId, output }),
                          })
                        } catch (err) {
                          console.error('[agentic-readiness] gated leads/complete', err)
                        }
                      }}
                      onTokens={handleTokens}
                      onGatedLoaded={handleGatedLoaded}
                    />
                    <div className="result-footer">
                      <span className="token-pill">
                        {tokens
                          ? `${(tokens.in + tokens.out).toLocaleString()} tokens · ${tokens.in.toLocaleString()} in / ${tokens.out.toLocaleString()} out`
                          : 'Loading…'}
                      </span>
                      <span className="result-ts hide-sm">{resultTs}</span>
                      <div className="export-actions">
                        <button
                          type="button"
                          className={clsx('export-btn', { done: exportState === 'copying' })}
                          onClick={handleCopy}
                          disabled={exportState !== 'idle'}
                        >
                          {exportState === 'copying' ? 'Copied' : 'Copy'}
                        </button>
                        <button
                          type="button"
                          className={clsx('export-btn', { loading: exportState === 'png' })}
                          onClick={() => void handleDownloadPng()}
                          disabled={exportState !== 'idle'}
                        >
                          {exportState === 'png' ? '…' : 'PNG'}
                        </button>
                        <button
                          type="button"
                          className={clsx('export-btn', { loading: exportState === 'pdf' })}
                          onClick={() => void handleDownloadPdf()}
                          disabled={exportState !== 'idle'}
                        >
                          {exportState === 'pdf' ? '…' : 'PDF'}
                        </button>
                        <button type="button" className="run-again" onClick={handleReset}>
                          Check another site
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

                {free && (
                  <div className="result-actions-pre-gate">
                    <button
                      className="run-again run-again-ghost"
                      type="button"
                      onClick={handleReset}
                    >
                      Check another site
                    </button>
                  </div>
                )}
              </section>

              <section
                className={clsx('ar-state', 'error-state', { active: appState === 'error' })}
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
                <h2 className="err-title">Check failed</h2>
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
              From URL to readiness in <span className="accent">under a minute</span>
            </>
          }
          subtitle="Six checks for the agentic web. Blockers free, full checklist and fix plan by email."
          steps={AGENTIC_STEPS}
        />
      </main>

      <Footer />
      <PageScripts />
    </div>
  )
}

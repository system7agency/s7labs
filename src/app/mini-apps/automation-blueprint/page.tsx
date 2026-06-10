'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { clsx } from 'clsx'
import './page-styles.css'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { HowItWorks, type HowItWorksStep } from '@/components/mini-apps/HowItWorks'
import { InlineConsentField } from '@/components/mini-apps/InlineConsentField'
import { EMAIL_REGEX } from '@/lib/leads/disposable'
import type { ApiResponse, BlueprintResult } from '@/app/api/mini-apps/automation-blueprint/route'
import { BlueprintDiagram, PageScripts } from './PageScripts'
import {
  AutomationBlueprintResult,
  buildAutomationBlueprintPlainText,
  prettyConfigJson,
} from './components/AutomationBlueprintResult'

type AppState = 'idle' | 'loading' | 'result' | 'error'

const MIN_CHARS = 25

const STAGES = [
  {
    num: '01',
    title: 'Reading the process',
    logs: ['parsing your workflow', 'spotting the steps', 'mapping inputs and outputs'],
  },
  {
    num: '02',
    title: 'Picking the tools',
    logs: ['comparing Make / n8n / Zapier', 'matching to steps', 'scoring difficulty'],
  },
  {
    num: '03',
    title: 'Drawing the blueprint',
    logs: ['building the flow', 'wiring the nodes', 'laying out the diagram'],
  },
  {
    num: '04',
    title: 'Estimating the payoff',
    logs: ['calculating time saved', 'writing the starter config', 'blueprint complete'],
  },
]
const STAGE_MS = 5000

const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    title: 'Describe the process in plain English',
    description:
      'No integrations to wire up front. Just describe what you do manually today, the same way you would explain it to a teammate.',
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
    title: 'We render the flowchart',
    description:
      'A Mermaid diagram you can show on a sales call: steps, branches, and handoffs included.',
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
    title: 'Compare Make vs n8n vs Zapier',
    description:
      'Honest fit scores for each platform on this exact process, with a clear recommendation.',
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
    title: 'Get a starter scaffold',
    description:
      'A JSON scaffold to start building in Make or n8n. Not import-ready, but a real head start.',
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

const EXAMPLES = [
  {
    label: 'Shopify CSV to accountant',
    text: 'Every Monday I download a CSV from Shopify, clean it up in Excel, then email it to my accountant.',
  },
  {
    label: 'New lead to CRM + Slack ping',
    text: 'When a new lead fills out our website form, I manually copy their details into HubSpot and post a message in our #sales Slack channel.',
  },
  {
    label: 'Invoices from email to Google Sheets',
    text: 'I get vendor invoices by email, save the PDFs, extract the amounts manually, and add each row to a Google Sheet for bookkeeping.',
  },
]

function fmtTs(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `BLUEPRINT · ${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} · ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`
}

export default function AutomationBlueprintPage() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [processText, setProcessText] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  const [shakeInput, setShakeInput] = useState(0)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [marketingConsent, setMarketingConsent] = useState(true)
  const [shakeEmail, setShakeEmail] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<BlueprintResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [resultTs, setResultTs] = useState('')
  const [exportState, setExportState] = useState<'idle' | 'copying' | 'png' | 'pdf'>('idle')
  const [configCopied, setConfigCopied] = useState(false)
  const [configOpen, setConfigOpen] = useState(true)
  const [diagramFailed, setDiagramFailed] = useState(false)
  const [tokens, setTokens] = useState<{ in: number; out: number } | null>(null)

  const [activeStage, setActiveStage] = useState(-1)
  const [doneStages, setDoneStages] = useState<number[]>([])
  const [stageLogs, setStageLogs] = useState<string[]>(['', '', '', ''])
  const [progressPct, setProgressPct] = useState(0)
  const [loadingPct, setLoadingPct] = useState('0%')
  const [latency, setLatency] = useState('—')
  const [sysState, setSysState] = useState('idle')
  const [clock, setClock] = useState('—')

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
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
      const trimmed = processText.trim()
      if (!trimmed || trimmed.length < MIN_CHARS) {
        setInputError('Describe the process in a bit more detail so we can map it.')
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
      setDiagramFailed(false)

      // Step A: save lead FIRST
      let submissionId: string | null = null
      try {
        const res = await fetch('/api/leads/submit', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email: emailClean,
            miniAppSlug: 'automation-blueprint',
            marketingConsent,
            input: { process: trimmed },
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
        const res = await fetch('/api/mini-apps/automation-blueprint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ process: trimmed }),
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
        setResultTs(fmtTs(new Date()))
        setSysState('complete')
        setAppState('result')

        const completeBody: Record<string, unknown> = { submissionId, output: data.data }
        const withCost = data as ApiResponse & { cost?: unknown }
        if (withCost.cost) completeBody.cost = withCost.cost
        fetch('/api/leads/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(completeBody),
        }).catch((err) => console.error('[automation-blueprint] leads/complete', err))
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
        }).catch((err) => console.error('[automation-blueprint] leads/complete fail', err))
      }
      setSubmitting(false)
    },
    [processText, email, marketingConsent, submitting, startLoadingAnimation, clearTimers]
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
    setDiagramFailed(false)
  }, [clearTimers])

  const handleCopy = useCallback(async () => {
    if (!result) return
    setExportState('copying')
    try {
      await navigator.clipboard.writeText(buildAutomationBlueprintPlainText(result))
    } catch {
      const ta = document.createElement('textarea')
      ta.value = buildAutomationBlueprintPlainText(result)
      ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setTimeout(() => setExportState('idle'), 1800)
  }, [result])

  const handleCopyConfig = useCallback(async () => {
    if (!result) return
    const text = prettyConfigJson(result.starter_config.json)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setConfigCopied(true)
    setTimeout(() => setConfigCopied(false), 1800)
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
      a.download = `blueprint-${result.process_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`
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
      pdf.save(`blueprint-${result.process_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`)
    } catch (e) {
      console.error(e)
    }
    setExportState('idle')
  }, [result])

  return (
    <div className="automation-blueprint">
      <AuroraBackground />

      <Header />

      <main className="shell">
        <section className="hero">
          <span className="eyebrow">Automation Blueprint</span>
          <h1>
            Describe the pain. <span className="accent">See the blueprint.</span>
          </h1>
          <p>
            Paste any manual process in plain English. Get a visual automation flow, tool
            recommendation, time saved, and a starter config, built for live pitch demos.
          </p>
          <div className="meta-tags">
            <span>· Make / n8n / Zapier</span>
            <span>· Flowchart</span>
            <span>· Time saved</span>
            <span>· Starter config</span>
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
              <section className={clsx('ab-state', { active: appState === 'idle' })}>
                <div className="idle-label">Describe a manual process you do over and over</div>
                <form noValidate onSubmit={handleSubmit} autoComplete="off">
                  <div className="textarea-field">
                    <label>Your workflow in plain English</label>
                    <div
                      key={`p-${shakeInput}`}
                      className={clsx('textarea-box textarea-tall', { error: inputError })}
                    >
                      <textarea
                        ref={textareaRef}
                        rows={7}
                        placeholder="Every Monday I download a CSV from Shopify, clean it up in Excel, then email it to my accountant."
                        value={processText}
                        disabled={submitting}
                        onChange={(e) => {
                          setProcessText(e.target.value)
                          if (inputError) setInputError(null)
                        }}
                      />
                    </div>
                    {inputError && <div className="field-error">{inputError}</div>}
                    <div className="char-count">{processText.length} chars</div>
                  </div>
                  <div className="example-chips">
                    {EXAMPLES.map((ex) => (
                      <button
                        key={ex.label}
                        type="button"
                        className="example-chip"
                        disabled={submitting}
                        onClick={() => {
                          setProcessText(ex.text)
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
                        <path d="M4 5h16M4 12h10M4 19h16" />
                      </svg>
                      Map the automation
                    </button>
                  </div>
                </form>
              </section>

              <section className={clsx('ab-state', { active: appState === 'loading' })}>
                <div className="progress-track">
                  <div className="progress-bar" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="loading-header">
                  <span>Mapping automation</span>
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

              <section className={clsx('ab-state', { active: appState === 'result' })}>
                {result && (
                  <>
                    <div ref={resultPanelRef}>
                      <AutomationBlueprintResult
                        bare
                        input={{ process: processText }}
                        output={result}
                        diagramSlot={
                          !diagramFailed && result.mermaid ? (
                            <>
                              <div className="section-header">
                                <span>{'// The blueprint'}</span>
                              </div>
                              <div className="blueprint-panel">
                                <BlueprintDiagram
                                  key={result.mermaid}
                                  chart={result.mermaid}
                                  onError={() => setDiagramFailed(true)}
                                />
                              </div>
                            </>
                          ) : null
                        }
                        configSlot={
                          <div className="config-section">
                            <button
                              type="button"
                              className="config-toggle"
                              onClick={() => setConfigOpen((o) => !o)}
                              aria-expanded={configOpen}
                            >
                              <span>{'// starter config'}</span>
                              <span className="config-platform">
                                {result.starter_config.platform}
                              </span>
                              <span className="config-chevron">{configOpen ? '−' : '+'}</span>
                            </button>
                            {configOpen && (
                              <div className="config-block">
                                <div className="config-block-header">
                                  <span className="config-hint">
                                    Scaffold only. Not import-ready
                                  </span>
                                  <button
                                    type="button"
                                    className={clsx('config-copy-btn', { copied: configCopied })}
                                    onClick={handleCopyConfig}
                                  >
                                    {configCopied ? 'Copied' : 'Copy'}
                                  </button>
                                </div>
                                <pre className="config-code">
                                  <code>{prettyConfigJson(result.starter_config.json)}</code>
                                </pre>
                                <p className="config-note">{result.starter_config.note}</p>
                              </div>
                            )}
                          </div>
                        }
                      />
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
                          Map another process
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
                className={clsx('ab-state', 'error-state', { active: appState === 'error' })}
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
                <h2 className="err-title">Blueprint failed</h2>
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
              From process to <span className="accent">blueprint</span> in under a minute
            </>
          }
          subtitle="No login, no install. Four steps from paste to a ranked plan."
          steps={HOW_IT_WORKS_STEPS}
        />
      </main>

      <Footer />
      <PageScripts />
    </div>
  )
}

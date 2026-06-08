'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { clsx } from 'clsx'
import './page-styles.css'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { EMAIL_REGEX } from '@/lib/leads/disposable'
import { HowItWorks, type HowItWorksStep } from '@/components/mini-apps/HowItWorks'
import type { ApiResponse, FieldIssue, SanityResult } from '@/app/api/mini-apps/crm-sanity/route'
import { PageScripts } from './PageScripts'

type AppState = 'idle' | 'loading' | 'result' | 'error'

const SANITY_STEPS: HowItWorksStep[] = [
  {
    title: 'Paste one CRM record',
    description:
      'A single contact, account, lead, or deal. Any format: JSON dump, CSV row, or a copy/paste from the CRM detail view. One record at a time.',
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
    title: 'We parse the fields and structure',
    description:
      'Emails, phones, URLs, dates, names: every value is normalised and checked against expected patterns.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 4h6v6H4z" />
        <path d="M14 4h6v6h-6z" />
        <path d="M4 14h6v6H4z" />
        <path d="M14 14h6v6h-6z" />
      </svg>
    ),
  },
  {
    title: 'AI evaluates against CRM hygiene best practices',
    description:
      'Format validity, completeness, consistency, and duplicate risk, scored against what good ops teams actually enforce.',
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
    title: 'Get your sanity score and field-by-field fixes',
    description:
      'Overall hygiene grade, severity-flagged issues, and concrete fixes for every field that needs attention.',
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
    title: 'Parsing fields',
    logs: ['reading record', 'tokenising fields', 'fields parsed'],
  },
  {
    num: '02',
    title: 'Validating formats',
    logs: ['checking email', 'checking phone/URL', 'formats checked'],
  },
  {
    num: '03',
    title: 'Flagging issues',
    logs: ['scoring each field', 'ranking severity', 'issues ranked'],
  },
  {
    num: '04',
    title: 'Writing fixes',
    logs: ['generating suggestions', 'scoring quality', 'brief ready'],
  },
]
const STAGE_MS = 4000

// One CRM record at a time. 4000 chars is roughly a 25-field detail view,
// well above realistic single-record needs. Above this we reject server-side.
const MAX_RECORD_CHARS = 4000
const CHAR_WARN_AT = 3200

const PLACEHOLDER = `First Name: john
Last Name: smith
Email: john.smith@gmail
Phone: 555-1234
Company: Acme Corp
Title: vp sales
LinkedIn: linkedin.com/in/johnsmith
Website: acme
Lead Source: 
Created Date: 2024-01-15`

function fmtTs(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `REPORT · ${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} · ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`
}

function scoreClass(score: number): string {
  if (score >= 75) return 'good'
  if (score >= 45) return 'mid'
  return 'bad'
}

function gradeLabel(grade: string): string {
  const map: Record<string, string> = {
    A: 'excellent',
    B: 'good',
    C: 'needs work',
    D: 'poor',
    F: 'critical',
  }
  return map[grade] ?? ''
}

function buildPlainText(r: SanityResult): string {
  return [
    `CRM Field Sanity Check`,
    '='.repeat(60),
    '',
    `Record type   : ${r.record_type}`,
    `Quality score : ${r.quality_score}/100 (Grade ${r.grade})`,
    `Duplicate risk: ${r.duplicate_risk.toUpperCase()}`,
    '',
    '// SUMMARY',
    r.summary,
    '',
    `// ISSUES (${r.issues.length})`,
    ...r.issues.map(
      (i) => `  [${i.severity.toUpperCase()}] ${i.field}: ${i.issue}\n  Fix: ${i.fix}`
    ),
    '',
    `// CLEAN FIELDS`,
    r.clean_fields.join(', '),
    '',
    `// DUPLICATE RISK`,
    r.duplicate_reason,
    '',
    `// CLEANED RECORD (${r.input_format})`,
    r.cleaned_record,
    '',
    `Tokens: ${(r.tokens_in + r.tokens_out).toLocaleString()} (${r.tokens_in.toLocaleString()} in / ${r.tokens_out.toLocaleString()} out)`,
    'Generated by S7 Labs CRM Field Sanity Check',
  ].join('\n')
}

const FORMAT_LABEL: Record<string, string> = {
  keyvalue: 'key: value',
  csv: 'CSV',
  json: 'JSON',
  freetext: 'free text',
}

function CleanedRecordBlock({ text, format }: { text: string; format: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(async () => {
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
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }, [text])
  return (
    <div className="cleaned-block">
      <div className="cleaned-head">
        <div className="cleaned-head-left">
          <span className="cleaned-eyebrow">{'// Cleaned record'}</span>
          <span className="cleaned-format-pill">{FORMAT_LABEL[format] ?? format}</span>
        </div>
        <button
          type="button"
          className={clsx('cleaned-copy-btn', { copied })}
          onClick={handleCopy}
          aria-label="Copy cleaned record"
        >
          {copied ? 'Copied' : 'Copy cleaned record'}
        </button>
      </div>
      <pre className="cleaned-pre">{text}</pre>
      <div className="cleaned-foot">
        Drop-in ready. Paste this back into your CRM to apply every fix at once.
      </div>
    </div>
  )
}

function IssueCard({ issue }: { issue: FieldIssue }) {
  return (
    <div className={`issue-card ${issue.severity}`}>
      <div className="issue-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span className="issue-field">{issue.field}</span>
          <span className="issue-value">{issue.value || 'empty'}</span>
        </div>
        <span className={`severity-badge ${issue.severity}`}>{issue.severity}</span>
      </div>
      <p className="issue-text">{issue.issue}</p>
      <div className="issue-fix">
        <span className="fix-label">Fix</span>
        <span className="fix-text">{issue.fix}</span>
      </div>
    </div>
  )
}

export default function CrmSanityPage() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [recordText, setRecordText] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  const [shakeInput, setShakeInput] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SanityResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [resultTs, setResultTs] = useState('')
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
      const recordClean = recordText.trim()
      if (!recordClean || recordClean.length < 20) {
        setInputError('Paste one CRM record. A few fields is enough.')
        setShakeInput((k) => k + 1)
        valid = false
      } else if (recordClean.length > MAX_RECORD_CHARS) {
        setInputError(
          `Record too long (${recordClean.length} chars). Paste one record at a time. Max ${MAX_RECORD_CHARS}.`
        )
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
            miniAppSlug: 'crm-field-sanity-check',
            input: { record_text: recordClean },
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
        const res = await fetch('/api/mini-apps/crm-sanity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ record_text: recordClean }),
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
        }).catch((err) => console.error('[crm-sanity] leads/complete', err))
      } else {
        setErrorMsg(data.message)
        setSysState('error')
        setAppState('error')
      }
      setSubmitting(false)
    },
    [recordText, email, submitting, startLoadingAnimation, clearTimers]
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
      a.download = `crm-sanity-${result.record_type.toLowerCase()}.png`
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
      pdf.save(`crm-sanity-${result.record_type.toLowerCase()}.pdf`)
    } catch (e) {
      console.error(e)
    }
    setExportState('idle')
  }, [result])

  const criticalCount = result?.issues.filter((i) => i.severity === 'critical').length ?? 0
  const warningCount = result?.issues.filter((i) => i.severity === 'warning').length ?? 0

  return (
    <div className="crm-sanity">
      <AuroraBackground />

      <Header />

      <main className="shell">
        <section className="hero">
          <span className="eyebrow">CRM Field Sanity Check</span>
          <h1>
            Catch bad data <span className="accent">before it breaks things.</span>
          </h1>
          <p>
            Paste one CRM record (a contact, account, lead, or deal). We score every field, flag
            issues by severity, and give you exact fixes in seconds.
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
              <section className={clsx('cs-state', { active: appState === 'idle' })}>
                <div className="idle-label">One CRM record</div>
                <form noValidate onSubmit={handleSubmit} autoComplete="off">
                  <div className="textarea-field">
                    <label>
                      Paste one record (any format: key: value, CSV row, JSON, free text). One
                      record at a time. For bulk cleanup use a tool like OpenRefine.
                    </label>
                    <div
                      key={`r-${shakeInput}`}
                      className={clsx('textarea-box', { error: inputError })}
                    >
                      <textarea
                        ref={textareaRef}
                        placeholder={PLACEHOLDER}
                        value={recordText}
                        disabled={submitting}
                        maxLength={MAX_RECORD_CHARS}
                        onChange={(e) => {
                          setRecordText(e.target.value)
                          if (inputError) setInputError(null)
                        }}
                      />
                    </div>
                    {inputError && <div className="field-error">{inputError}</div>}
                    <div
                      className={clsx('char-count', {
                        'is-warn': recordText.length >= CHAR_WARN_AT,
                        'is-cap': recordText.length >= MAX_RECORD_CHARS,
                      })}
                    >
                      {recordText.length} / {MAX_RECORD_CHARS} chars
                    </div>
                  </div>
                  <div className="textarea-field" style={{ marginTop: 14 }}>
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
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                      </svg>
                      Run sanity check
                    </button>
                  </div>
                </form>
              </section>

              {/* LOADING */}
              <section className={clsx('cs-state', { active: appState === 'loading' })}>
                <div className="progress-track">
                  <div className="progress-bar" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="loading-header">
                  <span>Checking record</span>
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
              <section className={clsx('cs-state', { active: appState === 'result' })}>
                {result && (
                  <>
                    <div ref={resultPanelRef}>
                      <div className="result-head">
                        <span className="title">Sanity check complete: {result.record_type}</span>
                        <span className="ts-label">{resultTs}</span>
                      </div>

                      <div className="score-row">
                        <div className={`score-card ${scoreClass(result.quality_score)}`}>
                          <div className="sc-label">Quality Score</div>
                          <div className="sc-value">
                            <span className="sc-big">{result.quality_score}</span>
                            <span className="sc-small">/100</span>
                          </div>
                          <div className="sc-delta">
                            Grade {result.grade}: {gradeLabel(result.grade)}
                          </div>
                        </div>
                        <div
                          className={`score-card ${criticalCount > 0 ? 'bad' : warningCount > 0 ? 'mid' : 'good'}`}
                        >
                          <div className="sc-label">Issues</div>
                          <div className="sc-value">
                            <span className="sc-big">{result.issues.length}</span>
                          </div>
                          <div className="sc-delta">
                            {criticalCount} critical · {warningCount} warnings
                          </div>
                        </div>
                        <div
                          className={`score-card ${result.duplicate_risk === 'high' ? 'bad' : result.duplicate_risk === 'medium' ? 'mid' : 'good'}`}
                        >
                          <div className="sc-label">Dup Risk</div>
                          <div className="sc-value">
                            <span
                              className="sc-big"
                              style={{ fontSize: '28px', textTransform: 'capitalize' }}
                            >
                              {result.duplicate_risk}
                            </span>
                          </div>
                          <div className="sc-delta">{result.clean_fields.length} clean fields</div>
                        </div>
                      </div>

                      <div className="summary-block">
                        <div className="summary-eyebrow">{'// Summary'}</div>
                        <p className="summary-text">{result.summary}</p>
                      </div>

                      {result.cleaned_record && (
                        <CleanedRecordBlock
                          text={result.cleaned_record}
                          format={result.input_format}
                        />
                      )}

                      {result.issues.length > 0 && (
                        <>
                          <div className="section-header">
                            <span>{'// Issues detected'}</span>
                            <span>{result.issues.length} total</span>
                          </div>
                          <div className="issues">
                            {result.issues.map((issue, i) => (
                              <IssueCard key={i} issue={issue} />
                            ))}
                          </div>
                        </>
                      )}

                      {result.clean_fields.length > 0 && (
                        <>
                          <div className="section-header">
                            <span>{'// Clean fields'}</span>
                          </div>
                          <div className="clean-fields">
                            {result.clean_fields.map((f) => (
                              <span key={f} className="clean-tag">
                                {f}
                              </span>
                            ))}
                          </div>
                        </>
                      )}

                      <div className="section-header">
                        <span>{'// Duplicate risk'}</span>
                      </div>
                      <div className={`dup-block dup-${result.duplicate_risk}`}>
                        <div className="dup-icon">
                          {result.duplicate_risk === 'high'
                            ? '⚠️'
                            : result.duplicate_risk === 'medium'
                              ? '🔍'
                              : '✓'}
                        </div>
                        <div className="dup-body">
                          <div className="dup-label">
                            Risk level
                            <span className={`dup-risk-badge ${result.duplicate_risk}`}>
                              {result.duplicate_risk}
                            </span>
                          </div>
                          <p className="dup-reason">{result.duplicate_reason}</p>
                        </div>
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
                          Check another
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

              {/* ERROR */}
              <section
                className={clsx('cs-state', 'error-state', { active: appState === 'error' })}
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
              From record to <span className="accent">clean CRM</span> in seconds
            </>
          }
          subtitle="No login, no install. Four steps from paste to field-level fixes."
          steps={SANITY_STEPS}
        />
      </main>

      <Footer />
      <PageScripts />
    </div>
  )
}

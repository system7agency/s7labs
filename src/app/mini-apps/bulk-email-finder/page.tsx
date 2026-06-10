'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'

import './page-styles.css'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { EmailGate } from '@/components/mini-apps/EmailGate'
import { HowItWorks, type HowItWorksStep } from '@/components/mini-apps/HowItWorks'
import { SubmitOnce } from '@/components/mini-apps/SubmitOnce'

import { BulkEmailFinderResult } from './components/BulkEmailFinderResult'
import { PageScripts } from './PageScripts'

type AppState = 'upload' | 'mapping' | 'gate' | 'processing' | 'results' | 'error'
type MappingMode = 'full' | 'split'

type CsvData = {
  fileName: string
  headers: string[]
  rows: string[][]
}

type ColumnMapping = {
  mode: MappingMode
  fullNameHeader: string
  firstNameHeader: string
  lastNameHeader: string
  companyHeader: string
}

type InputRow = {
  firstName: string
  lastName: string
  company: string
}

type JobResult = {
  row: number
  firstName: string
  lastName: string
  company: string
  email: string | null
  status: 'found' | 'not_found' | 'error'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | null
  title: string | null
  companyDomain: string
  error?: string
}

type StatusPayload = {
  ok: true
  job: {
    id: string
    status: 'processing' | 'completed' | 'failed'
    total: number
    completed: number
    results: JobResult[]
  }
}

const JOB_KEY = 'bulk-email-finder-job-id'
const MAX_FILE_BYTES = 1024 * 1024
const MAX_ROWS = 50

const HOW_STEPS: HowItWorksStep[] = [
  {
    title: 'Upload your CSV',
    description:
      'Drop a CSV with name + company data. We parse, clean, dedupe, and prep up to the first 50 rows.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <rect x="4" y="16" width="16" height="4" rx="1.5" />
      </svg>
    ),
  },
  {
    title: 'Map columns',
    description:
      'Confirm which columns represent name and company so every row is structured safely.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 6h16M4 12h16M4 18h16" />
        <path d="M8 4v16M16 4v16" />
      </svg>
    ),
  },
  {
    title: 'We enrich in parallel',
    description:
      'After email unlock, we run Apollo lookups with concurrency 5 and live progress updates every few seconds.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 12h6M15 12h6M12 3v6M12 15v6" />
        <circle cx="12" cy="12" r="3.5" />
      </svg>
    ),
  },
  {
    title: 'Download results',
    description:
      'Review found vs missing emails, then export a clean CSV with statuses and confidence values.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3v12" />
        <path d="m7 11 5 5 5-5" />
        <rect x="4" y="18" width="16" height="3" rx="1.5" />
      </svg>
    ),
  },
]

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const clean = fullName.trim().replace(/\s+/g, ' ')
  if (!clean) return { firstName: '', lastName: '' }
  const idx = clean.lastIndexOf(' ')
  if (idx === -1) return { firstName: clean, lastName: '' }
  return {
    firstName: clean.slice(0, idx).trim(),
    lastName: clean.slice(idx + 1).trim(),
  }
}

function parseCsvText(csv: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ''
  let inQuotes = false

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i]
    const next = csv[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        currentCell += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim())
      currentCell = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1
      currentRow.push(currentCell.trim())
      currentCell = ''
      if (currentRow.some((cell) => cell.length > 0)) rows.push(currentRow)
      currentRow = []
      continue
    }

    currentCell += char
  }

  currentRow.push(currentCell.trim())
  if (currentRow.some((cell) => cell.length > 0)) rows.push(currentRow)
  return rows
}

function inferMapping(headers: string[]): ColumnMapping {
  const normalized = headers.map((h) => normalizeHeader(h))
  const find = (patterns: RegExp[]): string =>
    headers[normalized.findIndex((h) => patterns.some((p) => p.test(h)))] ?? ''

  return {
    mode:
      find([/\bfirst name\b/, /\bfirst\b/]) && find([/\blast name\b/, /\blast\b/])
        ? 'split'
        : 'full',
    fullNameHeader: find([/\bfull name\b/, /\bname\b/, /\bcontact\b/]),
    firstNameHeader: find([/\bfirst name\b/, /\bfirst\b/]),
    lastNameHeader: find([/\blast name\b/, /\blast\b/, /\bsurname\b/]),
    companyHeader: find([/\bcompany\b/, /\baccount\b/, /\bdomain\b/, /\bwebsite\b/]),
  }
}

function dedupeRows(rows: InputRow[]): InputRow[] {
  const seen = new Set<string>()
  const out: InputRow[] = []
  for (const row of rows) {
    const key = `${row.firstName.toLowerCase()}|${row.lastName.toLowerCase()}|${row.company.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(row)
    if (out.length >= MAX_ROWS) break
  }
  return out
}

function buildRows(csv: CsvData, mapping: ColumnMapping): InputRow[] {
  const indexByHeader = new Map(csv.headers.map((header, idx) => [header, idx]))
  const rows: InputRow[] = []

  for (const raw of csv.rows) {
    const company = (raw[indexByHeader.get(mapping.companyHeader) ?? -1] ?? '').trim()
    if (!company) continue

    let firstName = ''
    let lastName = ''

    if (mapping.mode === 'full') {
      const fullName = (raw[indexByHeader.get(mapping.fullNameHeader) ?? -1] ?? '').trim()
      const split = splitName(fullName)
      firstName = split.firstName
      lastName = split.lastName
    } else {
      firstName = (raw[indexByHeader.get(mapping.firstNameHeader) ?? -1] ?? '').trim()
      lastName = (raw[indexByHeader.get(mapping.lastNameHeader) ?? -1] ?? '').trim()
    }

    if (!firstName || !company) continue
    rows.push({ firstName, lastName, company })
  }

  return dedupeRows(rows)
}

function looksAmbiguous(mapping: ColumnMapping): boolean {
  if (!mapping.companyHeader) return true
  if (mapping.mode === 'full') return !mapping.fullNameHeader
  return !mapping.firstNameHeader
}

export default function BulkEmailFinderPage() {
  const [appState, setAppState] = useState<AppState>('upload')
  const [csvData, setCsvData] = useState<CsvData | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping>({
    mode: 'full',
    fullNameHeader: '',
    firstNameHeader: '',
    lastNameHeader: '',
    companyHeader: '',
  })
  const [preparedRows, setPreparedRows] = useState<InputRow[]>([])
  const [jobId, setJobId] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [results, setResults] = useState<JobResult[]>([])
  const [total, setTotal] = useState(0)
  const [completed, setCompleted] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [resumeBypassGate, setResumeBypassGate] = useState(false)
  const [starting, setStarting] = useState(false)
  const [downloadBusy, setDownloadBusy] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const foundCount = useMemo(() => results.filter((r) => r.status === 'found').length, [results])
  const progressPct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0
  const previewRows = useMemo(() => preparedRows.slice(0, 5), [preparedRows])

  const checkJobStatus = useCallback(async (id: string) => {
    const res = await fetch(
      `/api/mini-apps/bulk-email-finder/status?jobId=${encodeURIComponent(id)}`,
      {
        cache: 'no-store',
      }
    )
    const payload = (await res.json()) as StatusPayload | { ok: false; error: string }
    if (!res.ok || !payload.ok) {
      throw new Error(payload.ok ? 'Unknown status error' : payload.error)
    }
    return payload.job
  }, [])

  useEffect(() => {
    const id = window.localStorage.getItem(JOB_KEY)
    if (!id) return
    void (async () => {
      try {
        const job = await checkJobStatus(id)
        setJobId(job.id)
        setTotal(job.total)
        setCompleted(job.completed)
        setResults(job.results)
        setResumeBypassGate(true)
        if (job.status === 'completed') {
          setAppState('results')
        } else if (job.status === 'processing') {
          setAppState('processing')
        }
      } catch {
        window.localStorage.removeItem(JOB_KEY)
      }
    })()
  }, [checkJobStatus])

  useEffect(() => {
    if (appState !== 'processing' || !jobId) return
    let cancelled = false

    const tick = async () => {
      try {
        const job = await checkJobStatus(jobId)
        if (cancelled) return
        setTotal(job.total)
        setCompleted(job.completed)
        setResults(job.results)
        if (job.status === 'completed') {
          setAppState('results')
        } else if (job.status === 'failed') {
          setErrorMsg('Processing failed. Please upload the CSV and try again.')
          setAppState('error')
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMsg(error instanceof Error ? error.message : 'Failed to fetch job status.')
          setAppState('error')
        }
      }
    }

    void tick()
    const id = window.setInterval(() => {
      void tick()
    }, 2000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [appState, jobId, checkJobStatus])

  const parseAndLoadFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setErrorMsg('CSV must be 1MB or smaller.')
      setAppState('error')
      return
    }

    const text = await file.text()
    const parsed = parseCsvText(text)
    if (parsed.length < 2) {
      setErrorMsg('CSV must include a header row and at least one data row.')
      setAppState('error')
      return
    }

    const headers = parsed[0] ?? []
    const rows = parsed.slice(1)
    const inferred = inferMapping(headers)

    setCsvData({ fileName: file.name, headers, rows })
    setMapping(inferred)
    setPreparedRows([])
    setErrorMsg('')
    setAppState('mapping')
  }, [])

  const onFilePicked = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      await parseAndLoadFile(file)
    },
    [parseAndLoadFile]
  )

  const onDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files?.[0]
      if (!file) return
      await parseAndLoadFile(file)
    },
    [parseAndLoadFile]
  )

  const handleBuildRows = useCallback(() => {
    if (!csvData) return
    const rows = buildRows(csvData, mapping)
    if (rows.length === 0) {
      setErrorMsg('No valid rows after mapping. Ensure name + company columns are correct.')
      setAppState('error')
      return
    }
    setPreparedRows(rows)
    setErrorMsg('')
    setAppState('gate')
  }, [csvData, mapping])

  const startProcessing = useCallback(
    async (submitToApi: (input: object, output: object) => Promise<void>) => {
      if (starting || preparedRows.length === 0) return
      setStarting(true)
      try {
        const response = await fetch('/api/mini-apps/bulk-email-finder', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ rows: preparedRows }),
        })
        const payload = (await response.json()) as
          | { ok: true; jobId: string; total: number }
          | { ok: false; error: string }

        if (!response.ok || !payload.ok) {
          throw new Error(payload.ok ? 'Failed to create job.' : payload.error)
        }

        setJobId(payload.jobId)
        setTotal(payload.total)
        setCompleted(0)
        setResults([])
        window.localStorage.setItem(JOB_KEY, payload.jobId)
        await submitToApi(
          { rows_count: preparedRows.length },
          { stage: 'job_started', job_id: payload.jobId, total: payload.total }
        )
        setAppState('processing')
      } catch (error) {
        setErrorMsg(error instanceof Error ? error.message : 'Failed to start processing.')
        setAppState('error')
      } finally {
        setStarting(false)
      }
    },
    [preparedRows, starting]
  )

  const handleReset = useCallback(() => {
    setAppState('upload')
    setCsvData(null)
    setPreparedRows([])
    setResults([])
    setTotal(0)
    setCompleted(0)
    setErrorMsg('')
    setResumeBypassGate(false)
    setJobId('')
    window.localStorage.removeItem(JOB_KEY)
  }, [])

  const handleDownload = useCallback(async () => {
    if (!jobId || downloadBusy) return
    setDownloadBusy(true)
    try {
      const res = await fetch(
        `/api/mini-apps/bulk-email-finder/download?jobId=${encodeURIComponent(jobId)}`
      )
      if (!res.ok) throw new Error('Download failed.')
      const blob = await res.blob()
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = `bulk-email-finder-${jobId}.csv`
      a.click()
      URL.revokeObjectURL(href)
    } catch {
      setErrorMsg('Could not download CSV yet.')
      setAppState('error')
    } finally {
      setDownloadBusy(false)
    }
  }, [jobId, downloadBusy])

  const uploadSection = (
    <section className="bef-panel">
      <h2>Upload CSV</h2>
      <p>CSV only, up to 1MB. We process max 50 cleaned rows per run.</p>
      <div
        className={`dropzone${dragOver ? 'active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <p>Drag and drop your `.csv` file here</p>
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          Choose file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onFilePicked}
          style={{ display: 'none' }}
        />
      </div>
    </section>
  )

  const mappingSection = csvData && (
    <section className="bef-panel">
      <h2>Map columns</h2>
      <p>
        {csvData.fileName} · {csvData.rows.length} rows detected
      </p>

      <div className="mapping-grid">
        <label>
          Name format
          <select
            value={mapping.mode}
            onChange={(e) =>
              setMapping((prev) => ({ ...prev, mode: e.target.value as MappingMode }))
            }
          >
            <option value="full">Single full-name column</option>
            <option value="split">Separate first/last columns</option>
          </select>
        </label>

        {mapping.mode === 'full' ? (
          <label>
            Full name column
            <select
              value={mapping.fullNameHeader}
              onChange={(e) => setMapping((prev) => ({ ...prev, fullNameHeader: e.target.value }))}
            >
              <option value="">Select column</option>
              {csvData.headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <>
            <label>
              First name column
              <select
                value={mapping.firstNameHeader}
                onChange={(e) =>
                  setMapping((prev) => ({ ...prev, firstNameHeader: e.target.value }))
                }
              >
                <option value="">Select column</option>
                {csvData.headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Last name column (optional)
              <select
                value={mapping.lastNameHeader}
                onChange={(e) =>
                  setMapping((prev) => ({ ...prev, lastNameHeader: e.target.value }))
                }
              >
                <option value="">Select column</option>
                {csvData.headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        <label>
          Company column
          <select
            value={mapping.companyHeader}
            onChange={(e) => setMapping((prev) => ({ ...prev, companyHeader: e.target.value }))}
          >
            <option value="">Select column</option>
            {csvData.headers.map((header) => (
              <option key={header} value={header}>
                {header}
              </option>
            ))}
          </select>
        </label>
      </div>

      {looksAmbiguous(mapping) && (
        <p className="warning">Mapping looks incomplete. Name and company columns are required.</p>
      )}

      <div className="actions">
        <button type="button" onClick={() => setAppState('upload')} className="ghost">
          Back
        </button>
        <button type="button" onClick={handleBuildRows} disabled={looksAmbiguous(mapping)}>
          Continue to unlock
        </button>
      </div>
    </section>
  )

  const processingOrResults = (submitToApi?: (input: object, output: object) => Promise<void>) => (
    <section className="bef-panel">
      {appState === 'gate' && (
        <>
          {submitToApi ? (
            <>
              <SubmitOnce
                submit={submitToApi}
                input={{ rows_count: preparedRows.length }}
                output={{ stage: 'gate_unlocked' }}
              />
              <h2>Ready to process</h2>
              <p>
                {preparedRows.length} cleaned rows are queued (max 50). Start enrichment when ready.
              </p>
              <div className="preview-table">
                <table>
                  <thead>
                    <tr>
                      <th>First</th>
                      <th>Last</th>
                      <th>Company</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => (
                      <tr key={`${row.firstName}-${idx}`}>
                        <td>{row.firstName}</td>
                        <td>{row.lastName || '—'}</td>
                        <td>{row.company}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="actions">
                <button type="button" className="ghost" onClick={() => setAppState('mapping')}>
                  Edit mapping
                </button>
                <button
                  type="button"
                  onClick={() => void startProcessing(submitToApi)}
                  disabled={starting}
                >
                  {starting ? 'Starting…' : 'Start enrichment'}
                </button>
              </div>
            </>
          ) : null}
        </>
      )}

      {appState === 'processing' && (
        <>
          <h2>Processing job</h2>
          <p>
            Job {jobId.slice(0, 8)}… · {completed}/{total} completed
          </p>
          <div className="progress">
            <div className="bar" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="progress-label">{progressPct}%</span>
        </>
      )}

      {appState === 'results' && (
        <>
          {submitToApi ? (
            <SubmitOnce
              submit={submitToApi}
              input={{ job_id: jobId }}
              output={{ stage: 'job_completed', total, found: foundCount }}
            />
          ) : null}
          <BulkEmailFinderResult
            bare
            input={{ jobId, rows_count: total }}
            output={{ total, found: foundCount, results }}
            rows={results}
            total={total}
            found={foundCount}
            renderFooter={() => (
              <div className="actions">
                <button type="button" className="ghost" onClick={handleReset}>
                  New run
                </button>
                <button type="button" onClick={() => void handleDownload()} disabled={downloadBusy}>
                  {downloadBusy ? 'Preparing…' : 'Download CSV'}
                </button>
              </div>
            )}
          />
        </>
      )}
    </section>
  )

  return (
    <div className="bulk-email-finder">
      <AuroraBackground />
      <Header />
      <main className="shell">
        <section className="hero">
          <span className="eyebrow">Bulk Email Finder</span>
          <h1>
            Turn CSV contacts into <span className="accent">verified work emails</span>.
          </h1>
          <p>Upload, map, unlock, process, and export. Built for quick outbound list enrichment.</p>
        </section>

        {appState === 'upload' && uploadSection}
        {appState === 'mapping' && mappingSection}

        {!resumeBypassGate &&
          (appState === 'gate' || appState === 'processing' || appState === 'results') && (
            <EmailGate
              miniAppSlug="bulk-email-finder"
              pattern="upfront"
              initialInput={{ rows_count: preparedRows.length, job_id: jobId || null }}
            >
              {({ submitToApi }) => processingOrResults(submitToApi)}
            </EmailGate>
          )}

        {resumeBypassGate &&
          (appState === 'processing' || appState === 'results') &&
          processingOrResults()}

        {appState === 'error' && (
          <section className="bef-panel error">
            <h2>Bulk Email Finder failed</h2>
            <p>{errorMsg}</p>
            <div className="actions">
              <button type="button" onClick={handleReset}>
                Start again
              </button>
            </div>
          </section>
        )}

        <HowItWorks
          title={
            <>
              From spreadsheet to <span className="accent">enriched list</span>
            </>
          }
          subtitle="Upload once, map once, and get a downloadable CSV with confidence-tagged outcomes."
          steps={HOW_STEPS}
        />
      </main>
      <Footer />
      <PageScripts />
    </div>
  )
}

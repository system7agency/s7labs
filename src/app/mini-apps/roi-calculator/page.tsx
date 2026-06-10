'use client'

import { useCallback, useMemo, useRef, useState } from 'react'

import { clsx } from 'clsx'
import './page-styles.css'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { HowItWorks, type HowItWorksStep } from '@/components/mini-apps/HowItWorks'
import { InlineConsentField } from '@/components/mini-apps/InlineConsentField'
import { EMAIL_REGEX } from '@/lib/leads/disposable'
import { PageScripts } from './PageScripts'

type Inputs = {
  leads: number
  replyRate: number
  meetingRate: number
  closeRate: number
  avgDealSize: number
  campaignCost: number
}

type InputKey = keyof Inputs

type InputConfig = {
  key: InputKey
  label: string
  min: number
  max: number
  step: number
  prefix?: string
  suffix?: string
}

const DEFAULT_INPUTS: Inputs = {
  leads: 1000,
  replyRate: 5,
  meetingRate: 30,
  closeRate: 20,
  avgDealSize: 10000,
  campaignCost: 3000,
}

const INPUT_CONFIGS: InputConfig[] = [
  { key: 'leads', label: 'Leads contacted', min: 100, max: 50000, step: 10 },
  { key: 'replyRate', label: 'Reply rate', min: 0.5, max: 25, step: 0.5, suffix: '%' },
  { key: 'meetingRate', label: 'Reply to meeting', min: 5, max: 80, step: 0.5, suffix: '%' },
  { key: 'closeRate', label: 'Meeting to deal', min: 5, max: 60, step: 0.5, suffix: '%' },
  { key: 'avgDealSize', label: 'Avg deal size', min: 500, max: 250000, step: 100, prefix: '$' },
  { key: 'campaignCost', label: 'Campaign cost', min: 100, max: 100000, step: 100, prefix: '$' },
]

const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    title: 'Set your pipeline assumptions',
    description: 'Tune lead volume, conversion rates, deal size, and campaign spend with sliders.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <line x1="4" y1="6" x2="20" y2="6" />
        <circle cx="9" cy="6" r="2" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <circle cx="14" cy="12" r="2" />
        <line x1="4" y1="18" x2="20" y2="18" />
        <circle cx="11" cy="18" r="2" />
      </svg>
    ),
  },
  {
    title: 'See instant funnel math',
    description: 'Replies, meetings, and deals update live before you unlock the full report.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 4h18l-7 8v6l-4 2v-8L3 4z" />
      </svg>
    ),
  },
  {
    title: 'Unlock full ROI breakdown',
    description:
      'Get pipeline value, expected revenue, ROI multiple, and efficiency metrics in one view.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 19h16" />
        <rect x="6" y="10" width="3" height="7" />
        <rect x="11" y="7" width="3" height="10" />
        <rect x="16" y="4" width="3" height="13" />
      </svg>
    ),
  },
  {
    title: 'Use the what-if signal',
    description: 'Spot the upside of a +1% reply rate and prioritize the biggest leverage point.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 16l6-6 4 4 6-8" />
        <path d="M20 6v4h-4" />
      </svg>
    ),
  },
]

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step
}

function sanitizeValue(value: number, config: InputConfig): number {
  const rounded = roundToStep(value, config.step)
  return clamp(rounded, config.min, config.max)
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString()
}

function formatMoney(value: number): string {
  return '$' + Math.round(value).toLocaleString()
}

function formatPercent(value: number): string {
  const withTenths = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)
  return withTenths + '%'
}

function buildLeadInput(nextInputs: Inputs) {
  return {
    leads_contacted: nextInputs.leads,
    reply_rate_pct: nextInputs.replyRate,
    reply_to_meeting_pct: nextInputs.meetingRate,
    meeting_to_deal_pct: nextInputs.closeRate,
    avg_deal_size_usd: nextInputs.avgDealSize,
    campaign_cost_usd: nextInputs.campaignCost,
  }
}

export default function RoiCalculatorPage() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [marketingConsent, setMarketingConsent] = useState(true)
  const [shakeEmail, setShakeEmail] = useState(0)
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')
  const topRef = useRef<HTMLElement | null>(null)
  const leadSubmittedRef = useRef(false)

  const calculated = useMemo(() => {
    const replyRateFraction = inputs.replyRate / 100
    const meetingFraction = inputs.meetingRate / 100
    const closeFraction = inputs.closeRate / 100

    const replies = inputs.leads * replyRateFraction
    const meetings = replies * meetingFraction
    const deals = meetings * closeFraction

    const pipelineValue = meetings * inputs.avgDealSize
    const expectedRevenue = deals * inputs.avgDealSize

    const roiRaw = inputs.campaignCost > 0 ? expectedRevenue / inputs.campaignCost : null
    const costPerMeetingRaw = meetings > 0 ? inputs.campaignCost / meetings : null
    const costPerDealRaw = deals > 0 ? inputs.campaignCost / deals : null

    const whatIfReplyRate = Math.min(25, inputs.replyRate + 1)
    const whatIfReplies = inputs.leads * (whatIfReplyRate / 100)
    const whatIfMeetings = whatIfReplies * meetingFraction
    const whatIfPipeline = whatIfMeetings * inputs.avgDealSize
    const whatIfPipelineDelta = Math.max(0, whatIfPipeline - pipelineValue)

    return {
      replies,
      meetings,
      deals,
      pipelineValue,
      expectedRevenue,
      roiRaw,
      costPerMeetingRaw,
      costPerDealRaw,
      whatIfPipelineDelta,
      whatIfReplyRate,
    }
  }, [inputs])

  const headlineRoi = useMemo(() => {
    if (calculated.roiRaw === null || !Number.isFinite(calculated.roiRaw)) return 'n/a'
    if (calculated.roiRaw >= 999) return '999x+'
    return `${calculated.roiRaw.toFixed(1)}x`
  }, [calculated.roiRaw])

  const submitLead = useCallback(
    async (nextInputs: Inputs, requireValid = false): Promise<boolean> => {
      if (leadSubmittedRef.current) return true

      const emailClean = email.trim().toLowerCase()
      if (!emailClean) {
        if (requireValid) {
          setEmailError('Please enter your work email.')
          setShakeEmail((k) => k + 1)
        }
        return false
      }
      if (!EMAIL_REGEX.test(emailClean)) {
        if (requireValid) {
          setEmailError('Please enter a valid email.')
          setShakeEmail((k) => k + 1)
        }
        return false
      }

      try {
        const res = await fetch('/api/leads/submit', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email: emailClean,
            miniAppSlug: 'roi-calculator',
            input: buildLeadInput(nextInputs),
            marketingConsent,
          }),
        })
        const json = (await res.json()) as { ok?: boolean; error?: string }
        if (!res.ok || !json.ok) {
          if (requireValid) {
            setEmailError(json.error || "Couldn't save your info. Try again.")
            setShakeEmail((k) => k + 1)
          }
          return false
        }
        leadSubmittedRef.current = true
        setEmailError(null)
        return true
      } catch {
        if (requireValid) {
          setEmailError("Couldn't save your info. Try again.")
          setShakeEmail((k) => k + 1)
        }
        return false
      }
    },
    [email, marketingConsent]
  )

  const setInput = useCallback(
    (key: InputKey, rawValue: number) => {
      const config = INPUT_CONFIGS.find((cfg) => cfg.key === key)
      if (!config || Number.isNaN(rawValue)) return
      const nextValue = sanitizeValue(rawValue, config)
      setInputs((prev) => {
        const next = { ...prev, [key]: nextValue }
        void submitLead(next)
        return next
      })
    },
    [submitLead]
  )

  const handleRecalculate = () => {
    void submitLead(inputs, true)
    setInputs(DEFAULT_INPUTS)
    setCopyState('idle')
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleCopy = async () => {
    await submitLead(inputs, true)
    const rows = [
      'ROI Calculator Results',
      '----------------------',
      `Leads contacted: ${formatNumber(inputs.leads)}`,
      `Reply rate: ${formatPercent(inputs.replyRate)}`,
      `Reply to meeting: ${formatPercent(inputs.meetingRate)}`,
      `Meeting to deal: ${formatPercent(inputs.closeRate)}`,
      `Avg deal size: ${formatMoney(inputs.avgDealSize)}`,
      `Campaign cost: ${formatMoney(inputs.campaignCost)}`,
      '',
      `Replies: ${formatNumber(calculated.replies)}`,
      `Meetings: ${formatNumber(calculated.meetings)}`,
      `Deals: ${formatNumber(calculated.deals)}`,
      `Pipeline value: ${formatMoney(calculated.pipelineValue)}`,
      `Expected revenue: ${formatMoney(calculated.expectedRevenue)}`,
      `ROI multiple: ${
        calculated.roiRaw === null || !Number.isFinite(calculated.roiRaw)
          ? 'n/a'
          : `${calculated.roiRaw.toFixed(1)}x`
      }`,
      `Cost per meeting: ${
        calculated.costPerMeetingRaw === null || !Number.isFinite(calculated.costPerMeetingRaw)
          ? 'n/a'
          : formatMoney(calculated.costPerMeetingRaw)
      }`,
      `Cost per deal: ${
        calculated.costPerDealRaw === null || !Number.isFinite(calculated.costPerDealRaw)
          ? 'n/a'
          : formatMoney(calculated.costPerDealRaw)
      }`,
      `What-if (+1% reply rate) adds: ${formatMoney(calculated.whatIfPipelineDelta)} pipeline`,
    ]
    await navigator.clipboard.writeText(rows.join('\n'))
    setCopyState('copied')
    window.setTimeout(() => setCopyState('idle'), 1600)
  }

  return (
    <div className="roi-calculator mini-app-scope">
      <AuroraBackground />
      <Header />

      <main className="shell" ref={topRef}>
        <section className="hero">
          <span className="eyebrow">ROI Calculator</span>
          <h1>
            Estimate pipeline upside before you ship your next{' '}
            <span className="accent">outreach campaign</span>.
          </h1>
          <p>Tune six assumptions and watch your funnel and ROI breakdown update instantly.</p>
        </section>

        <section className="input-panel">
          {INPUT_CONFIGS.map((config) => {
            const value = inputs[config.key]
            return (
              <div className="input-row" key={config.key}>
                <div className="input-row-head">
                  <label htmlFor={`field-${config.key}`}>{config.label}</label>
                  <span className="value-pill">
                    {config.prefix}
                    {config.key === 'leads' ? formatNumber(value) : value.toLocaleString()}
                    {config.suffix}
                  </span>
                </div>
                <div className="input-row-controls">
                  <input
                    className="slider"
                    id={`field-${config.key}`}
                    type="range"
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    value={value}
                    onChange={(event) => setInput(config.key, Number(event.target.value))}
                  />
                  <div className="number-wrap">
                    {config.prefix ? <span className="affix">{config.prefix}</span> : null}
                    <input
                      className="number"
                      type="number"
                      min={config.min}
                      max={config.max}
                      step={config.step}
                      value={value}
                      onChange={(event) => setInput(config.key, Number(event.target.value))}
                    />
                    {config.suffix ? <span className="affix">{config.suffix}</span> : null}
                  </div>
                </div>
              </div>
            )
          })}
          <div className="email-field">
            <div className="idle-label">
              Work email <span className="required-mark">*</span>
            </div>
            <div key={`e-${shakeEmail}`} className={clsx('pd-input-box', { error: emailError })}>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (emailError) setEmailError(null)
                }}
              />
            </div>
            <div className={clsx('pd-helper', { error: emailError })}>
              {emailError ?? 'We send the report to your work email. No spam.'}
            </div>
            <InlineConsentField checked={marketingConsent} onChange={setMarketingConsent} />
          </div>
        </section>

        <section className="mini-counters">
          <article className="counter-card">
            <span className="counter-label">Replies</span>
            <strong>{formatNumber(calculated.replies)}</strong>
          </article>
          <article className="counter-card">
            <span className="counter-label">Meetings</span>
            <strong>{formatNumber(calculated.meetings)}</strong>
          </article>
          <article className="counter-card">
            <span className="counter-label">Deals</span>
            <strong>{formatNumber(calculated.deals)}</strong>
          </article>
        </section>

        <section className="results">
          <article className="roi-headline">
            <span className="roi-label">Projected ROI</span>
            <h2>{headlineRoi}</h2>
            <p>
              Expected revenue of <strong>{formatMoney(calculated.expectedRevenue)}</strong> from a{' '}
              <strong>{formatMoney(inputs.campaignCost)}</strong> campaign.
            </p>
          </article>

          <article className="result-block">
            <h3>Funnel breakdown</h3>
            <table className="funnel-table">
              <tbody>
                <tr>
                  <th>Replies</th>
                  <td>{formatNumber(calculated.replies)}</td>
                </tr>
                <tr>
                  <th>Meetings</th>
                  <td>{formatNumber(calculated.meetings)}</td>
                </tr>
                <tr>
                  <th>Deals</th>
                  <td>{formatNumber(calculated.deals)}</td>
                </tr>
                <tr>
                  <th>Pipeline value</th>
                  <td>{formatMoney(calculated.pipelineValue)}</td>
                </tr>
                <tr>
                  <th>Expected revenue</th>
                  <td>{formatMoney(calculated.expectedRevenue)}</td>
                </tr>
                <tr>
                  <th>ROI multiple (exact)</th>
                  <td>
                    {calculated.roiRaw === null || !Number.isFinite(calculated.roiRaw)
                      ? 'n/a'
                      : `${calculated.roiRaw.toFixed(1)}x`}
                  </td>
                </tr>
              </tbody>
            </table>
          </article>

          <article className="result-block">
            <h3>Cost efficiency</h3>
            <div className="efficiency-grid">
              <div className="efficiency-item">
                <span>Cost per meeting</span>
                <strong
                  className={clsx({
                    na: calculated.costPerMeetingRaw === null,
                  })}
                >
                  {calculated.costPerMeetingRaw === null ||
                  !Number.isFinite(calculated.costPerMeetingRaw)
                    ? 'n/a'
                    : formatMoney(calculated.costPerMeetingRaw)}
                </strong>
              </div>
              <div className="efficiency-item">
                <span>Cost per deal</span>
                <strong
                  className={clsx({
                    na: calculated.costPerDealRaw === null,
                  })}
                >
                  {calculated.costPerDealRaw === null || !Number.isFinite(calculated.costPerDealRaw)
                    ? 'n/a'
                    : formatMoney(calculated.costPerDealRaw)}
                </strong>
              </div>
            </div>
            <p className="what-if">
              What-if: +1% reply rate ({formatPercent(inputs.replyRate)} →{' '}
              {formatPercent(calculated.whatIfReplyRate)}) adds{' '}
              <strong>{formatMoney(calculated.whatIfPipelineDelta)}</strong> in potential pipeline.
            </p>
          </article>

          <div className="result-actions">
            <button type="button" className="ghost" onClick={handleRecalculate}>
              Recalculate
            </button>
            <button
              type="button"
              className={clsx('ghost', { copied: copyState === 'copied' })}
              onClick={handleCopy}
            >
              {copyState === 'copied' ? 'Copied' : 'Copy results'}
            </button>
            <a
              className="primary"
              href="https://www.system7.ai/contact"
              target="_blank"
              rel="noreferrer"
            >
              Book a call
            </a>
          </div>
        </section>

        <HowItWorks
          title={
            <>
              From assumptions to <span className="accent">ROI clarity</span>
            </>
          }
          subtitle="Quantify pipeline impact in minutes, then act on the highest-leverage metric."
          steps={HOW_IT_WORKS_STEPS}
        />
      </main>

      <Footer />
      <PageScripts />
    </div>
  )
}

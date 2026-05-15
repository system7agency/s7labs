'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'

import './page-styles.css'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

import { PageScripts } from './PageScripts'

type AppState = 'cta' | 'email' | 'submitting' | 'success'

type SubmitResponse =
  | { ok: true; state: 'processing' | 'cached'; message: string }
  | { ok: false; state: 'rejected'; reason: string; message: string }
  | { ok: false; state: 'error'; message: string }

const READOUT_TL: Record<AppState, string> = {
  cta: '// IDLE',
  email: '// AWAITING EMAIL',
  submitting: '// PROVISIONING',
  success: '// AGENT.LIVE',
}
const READOUT_TR: Record<AppState, string> = {
  cta: 'READY',
  email: 'INPUT',
  submitting: 'LIVE',
  success: 'OK',
}

function validateEmailFormat(value: string): { ok: true } | { ok: false; msg: string } {
  const v = (value || '').trim().toLowerCase()
  if (!v) return { ok: false, msg: 'Please enter your work email.' }
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  if (!re.test(v)) return { ok: false, msg: "That email doesn't look right. Try again." }
  return { ok: true }
}

type VoiceAgentGlobal = { pulse?: () => void }
function pulseWaveform() {
  const g = (window as unknown as { VOICE_AGENT?: VoiceAgentGlobal }).VOICE_AGENT
  g?.pulse?.()
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  )
}

export default function VoiceAgentPage() {
  const [appState, setAppState] = useState<AppState>('cta')
  const [email, setEmail] = useState('')
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [shakeKey, setShakeKey] = useState(0)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isCached, setIsCached] = useState(false)

  const emailInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (appState === 'email') {
      const t = setTimeout(() => emailInputRef.current?.focus(), 350)
      return () => clearTimeout(t)
    }
  }, [appState])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (appState === 'submitting') return
      const result = validateEmailFormat(email)
      if (!result.ok) {
        setEmailError(result.msg)
        setShakeKey((k) => k + 1)
        return
      }
      setEmailError(null)
      const normalized = email.trim().toLowerCase()
      setSubmittedEmail(normalized)
      setAppState('submitting')
      pulseWaveform()

      let body: SubmitResponse
      try {
        const res = await fetch('/api/revops/sales-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalized, type: 'speak' }),
        })
        body = (await res.json()) as SubmitResponse
      } catch {
        setAppState('email')
        setEmailError('Something went wrong. Please try again.')
        setShakeKey((k) => k + 1)
        return
      }

      if (body.ok) {
        setSuccessMessage(body.message)
        setIsCached(body.state === 'cached')
        setAppState('success')
        return
      }

      // Override rejected copy with voice-agent-specific wording.
      // The shared handler returns sales-insights default messages, which
      // would say "use your work email" rather than "build the rep from
      // your company's domain". Translate from the structured `reason`.
      let msg = 'Something went wrong. Please try again.'
      if (body.state === 'rejected') {
        if (body.reason === 'free_email_domain') {
          msg = "Use your business email so we can build the rep from your company's domain."
        } else if (body.reason === 'invalid_email_format') {
          msg = "That email doesn't look right. Try again."
        } else {
          msg = body.message
        }
      }
      setAppState('email')
      setEmailError(msg)
      setShakeKey((k) => k + 1)
    },
    [appState, email]
  )

  const submitting = appState === 'submitting'

  return (
    <>
      <div className="bg-stack" aria-hidden="true">
        <canvas id="aurora" />
        <div className="bg-dots" id="bgDots" />
      </div>
      <div className="bg-spotlight" id="spotlight" aria-hidden="true" />
      <div className="bg-grain" aria-hidden="true" />

      <Header />

      <main>
        {/* HERO — matches /revops/sales-insights structure */}
        <section className="hero">
          <div className="lab-wordmark">
            <span className="acc">
              S<sup className="wordmark-superscript">7</sup>
            </span>{' '}
            · LABS
          </div>
          <div className="hero-eyebrow">
            <span className="accent-dot" />
            ROUTE_02 — REVOPS LAB · VOICE AGENT
          </div>
          <h1 className="hero-title">
            A phone number that knows your <span className="accent-word">business</span>
          </h1>
          <p className="hero-subtitle">
            Drop your work email. We read your domain, brief an AI voice sales rep on your
            positioning, ICP and value props, and email you a real US number to call — usually in a
            few minutes.
          </p>
          <div className="hero-meta">
            <span>POSITIONING</span>
            <span className="sep" />
            <span>ICP</span>
            <span className="sep" />
            <span>LIVE NUMBER</span>
            <span className="sep" />
            <span>REAL CALLS</span>
          </div>
        </section>

        <section className="panel">
          <div className="panel-frame">
            <span className="br-tl" />
            <span className="br-bl" />
            <span className="panel-readout tl">{READOUT_TL[appState]}</span>
            <span className="panel-readout tr">
              CH·02 <span className="v">{READOUT_TR[appState]}</span>
            </span>
            <span className="panel-readout bl">FREE BETA</span>
            <span className="panel-readout br">
              λ S<sup className="wordmark-superscript">7</sup>·SPEAK
            </span>

            {appState === 'cta' ? (
              <div className="panel-state">
                <button className="va-cta-btn" type="button" onClick={() => setAppState('email')}>
                  <span>Provision my AI rep</span>
                  <span className="arrow">
                    <ArrowIcon />
                  </span>
                </button>
                <div className="va-cta-helper">
                  <span className="tag">FREE</span>during beta · A real phone number arrives by
                  email
                </div>
              </div>
            ) : appState === 'email' || appState === 'submitting' ? (
              <div className="panel-state">
                <form className="va-form" noValidate onSubmit={handleSubmit}>
                  <div className="va-form-eyebrow">work email · enter to provision</div>
                  <div key={shakeKey} className={`va-email-row ${emailError ? 'error' : ''}`}>
                    <span className="prompt">$</span>
                    <input
                      ref={emailInputRef}
                      type="email"
                      placeholder="you@yourcompany.com"
                      autoComplete="email"
                      spellCheck={false}
                      value={email}
                      disabled={submitting}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (emailError) setEmailError(null)
                      }}
                    />
                    <button
                      className="va-submit"
                      type="submit"
                      disabled={submitting}
                      aria-label="Submit"
                    >
                      <span>{submitting ? 'Provisioning' : 'Provision'}</span>
                      <span className="arrow">
                        <ArrowIcon />
                      </span>
                    </button>
                  </div>
                  <div className={`va-helper ${emailError ? 'error' : ''}`}>
                    {emailError ? (
                      <>
                        <span className="err-dot" />
                        {emailError}
                      </>
                    ) : (
                      <>
                        <span className="ok-dot" />A real US phone number arrives by email in{' '}
                        <span className="v">~30 seconds</span>.
                      </>
                    )}
                  </div>
                </form>
              </div>
            ) : (
              <div className="panel-state">
                <div className="va-success">
                  <div className="va-success-glyph" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <h2>{isCached ? 'Your AI rep is already live.' : 'Submission received.'}</h2>
                  <p>
                    {successMessage ??
                      (isCached ? (
                        <>
                          The number has been resent to{' '}
                          <span className="email">{submittedEmail}</span>.
                        </>
                      ) : (
                        <>
                          Your phone number is on its way to{' '}
                          <span className="email">{submittedEmail}</span>.
                        </>
                      ))}
                  </p>
                  <div className="va-success-meta">
                    <span className="live-dot" />
                    <span>
                      {isCached ? 'RESENT' : 'PROVISIONING'} · {submittedEmail || '—'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 02 — WHAT IT DOES */}
        <section className="va-uses">
          <div className="va-uses-head">
            <h2>What you can do with your AI rep.</h2>
            <span className="num">
              <span className="v">03</span> · USES
            </span>
          </div>
          <div className="va-uses-grid">
            <div className="va-use primary">
              <div className="tag">01 · pitch test</div>
              <h3>
                <span className="verb">Test your pitch.</span>
              </h3>
              <p>
                Call your rep, play a curious prospect, and hear it explain your business back to
                you. Five minutes will tell you more than five hours of message-doc edits.
              </p>
            </div>
            <div className="va-use">
              <div className="tag">02 · training</div>
              <h3>
                <span className="verb">Train</span> your team.
              </h3>
              <p>
                A safe, on-demand prospect for new SDRs and AEs to practice discovery, objections
                and demos against.
              </p>
            </div>
            <div className="va-use">
              <div className="tag">03 · stress test</div>
              <h3>
                <span className="verb">Stress-test</span> your positioning.
              </h3>
              <p>
                If the AI rep can&apos;t pitch your business clearly, your team probably can&apos;t
                either.
              </p>
            </div>
          </div>
        </section>

        {/* 03 — HOW IT KNOWS YOUR BUSINESS */}
        <section className="va-how">
          <div className="va-how-copy">
            <span className="tag">{'// how it knows your business'}</span>
            <h2>
              Built from one input: <span className="acc">your domain.</span>
            </h2>
            <p>
              We extract your company&apos;s positioning, ideal customer profile, value props and
              recent activity from your public domain. The AI rep is briefed from that — so when you
              call, it pitches your business, not a generic SaaS demo.
            </p>
          </div>
          <div className="va-pipeline">
            <div className="va-stage">
              <span className="n">01</span>
              <div className="body">
                <h4>Read</h4>
                <p>We read your domain — positioning, ICP, value props, recent activity.</p>
              </div>
              <span className="status">
                <span className="d" />
                parse
              </span>
            </div>
            <div className="va-stage">
              <span className="n">02</span>
              <div className="body">
                <h4>Structure</h4>
                <p>We build a brief the agent can use in real conversation.</p>
              </div>
              <span className="status">
                <span className="d" />
                compile
              </span>
            </div>
            <div className="va-stage">
              <span className="n">03</span>
              <div className="body">
                <h4>Provision</h4>
                <p>The voice agent is wired to a phone number on Twilio.</p>
              </div>
              <span className="status">
                <span className="d" />
                wire
              </span>
            </div>
            <div className="va-stage">
              <span className="n">04</span>
              <div className="body">
                <h4>Live</h4>
                <p>You get the number by email. Call it. It&apos;s ready.</p>
              </div>
              <span className="status">
                <span className="d" />
                live
              </span>
            </div>
          </div>
        </section>

        {/* 04 — WHAT TO TRY FIRST */}
        <section className="va-quote">
          <div className="label">what to try first</div>
          <blockquote>
            Call right now and play a curious prospect — it&apos;s{' '}
            <span className="acc">surprisingly fun</span> to hear an AI pitch your own business back
            to you.
          </blockquote>
        </section>

        {/* 05 — FAQ */}
        <section className="va-faq">
          <div className="va-faq-head">
            <h2>{'// short reassurances'}</h2>
            <span className="count">
              <span className="v">04</span> · FAQ
            </span>
          </div>
          <div className="va-faq-list">
            <div className="va-faq-item">
              <p className="q">What happens to my email?</p>
              <p className="a">
                We use it to send you the phone number. We don&apos;t add you to any list.
              </p>
            </div>
            <div className="va-faq-item">
              <p className="q">Is this a real phone number?</p>
              <p className="a">Yes. A live US number that connects to your AI rep.</p>
            </div>
            <div className="va-faq-item">
              <p className="q">How long does provisioning take?</p>
              <p className="a">Usually a few minutes. The number arrives by email.</p>
            </div>
            <div className="va-faq-item">
              <p className="q">Can I get a new one if my company changes?</p>
              <p className="a">Yes — submit again with the same domain and we&apos;ll resend.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <PageScripts />
    </>
  )
}

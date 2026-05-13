'use client'

import { useEffect, useRef, useState } from 'react'

import type { MiniApp } from '../_data/apps'

type InterestedModalProps = {
  app: MiniApp | null
  initialIntent?: IntentValue
  onClose: () => void
}

type IntentValue = 'use' | 'similar' | 'customise' | 'different'

const INTENT_OPTIONS: { value: IntentValue; label: string }[] = [
  { value: 'use', label: 'Use this app' },
  { value: 'similar', label: 'Build something similar' },
  { value: 'customise', label: 'Customise this' },
  { value: 'different', label: 'Discuss a different idea' },
]

export function InterestedModal({ app, initialIntent = 'use', onClose }: InterestedModalProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const [intent, setIntent] = useState<IntentValue>(initialIntent)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const title = app ? `Interested in ${app.name}?` : 'Suggest a mini-app.'
  const lead = app
    ? "Tell us a little about how you'd want to use it."
    : "Tell us about the idea — we'll come back to you within 24 hours."

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const payload = {
      name: data.get('name'),
      email: data.get('email'),
      company: data.get('company'),
      intent,
      message: data.get('message'),
      app_id: app?.id ?? '',
      app_name: app?.name ?? '',
      category: app?.category ?? '',
      source: 'mini-apps',
    }
    // TODO(SYS-501-followup): wire up the actual submission endpoint.
    // For now, we log to console so the page is usable end-to-end.
    console.warn('[mini-apps] interest registered (TODO: wire backend)', payload)
    setSubmitted(true)
  }

  return (
    <div
      className="mx-backdrop open"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="mx mx-int" role="dialog" aria-modal="true" aria-labelledby="intTitle">
        <button
          ref={closeRef}
          type="button"
          className="mx-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <div className="mx-eye">{'// REGISTER INTEREST'}</div>
        <h3 id="intTitle">{title}</h3>
        <p className="mx-lead mx-lead-int">{lead}</p>

        {submitted ? (
          <div className="int-success">
            <div className="is-mark">●</div>
            <div className="is-title">Interest registered.</div>
            <div className="is-sub">We&rsquo;ll come back to you within 24 hours.</div>
            <button type="button" className="ca-btn ca-ghost" onClick={onClose}>
              <span>Keep browsing mini-apps</span>
            </button>
          </div>
        ) : (
          <form className="int-form" onSubmit={handleSubmit} autoComplete="on">
            <div className="if-row">
              <label className="if-field">
                <span className="if-lbl">NAME</span>
                <input type="text" name="name" required placeholder="Your name" />
              </label>
              <label className="if-field">
                <span className="if-lbl">EMAIL</span>
                <input type="email" name="email" required placeholder="you@company.com" />
              </label>
            </div>
            <label className="if-field">
              <span className="if-lbl">
                COMPANY <span className="opt">· optional</span>
              </span>
              <input type="text" name="company" placeholder="Where you work" />
            </label>

            <div className="if-field">
              <span className="if-lbl">INTEREST TYPE</span>
              <div className="if-radios" role="radiogroup">
                {INTENT_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={intent === opt.value ? 'if-radio is-active' : 'if-radio'}
                  >
                    <input
                      type="radio"
                      name="intent"
                      value={opt.value}
                      checked={intent === opt.value}
                      onChange={() => setIntent(opt.value)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="if-field">
              <span className="if-lbl">
                MESSAGE <span className="opt">· optional</span>
              </span>
              <textarea name="message" rows={3} placeholder="Anything specific?" />
            </label>

            <input type="hidden" name="app_id" value={app?.id ?? ''} />
            <input type="hidden" name="app_name" value={app?.name ?? ''} />
            <input type="hidden" name="source" value="mini-apps" />

            <button className="ca-btn ca-primary if-submit" type="submit">
              <span>Register interest</span>
              <span className="arr" aria-hidden="true">
                →
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

'use client'

/*
 * ContactModal — the site's own contact pop-up (client asked for this in
 * place of linking out to system7.ai/contact). Opened from anywhere via
 * `openContactModal(source)`; posts to /api/contact, which forwards to the
 * n8n email webhook. Copy leans on the approved doc: "Tell us where the
 * friction is…", "Response within 24 hours · UK engineering".
 */

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence } from 'motion/react'

import { m, MotionRoot } from './Motion'
import styles from './ContactModal.module.css'

export const OPEN_CONTACT_EVENT = 's7:open-contact'

export type OpenContactDetail = { source?: string }

/** Open the contact modal from anywhere (client components only). */
export function openContactModal(source?: string) {
  window.dispatchEvent(
    new CustomEvent<OpenContactDetail>(OPEN_CONTACT_EVENT, { detail: { source } })
  )
}

type Status = 'idle' | 'sending' | 'sent' | 'error'

export function ContactModal() {
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState<string>('unknown')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const panelRef = useRef<HTMLDivElement | null>(null)
  const firstFieldRef = useRef<HTMLInputElement | null>(null)
  const lastFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<OpenContactDetail>).detail
      setSource(detail?.source ?? 'unknown')
      setStatus('idle')
      setErrorMsg(null)
      lastFocusRef.current = document.activeElement as HTMLElement | null
      setOpen(true)
    }
    window.addEventListener(OPEN_CONTACT_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_CONTACT_EVENT, onOpen)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    lastFocusRef.current?.focus?.()
  }, [])

  // Esc to close; lock body scroll while open; focus the first field.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)

    // Lock background scroll while the modal is open. Setting overflow on
    // <body> alone isn't enough — the page can scroll on <html>, and iOS
    // Safari ignores body overflow — so lock both elements. We also pad for
    // the vanished scrollbar so the layout behind the backdrop doesn't shift.
    const { body, documentElement: html } = document
    const scrollbarW = window.innerWidth - html.clientWidth
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPadRight: body.style.paddingRight,
    }
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    if (scrollbarW > 0) body.style.paddingRight = `${scrollbarW}px`

    const t = window.setTimeout(() => firstFieldRef.current?.focus(), 120)
    return () => {
      document.removeEventListener('keydown', onKey)
      html.style.overflow = prev.htmlOverflow
      body.style.overflow = prev.bodyOverflow
      body.style.paddingRight = prev.bodyPadRight
      window.clearTimeout(t)
    }
  }, [open, close])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === 'sending') return
    const form = e.currentTarget
    const data = new FormData(form)
    const payload = {
      name: String(data.get('name') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      company: String(data.get('company') ?? '').trim(),
      message: String(data.get('message') ?? '').trim(),
      website: String(data.get('website') ?? ''), // honeypot
      source,
      page: window.location.pathname,
    }
    setStatus('sending')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setStatus('sent')
        return
      }
      const body = (await res.json().catch(() => null)) as { error?: string } | null
      setStatus('error')
      setErrorMsg(body?.error ?? 'Something went wrong. Please try again.')
    } catch {
      setStatus('error')
      setErrorMsg('Could not reach the server. Please try again.')
    }
  }

  return (
    <MotionRoot>
      <AnimatePresence>
        {open && (
          <m.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) close()
            }}
          >
            <m.div
              ref={panelRef}
              className={styles.panel}
              role="dialog"
              aria-modal="true"
              aria-labelledby="contact-modal-title"
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <span className={styles.cornerTl} aria-hidden="true" />
              <span className={styles.cornerBr} aria-hidden="true" />

              <button type="button" className={styles.close} onClick={close} aria-label="Close">
                ×
              </button>

              <div className={styles.copy}>
                <span className={styles.eyebrow}>
                  <span className={styles.slashes}>{'//'}</span> CONTACT
                </span>
                <h2 id="contact-modal-title" className={styles.title}>
                  Tell us where <span className={styles.accent}>the friction is.</span>
                </h2>
                <p className={styles.sub}>
                  We&rsquo;ll map the system around it. A short note on what your team keeps doing
                  by hand is the perfect start.
                </p>
                <div className={styles.note}>
                  <span className={styles.noteDot} aria-hidden="true" />
                  <span>
                    Response within <span className={styles.noteStrong}>24 hours</span>
                  </span>
                  <span className={styles.noteSep} aria-hidden="true" />
                  <span>UK engineering</span>
                </div>
              </div>

              <div className={styles.formCol}>
                {status === 'sent' ? (
                  <m.div
                    className={styles.sent}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
                  >
                    <span className={styles.sentMark} aria-hidden="true">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <span className={styles.sentTitle}>Sent.</span>
                    <span className={styles.sentSub}>
                      We&rsquo;ll come back to you within 24 hours.
                    </span>
                    <button type="button" className={styles.submit} onClick={close}>
                      <span>Done</span>
                    </button>
                  </m.div>
                ) : (
                  <form className={styles.form} onSubmit={handleSubmit} noValidate={false}>
                    <div className={styles.row}>
                      <label className={styles.field}>
                        <span className={styles.label}>Name</span>
                        <input
                          ref={firstFieldRef}
                          className={styles.input}
                          type="text"
                          name="name"
                          autoComplete="name"
                          required
                          maxLength={100}
                          placeholder="Your name"
                        />
                      </label>
                      <label className={styles.field}>
                        <span className={styles.label}>Work email</span>
                        <input
                          className={styles.input}
                          type="email"
                          name="email"
                          autoComplete="email"
                          required
                          maxLength={200}
                          placeholder="you@company.com"
                        />
                      </label>
                    </div>

                    <label className={styles.field}>
                      <span className={styles.label}>
                        Company <span className={styles.optional}>optional</span>
                      </span>
                      <input
                        className={styles.input}
                        type="text"
                        name="company"
                        autoComplete="organization"
                        maxLength={150}
                        placeholder="Company name"
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.label}>Where&rsquo;s the friction?</span>
                      <textarea
                        className={styles.textarea}
                        name="message"
                        required
                        minLength={10}
                        maxLength={2000}
                        rows={4}
                        placeholder="The manual process that will not go away - quoting, approvals, routing, reporting…"
                      />
                    </label>

                    {/* honeypot — humans never see or fill this */}
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      className={styles.hp}
                    />

                    {status === 'error' && errorMsg && (
                      <div className={styles.error} role="alert">
                        {errorMsg}
                      </div>
                    )}

                    <button type="submit" className={styles.submit} disabled={status === 'sending'}>
                      {status === 'sending' ? (
                        <>
                          <span className={styles.spinner} aria-hidden="true" />
                          <span>Sending…</span>
                        </>
                      ) : (
                        <>
                          <span>Send message</span>
                          <span className={styles.arr} aria-hidden="true">
                            →
                          </span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </MotionRoot>
  )
}

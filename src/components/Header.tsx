'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { TalkToSystem7Modal } from './TalkToSystem7Modal'
import './Header.css'

type HeaderProps = {
  /** Where the back-arrow + System7 logo links to. Defaults to the parent System7 marketing site. */
  backHref?: string
}

const SCROLL_THRESHOLD = 80

export function Header({ backHref = 'https://www.system7.ai/' }: HeaderProps) {
  const [hidden, setHidden] = useState(false)
  const [callOpen, setCallOpen] = useState(false)

  useEffect(() => {
    let ticking = false
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY
        if (currentScrollY < SCROLL_THRESHOLD) {
          setHidden(false)
        } else if (currentScrollY > lastScrollY) {
          setHidden(true)
        } else if (currentScrollY < lastScrollY) {
          setHidden(false)
        }
        lastScrollY = currentScrollY
        ticking = false
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={hidden ? 'header-hidden' : undefined} inert={hidden || undefined}>
      <div className="header-left">
        <a
          className="back-link"
          href={backHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Back to System7"
        >
          <span className="back-link-arrow" aria-hidden="true">
            ←
          </span>
          <span className="back-link-logo">
            system<sup className="wordmark-superscript">7</sup>
          </span>
        </a>
      </div>
      <Link href="/" className="wordmark" aria-label="S7 Labs home">
        <span className="wordmark-arrow" aria-hidden="true">
          ←
        </span>
        <span className="dot" />
        <span className="wordmark-s7">
          S<sup className="wordmark-s7-sup">7</sup>
        </span>
        <span className="wordmark-labs">LABS</span>
      </Link>
      <div className="header-right">
        <a
          href="https://www.linkedin.com/company/system7agency/"
          className="li-btn"
          aria-label="LinkedIn"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.14 8h4.72V23H.14V8zm7.58 0h4.52v2.05h.06c.63-1.2 2.17-2.46 4.47-2.46 4.78 0 5.66 3.14 5.66 7.22V23h-4.71v-6.67c0-1.59-.03-3.64-2.22-3.64-2.22 0-2.56 1.74-2.56 3.52V23H7.72V8z" />
          </svg>
          <span className="li-label">LinkedIn</span>
        </a>
        <button
          type="button"
          className="phone-pill"
          aria-label="Call System 7 — voice agent"
          onClick={() => setCallOpen(true)}
        >
          <span className="live-dot" />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span className="label">
            Talk to system<sup className="wordmark-superscript">7</sup>
          </span>
        </button>
      </div>
      <TalkToSystem7Modal open={callOpen} onClose={() => setCallOpen(false)} />
    </header>
  )
}

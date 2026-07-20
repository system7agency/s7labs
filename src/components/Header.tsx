'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { openContactModal } from './ContactModal'
import { OPEN_CHAT_WIDGET_EVENT } from './S7ChatWidget'
import { System7Logo } from './System7Logo'
import './Header.css'

type HeaderProps = {
  /** Where the back-arrow + System7 logo links to. Defaults to the parent System7 marketing site. */
  backHref?: string
}

const SCROLL_THRESHOLD = 80

const NAV_ROUTES = [
  { index: '01', label: 'RevOps', handle: 'revops_s7labs', href: '/revops' },
  { index: '02', label: 'Agent', handle: 'agent_s7labs', href: '/agent' },
  { index: '03', label: 'Build', handle: 'build_s7labs', href: '/build' },
  { index: '04', label: 'Live Apps', handle: 'liveapps_s7labs', href: '/live-apps' },
]

export function Header({ backHref = 'https://www.system7.ai/' }: HeaderProps) {
  const [hidden, setHidden] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navRef = useRef<HTMLDivElement | null>(null)
  const pathname = usePathname()

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

  // Close the nav when clicking outside it, pressing Escape, or scrolling.
  useEffect(() => {
    if (!menuOpen) return
    const startY = window.scrollY
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) > 24) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll)
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  const headerHidden = hidden && !menuOpen

  return (
    <header
      className={headerHidden ? 'header-hidden' : undefined}
      inert={headerHidden || undefined}
    >
      <div className="header-left">
        <a
          className="back-link"
          href={backHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Back to System7"
        >
          <span className="back-chip" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </span>
          <System7Logo className="back-logo" height={15} />
        </a>
      </div>
      <Link href="/" className="wordmark" aria-label="S7 Labs home">
        <span className="wordmark-lockup">
          S<sup className="wordmark-s7-sup">7</sup> Labs
        </span>
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
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent(OPEN_CHAT_WIDGET_EVENT, { detail: { mode: 'voice' } })
            )
          }
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
        <div className="header-nav" ref={navRef}>
          <button
            type="button"
            className={menuOpen ? 'nav-burger is-open' : 'nav-burger'}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="header-nav-panel"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>

          <nav
            id="header-nav-panel"
            className={menuOpen ? 'nav-panel is-open' : 'nav-panel'}
            aria-label="Site navigation"
            inert={!menuOpen || undefined}
          >
            <div className="nav-panel-eyebrow">
              <span className="accent">{'// SELECT ROUTE'}</span>
              <span className="count">{`0${NAV_ROUTES.length} ROUTES`}</span>
            </div>
            <ul className="nav-list">
              {NAV_ROUTES.map((route) => {
                const active = pathname === route.href || pathname?.startsWith(`${route.href}/`)
                return (
                  <li key={route.href}>
                    <Link
                      href={route.href}
                      className={active ? 'nav-item is-active' : 'nav-item'}
                      aria-current={active ? 'page' : undefined}
                      onClick={closeMenu}
                    >
                      <span className="nav-index">{`ROUTE_${route.index}`}</span>
                      <span className="nav-label">{route.label}</span>
                      <span className="nav-handle">{`$ ${route.handle}`}</span>
                      <span className="nav-arrow" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
            <div className="nav-panel-foot">
              <div className="nav-foot-row">
                {/* Plain anchor so clicking HOME always does a full load, even
                    when already on the home page (client: "Home should refresh").
                    A <Link> would be a no-op on the current route. */}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a href="/" className="nav-foot-link" onClick={closeMenu}>
                  <span className="nav-index">HOME</span>
                  <span className="nav-label">
                    S<sup className="wordmark-superscript">7</sup> Labs
                  </span>
                </a>
                <a
                  href="https://www.system7.ai/"
                  className="nav-foot-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="nav-index">PARENT</span>
                  <span className="nav-label">
                    system<sup className="wordmark-superscript">7</sup>.ai ↗
                  </span>
                </a>
              </div>
              <button
                type="button"
                className="nav-foot-link nav-foot-contact"
                onClick={() => {
                  closeMenu()
                  openContactModal('header-menu')
                }}
              >
                <span className="nav-index">CONTACT</span>
                <span className="nav-label">Get in touch →</span>
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { clsx } from 'clsx'

import { SignOutButton } from './SignOutButton'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
}

const NAV: NavItem[] = [
  {
    href: '/insights',
    label: 'Overview',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/insights/submissions',
    label: 'Submissions',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h10" />
      </svg>
    ),
  },
  {
    href: '/insights/leads',
    label: 'Leads',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
        <circle cx="17" cy="10" r="2.4" />
        <path d="M14 20c0-2 1.6-3.4 3-3.4s3 1.4 3 3.4" />
      </svg>
    ),
  },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/insights') return pathname === '/insights'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Sidebar({ email, children }: { email: string | null; children: React.ReactNode }) {
  const pathname = usePathname() || '/insights'
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close drawer on route change — this is the intended sync to React state
  // from an external (URL) change, not a cascading update.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDrawerOpen(false)
  }, [pathname])

  return (
    <div className="ins-shell-wrap">
      {/* Mobile top bar with hamburger */}
      <div className="ins-mobile-topbar" aria-hidden={false}>
        <button
          type="button"
          className="ins-hamburger"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <span className="ins-mobile-title">Insights</span>
      </div>

      <aside
        className={clsx('ins-sidebar', { 'is-open': drawerOpen })}
        aria-label="Insights navigation"
      >
        <div className="ins-sidebar-head">
          <span className="ins-sidebar-brand">S7 Labs</span>
          <span className="ins-sidebar-sub">Insights</span>
        </div>

        <nav className="ins-sidebar-nav">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx('ins-nav-item', {
                'is-active': isActive(pathname, item.href),
              })}
            >
              <span className="ins-nav-icon" aria-hidden>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="ins-sidebar-foot">
          {email ? (
            <div className="ins-sidebar-user" title={email}>
              {email}
            </div>
          ) : null}
          <SignOutButton />
        </div>
      </aside>

      {/* Drawer backdrop (mobile) */}
      {drawerOpen ? (
        <button
          type="button"
          className="ins-drawer-backdrop"
          aria-label="Close navigation"
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}

      <div className="ins-shell-content">{children}</div>
    </div>
  )
}

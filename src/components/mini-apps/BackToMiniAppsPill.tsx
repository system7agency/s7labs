'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import styles from './BackToMiniAppsPill.module.css'

export function BackToMiniAppsPill() {
  const pathname = usePathname()
  if (!pathname || pathname === '/live-apps' || pathname === '/live-apps/') {
    return null
  }
  return (
    <Link href="/live-apps" className={styles.pill} aria-label="Back to all live apps">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
      <span>All live apps</span>
    </Link>
  )
}

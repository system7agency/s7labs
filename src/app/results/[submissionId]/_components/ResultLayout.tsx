import Link from 'next/link'
import type { ReactNode } from 'react'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'

import { ResultContextStrip } from './ResultContextStrip'
import styles from './results.module.css'

type Props = {
  children: ReactNode
  slug?: string
  miniAppName?: string
  createdAt?: string
  runAgainHref?: string
  runAgainLabel?: string
}

export function ResultLayout({
  children,
  slug,
  miniAppName,
  createdAt,
  runAgainHref,
  runAgainLabel,
}: Props) {
  return (
    <div className={styles.page}>
      <AuroraBackground />
      <Header />
      <main className={styles.main}>
        {slug && miniAppName && createdAt && (
          <ResultContextStrip slug={slug} miniAppName={miniAppName} createdAt={createdAt} />
        )}
        {children}
        {runAgainHref && (
          <Link href={runAgainHref} className={styles.runAgain}>
            ← Run {runAgainLabel ?? 'this'} again
          </Link>
        )}
      </main>
      <Footer />
    </div>
  )
}

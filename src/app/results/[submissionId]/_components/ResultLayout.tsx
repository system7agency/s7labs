import Link from 'next/link'
import type { ReactNode } from 'react'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
// The result components are styled against the `.mini-app-scope` design tokens,
// which are normally provided by the /mini-apps layout. This route lives outside
// that layout, so load the tokens here and apply the scope around the report.
import '@/styles/mini-app-tokens.css'
// Neutralises each app root's full-page wrapper (opaque --bg, min-height:100vh)
// so the report sits on this page's aurora background, not a black box.
import './result-embed.css'

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
        <div className="mini-app-scope result-embed">{children}</div>
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

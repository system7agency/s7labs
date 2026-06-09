import Link from 'next/link'

import { ResultLayout } from './ResultLayout'
import styles from './results.module.css'

type Props = { runAgainHref?: string; miniAppName?: string }

export function ExpiredState({ runAgainHref, miniAppName }: Props) {
  return (
    <ResultLayout>
      <section className={styles.card}>
        <span className={styles.cornerTopRight} aria-hidden="true" />
        <span className={styles.cornerBottomLeft} aria-hidden="true" />
        <span className={styles.monoLabel}>{'// RESULT · EXPIRED'}</span>
        <h1 className={styles.heading}>This result has expired.</h1>
        <p className={styles.body}>
          Results are kept for 30 days. This one is past that window. The good news is the mini-app
          is still live and a fresh run takes seconds.
        </p>
        {runAgainHref && (
          <Link href={runAgainHref} className={styles.primaryButton}>
            Run {miniAppName ?? 'mini-app'} again
          </Link>
        )}
      </section>
    </ResultLayout>
  )
}

import Link from 'next/link'

import { ResultLayout } from './ResultLayout'
import styles from './results.module.css'

type Props = { runAgainHref?: string; miniAppName?: string }

export function FailedState({ runAgainHref, miniAppName }: Props) {
  return (
    <ResultLayout>
      <section className={styles.card}>
        <span className={styles.cornerTopRight} aria-hidden="true" />
        <span className={styles.cornerBottomLeft} aria-hidden="true" />
        <span className={styles.monoLabel}>{'// RESULT · FAILED'}</span>
        <h1 className={styles.heading}>This run didn&apos;t finish.</h1>
        <p className={styles.body}>
          Something went wrong while generating your result. No charge, no record kept. Try again
          and it usually works on the second attempt.
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

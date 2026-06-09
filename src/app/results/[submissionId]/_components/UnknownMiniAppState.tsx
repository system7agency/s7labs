import Link from 'next/link'

import { ResultLayout } from './ResultLayout'
import styles from './results.module.css'

type Props = { slug: string }

export function UnknownMiniAppState({ slug }: Props) {
  return (
    <ResultLayout>
      <section className={styles.card}>
        <span className={styles.cornerTopRight} aria-hidden="true" />
        <span className={styles.cornerBottomLeft} aria-hidden="true" />
        <span className={styles.monoLabel}>{`// RESULT · UNKNOWN`}</span>
        <h1 className={styles.heading}>We can&apos;t render this result.</h1>
        <p className={styles.body}>
          The mini-app <span className={styles.subdued}>({slug})</span> isn&apos;t one we know how
          to display here. It may have been renamed or retired.
        </p>
        <Link href="/mini-apps" className={styles.primaryButton}>
          Browse mini-apps
        </Link>
      </section>
    </ResultLayout>
  )
}

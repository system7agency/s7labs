import { ResultLayout } from './ResultLayout'
import styles from './results.module.css'

type Props = { miniAppName?: string }

export function PendingState({ miniAppName }: Props) {
  return (
    <ResultLayout>
      <section className={styles.card}>
        <span className={styles.cornerTopRight} aria-hidden="true" />
        <span className={styles.cornerBottomLeft} aria-hidden="true" />
        <span className={styles.monoLabel}>{'// RESULT · PROCESSING'}</span>
        <h1 className={styles.heading}>
          <span className={styles.pulseDot} aria-hidden="true" />
          Still working on this one.
        </h1>
        <p className={styles.body}>
          {miniAppName ? `Your ${miniAppName} result` : 'Your result'} is still being generated.
          Refresh this page in a minute or two. If it keeps showing this, the run may have stalled
          and you can safely try the mini-app again.
        </p>
      </section>
    </ResultLayout>
  )
}

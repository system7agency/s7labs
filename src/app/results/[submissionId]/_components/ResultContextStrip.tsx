import { formatRelativeTime, RESULT_EXPIRY_DAYS, ageInDays } from './format-time'
import styles from './results.module.css'

type Props = {
  slug: string
  miniAppName: string
  createdAt: string
}

export function ResultContextStrip({ slug, miniAppName, createdAt }: Props) {
  const created = new Date(createdAt)
  const age = ageInDays(createdAt)
  const daysLeft = Math.max(0, Math.ceil(RESULT_EXPIRY_DAYS - age))
  const expired = age >= RESULT_EXPIRY_DAYS
  const slugLabel = slug.toUpperCase()
  return (
    <div className={styles.contextStrip}>
      <div className={styles.contextLeft}>{`// RESULT · ${slugLabel}`}</div>
      <div className={styles.contextCenter}>{miniAppName}</div>
      <div className={styles.contextRight}>
        <span>{formatRelativeTime(created)}</span>
        {!expired && (
          <span
            className={`${styles.daysBadge} ${daysLeft > 7 ? styles.daysBadgeOk : styles.daysBadgeWarn}`}
          >
            {daysLeft} DAY{daysLeft === 1 ? '' : 'S'} LEFT
          </span>
        )}
      </div>
    </div>
  )
}

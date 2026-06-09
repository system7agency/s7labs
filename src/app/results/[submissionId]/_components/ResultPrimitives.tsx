import type { ReactNode } from 'react'

import styles from './results.module.css'

export function ResultCard({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <section className={styles.card}>
      <span className={styles.cornerTopRight} aria-hidden="true" />
      <span className={styles.cornerBottomLeft} aria-hidden="true" />
      {label && <span className={styles.monoLabel}>{label}</span>}
      {children}
    </section>
  )
}

export function Section({
  title,
  heading,
  children,
}: {
  title?: string
  heading?: string
  children: ReactNode
}) {
  return (
    <div className={styles.section}>
      {title && <div className={styles.sectionTitle}>{title}</div>}
      {heading && <h2 className={styles.sectionHeading}>{heading}</h2>}
      {children}
    </div>
  )
}

export function BigScore({ value, suffix }: { value: ReactNode; suffix?: string }) {
  return (
    <div className={styles.bigScore}>
      {value}
      {suffix ? <span style={{ fontSize: 24, color: 'var(--color-fg-dim)' }}>{suffix}</span> : null}
    </div>
  )
}

export function GradePill({ grade }: { grade: string }) {
  const color =
    grade.startsWith('A') || grade.startsWith('B')
      ? '#04e3ee'
      : grade.startsWith('C')
        ? '#f59e0b'
        : '#ff6b6b'
  return (
    <span className={styles.gradePill} style={{ color }}>
      {grade}
    </span>
  )
}

export function KeyValueGrid({ rows }: { rows: Array<{ key: string; value: ReactNode }> }) {
  return (
    <div className={styles.kvGrid}>
      {rows.map((row, i) => (
        <span key={`${row.key}-${i}`} style={{ display: 'contents' }}>
          <span className={styles.kvKey}>{row.key}</span>
          <span className={styles.kvVal}>{row.value}</span>
        </span>
      ))}
    </div>
  )
}

export function BulletList({ items }: { items: Array<string | ReactNode> }) {
  return (
    <ul className={styles.bulletList}>
      {items.map((item, i) => (
        <li key={i}>
          <span className={styles.bulletMark} aria-hidden="true">
            &gt;
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function FlagsList({ items }: { items: string[] }) {
  return (
    <ul className={styles.flagsList}>
      {items.map((item, i) => (
        <li key={i} className={styles.flagItem}>
          {item}
        </li>
      ))}
    </ul>
  )
}

export function SubScoreCards({ scores }: { scores: Array<{ label: string; value: ReactNode }> }) {
  return (
    <div className={styles.subScores}>
      {scores.map((s, i) => (
        <div key={i} className={styles.subScoreCard}>
          <div className={styles.subScoreLabel}>{s.label}</div>
          <div className={styles.subScoreValue}>{s.value}</div>
        </div>
      ))}
    </div>
  )
}

export function ImpactBadge({ impact }: { impact: 'high' | 'medium' | 'low' | string }) {
  const cls =
    impact === 'high'
      ? styles.impactHigh
      : impact === 'medium'
        ? styles.impactMedium
        : styles.impactLow
  return <span className={`${styles.improvementImpact} ${cls}`}>{impact}</span>
}

export function ImprovementCard({
  rank,
  title,
  description,
  impact,
}: {
  rank?: number
  title: string
  description?: string
  impact?: string
}) {
  return (
    <div className={styles.improvementCard}>
      <div className={styles.improvementHead}>
        {typeof rank === 'number' && <span className={styles.improvementRank}>#{rank}</span>}
        <span className={styles.improvementTitle}>{title}</span>
        {impact && <ImpactBadge impact={impact} />}
      </div>
      {description && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{description}</p>}
    </div>
  )
}

export function PreBlock({ children }: { children: string }) {
  return <pre className={styles.preBlock}>{children}</pre>
}

export function ProviderCards({ items }: { items: Array<{ name: string; value: ReactNode }> }) {
  return (
    <div className={styles.providerGrid}>
      {items.map((p, i) => (
        <div key={i} className={styles.providerCard}>
          <div className={styles.providerName}>{p.name}</div>
          <div className={styles.providerValue}>{p.value}</div>
        </div>
      ))}
    </div>
  )
}

import { clsx } from 'clsx'

type Props = {
  title: string
  value?: string | null
  deltaLabel?: string
}

export function MetricCard({ title, value, deltaLabel }: Props) {
  const display = value ?? '—'
  return (
    <article className="ins-card">
      <h2 className="ins-card-title">{title}</h2>
      <div className={clsx('ins-metric-value', { placeholder: !value })}>{display}</div>
      <div className="ins-metric-delta">{deltaLabel ?? 'No data yet'}</div>
    </article>
  )
}

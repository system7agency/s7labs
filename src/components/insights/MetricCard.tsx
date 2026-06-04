import { clsx } from 'clsx'

type Props = {
  title: string
  value?: string | null
  delta?: { text: string; direction: 'up' | 'down' | 'flat' }
  error?: boolean
}

export function MetricCard({ title, value, delta, error }: Props) {
  const isPlaceholder = error || !value
  const display = error ? '—' : (value ?? '—')
  const deltaText = error ? 'Data unavailable' : (delta?.text ?? 'No data yet')
  const direction = error ? 'flat' : (delta?.direction ?? 'flat')
  return (
    <article className="ins-card">
      <h2 className="ins-card-title">{title}</h2>
      <div className={clsx('ins-metric-value', { placeholder: isPlaceholder })}>{display}</div>
      <div className={clsx('ins-metric-delta', `is-${direction}`)}>{deltaText}</div>
    </article>
  )
}

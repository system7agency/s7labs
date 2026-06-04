type Props = {
  id: string
  title: string
  value?: string | null
  deltaLabel?: string
}

export function MetricCard({ id, title, value, deltaLabel }: Props) {
  const display = value ?? '—'
  return (
    <article className="ins-card">
      <span className="ins-card-corner-bl" aria-hidden />
      <span className="ins-card-corner-br" aria-hidden />
      <header className="ins-card-head">
        <span className="ins-card-id">{id}</span>
        <span className="ins-card-title">{title}</span>
      </header>
      <div className={`ins-metric-value${value ? '' : 'placeholder'}`}>{display}</div>
      <div className="ins-metric-delta">{deltaLabel ?? '// no data yet'}</div>
    </article>
  )
}

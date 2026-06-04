type Props = {
  id: string
  title: string
  message?: string
}

export function ChartPlaceholder({ id, title, message }: Props) {
  return (
    <article className="ins-card">
      <span className="ins-card-corner-bl" aria-hidden />
      <span className="ins-card-corner-br" aria-hidden />
      <header className="ins-card-head">
        <span className="ins-card-id">{id}</span>
        <span className="ins-card-title">{title}</span>
      </header>
      <div className="ins-placeholder-body">{message ?? '// chart · coming soon'}</div>
    </article>
  )
}

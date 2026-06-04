type Props = {
  title: string
  message?: string
}

export function ChartPlaceholder({ title, message }: Props) {
  return (
    <article className="ins-card">
      <h2 className="ins-card-title">{title}</h2>
      <div className="ins-placeholder-body">{message ?? 'Chart coming soon.'}</div>
    </article>
  )
}

type Props = {
  id: string
  title: string
}

export function ActivityPlaceholder({ id, title }: Props) {
  return (
    <article className="ins-card">
      <span className="ins-card-corner-bl" aria-hidden />
      <span className="ins-card-corner-br" aria-hidden />
      <header className="ins-card-head">
        <span className="ins-card-id">{id}</span>
        <span className="ins-card-title">{title}</span>
      </header>
      <div className="ins-placeholder-body">
        {'// no submissions yet · activity feed wires up in the next pr'}
      </div>
    </article>
  )
}

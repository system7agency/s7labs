type Props = {
  title: string
}

export function ActivityPlaceholder({ title }: Props) {
  return (
    <article className="ins-card">
      <h2 className="ins-card-title">{title}</h2>
      <div className="ins-placeholder-body">
        No submissions yet. The activity feed lands in the next release.
      </div>
    </article>
  )
}

type StartBuildButtonProps = {
  variant?: 'solid' | 'ghost'
  label?: string
}

/* Primary CTA for the Build page ("Start a build"). Links to the System7
   contact page, matching the other primary CTAs across the site. */
export function StartBuildButton({ variant = 'solid', label = 'Start a build' }: StartBuildButtonProps) {
  const className = variant === 'ghost' ? 'btn ghost' : 'btn'

  return (
    <a className={className} href="https://www.system7.ai/contact">
      <span>{label}</span>
      <span className="arr" aria-hidden="true">
        →
      </span>
    </a>
  )
}

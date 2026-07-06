type DesignAgentButtonProps = {
  variant?: 'solid' | 'ghost'
  label?: string
}

/* Primary CTA for the Agent page ("Design an agent system"). Links to the
   System7 contact page, matching the other primary CTAs across the site. */
export function DesignAgentButton({
  variant = 'solid',
  label = 'Design an agent system',
}: DesignAgentButtonProps) {
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

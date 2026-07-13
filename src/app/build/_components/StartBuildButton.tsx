'use client'

import { openContactModal } from '@/components/ContactModal'

type StartBuildButtonProps = {
  variant?: 'solid' | 'ghost'
  label?: string
}

/* Primary CTA for the Build page ("Start a build"). Opens the site's own
   contact modal (client request, 09/07 review). */
export function StartBuildButton({
  variant = 'solid',
  label = 'Start a build',
}: StartBuildButtonProps) {
  const className = variant === 'ghost' ? 'btn ghost' : 'btn'

  return (
    <button type="button" className={className} onClick={() => openContactModal('build-start')}>
      <span>{label}</span>
      <span className="arr" aria-hidden="true">
        →
      </span>
    </button>
  )
}

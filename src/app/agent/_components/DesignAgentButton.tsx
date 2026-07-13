'use client'

import { openContactModal } from '@/components/ContactModal'

type DesignAgentButtonProps = {
  variant?: 'solid' | 'ghost'
  label?: string
}

/* Primary CTA for the Agent page ("Design an agent system"). Opens the
   site's own contact modal (client request, 09/07 review). */
export function DesignAgentButton({
  variant = 'solid',
  label = 'Design an agent system',
}: DesignAgentButtonProps) {
  const className = variant === 'ghost' ? 'btn ghost' : 'btn'

  return (
    <button type="button" className={className} onClick={() => openContactModal('agent-design')}>
      <span>{label}</span>
      <span className="arr" aria-hidden="true">
        →
      </span>
    </button>
  )
}

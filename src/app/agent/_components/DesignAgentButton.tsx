'use client'

import { useState } from 'react'

import { TalkToSystem7Modal } from '@/components/TalkToSystem7Modal'

type DesignAgentButtonProps = {
  variant?: 'solid' | 'ghost'
  label?: string
}

export function DesignAgentButton({
  variant = 'solid',
  label = 'Design an agent system',
}: DesignAgentButtonProps) {
  const [open, setOpen] = useState(false)
  const className = variant === 'ghost' ? 'btn ghost' : 'btn'

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        <span>{label}</span>
        <span className="arr" aria-hidden="true">
          →
        </span>
      </button>
      <TalkToSystem7Modal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

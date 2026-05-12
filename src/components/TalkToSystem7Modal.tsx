'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

import { VoiceAgentPanel } from './VoiceAgentPanel'
import './TalkToSystem7Modal.css'

type TalkToSystem7ModalProps = {
  open: boolean
  onClose: () => void
}

export function TalkToSystem7Modal({ open, onClose }: TalkToSystem7ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open || !mounted) return null

  return createPortal(
    <div
      className="t7-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="t7-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="t7-modal" ref={dialogRef}>
        <button type="button" className="t7-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <h2 id="t7-modal-title" className="t7-modal-title">
          Talk to system<sup className="wordmark-superscript">7</sup>
        </h2>
        <p className="t7-modal-sub">
          Real-time voice with our concierge agent. Ask about engagements, pricing, the labs, or
          what we&rsquo;d build for you.
        </p>

        <VoiceAgentPanel />

        <div className="t7-modal-foot">
          <span>ELEVENLABS · AGENT v1</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>,
    document.body
  )
}

'use client'

import { useVoiceAgentModal } from '@/components/VoiceAgentModalProvider'

export function VoiceAgentCard() {
  const { open } = useVoiceAgentModal()

  return (
    <button
      type="button"
      className="module"
      onClick={open}
      style={{
        font: 'inherit',
        textAlign: 'left',
        appearance: 'none',
        WebkitAppearance: 'none',
      }}
    >
      <span className="corner tl" />
      <span className="corner br" />
      <span className="mod-index" aria-hidden="true">
        02
      </span>
      <div>
        <h3 className="mod-name">Speak to Voice Agent</h3>
        <p className="mod-tagline">Talk to an AI voice agent trained on your pipeline.</p>
      </div>
      <span className="mod-cta">
        <span>Enter</span>
        <span className="a">→</span>
      </span>
    </button>
  )
}

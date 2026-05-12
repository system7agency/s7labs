'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

import { TalkToSystem7Modal } from './TalkToSystem7Modal'

type VoiceAgentModalContextValue = {
  open: () => void
  close: () => void
}

const VoiceAgentModalContext = createContext<VoiceAgentModalContextValue | null>(null)

export function VoiceAgentModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  const value = useMemo(() => ({ open, close }), [open, close])

  return (
    <VoiceAgentModalContext.Provider value={value}>
      {children}
      <TalkToSystem7Modal open={isOpen} onClose={close} />
    </VoiceAgentModalContext.Provider>
  )
}

export function useVoiceAgentModal(): VoiceAgentModalContextValue {
  const ctx = useContext(VoiceAgentModalContext)
  if (!ctx) {
    throw new Error('useVoiceAgentModal must be used within a VoiceAgentModalProvider')
  }
  return ctx
}

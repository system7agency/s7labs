'use client'

import { ConversationProvider, useConversation } from '@elevenlabs/react'
import { useCallback, useEffect, useRef, useState } from 'react'

import styles from './VoiceAgentPanel.module.css'

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ?? 'agent_5001kqewjaz5f6pan59eewfy5qq7'

type TranscriptEntry = {
  id: number
  source: 'user' | 'ai'
  text: string
}

type UiState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'ended' | 'error'

function stateLabel(state: UiState): string {
  switch (state) {
    case 'idle':
      return 'STANDBY'
    case 'connecting':
      return 'CONNECTING'
    case 'listening':
      return 'LISTENING'
    case 'speaking':
      return 'AGENT SPEAKING'
    case 'ended':
      return 'CALL ENDED'
    case 'error':
      return 'ERROR'
  }
}

export function VoiceAgentPanel() {
  return (
    <ConversationProvider>
      <VoiceAgentPanelInner />
    </ConversationProvider>
  )
}

function VoiceAgentPanelInner() {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [hasEnded, setHasEnded] = useState(false)
  const transcriptIdRef = useRef(0)
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null)

  const conversation = useConversation({
    onConnect: () => {
      setErrorMessage(null)
      setHasEnded(false)
    },
    onDisconnect: () => {
      setHasEnded(true)
    },
    onMessage: ({ message, source }: { message: string; source: 'user' | 'ai' }) => {
      setTranscript((prev) => [...prev, { id: ++transcriptIdRef.current, source, text: message }])
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error ? err.message : typeof err === 'string' ? err : 'Voice agent error.'
      setErrorMessage(msg)
    },
  })

  const status = conversation.status
  const isSpeaking = conversation.isSpeaking

  const uiState: UiState = errorMessage
    ? 'error'
    : status === 'connecting'
      ? 'connecting'
      : status === 'connected'
        ? isSpeaking
          ? 'speaking'
          : 'listening'
        : hasEnded
          ? 'ended'
          : 'idle'

  useEffect(() => {
    const el = transcriptScrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [transcript])

  const handleStart = useCallback(async () => {
    setErrorMessage(null)
    setTranscript([])
    setHasEnded(false)
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setErrorMessage(
        'Microphone access is required. Please allow mic access in your browser and try again.'
      )
      return
    }
    try {
      conversation.startSession({
        agentId: AGENT_ID,
        connectionType: 'websocket',
      })
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to start voice session.')
    }
  }, [conversation])

  const handleEnd = useCallback(() => {
    try {
      conversation.endSession()
    } catch {
      // swallow — session may already be torn down
    }
  }, [conversation])

  useEffect(() => {
    return () => {
      try {
        conversation.endSession()
      } catch {
        // ignore — session may already be torn down
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isActive = status === 'connected' || status === 'connecting'

  return (
    <div className={styles.panel}>
      <div className={styles.statusRow}>
        <span
          className={`${styles.statusDot} ${styles[`statusDot_${uiState}`] ?? ''}`}
          aria-hidden="true"
        />
        <span className={styles.statusLabel}>{stateLabel(uiState)}</span>
      </div>

      <div className={styles.transcript} ref={transcriptScrollRef} aria-live="polite">
        {transcript.length === 0 ? (
          <p className={styles.transcriptEmpty}>
            {isActive
              ? 'Listening for the conversation transcript…'
              : 'Start the call to begin a live voice conversation.'}
          </p>
        ) : (
          transcript.map((entry) => (
            <div
              key={entry.id}
              className={`${styles.bubble} ${
                entry.source === 'user' ? styles.bubbleUser : styles.bubbleAi
              }`}
            >
              <span className={styles.bubbleSource}>
                {entry.source === 'user' ? 'YOU' : 'AGENT'}
              </span>
              <span className={styles.bubbleText}>{entry.text}</span>
            </div>
          ))
        )}
      </div>

      {errorMessage && (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      )}

      <div className={styles.actions}>
        {isActive ? (
          <button type="button" className={`${styles.btn} ${styles.btnEnd}`} onClick={handleEnd}>
            End call
          </button>
        ) : (
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleStart}
          >
            <span className={styles.btnDot} aria-hidden="true" />
            Start call
          </button>
        )}
      </div>
    </div>
  )
}

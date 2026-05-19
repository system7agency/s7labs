'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ConversationProvider, useConversation } from '@elevenlabs/react'

import styles from './S7ChatWidget.module.css'

type Role = 'user' | 'ai'
type Mode = 'chat' | 'voice'

type ChatMessage = {
  id: string
  role: Role
  text: string
  timestamp: string
}

type SDKConversation = {
  sendUserMessage: (text: string) => void
  endSession: () => Promise<void>
}

function formatTimestamp(date: Date) {
  return date.toLocaleTimeString('en-GB', { hour12: false })
}

function formatSessionDivider(date: Date) {
  return `SESSION // ${date.toUTCString().slice(17, 25)} UTC`
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function S7ChatWidget() {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
  const enabled = process.env.NEXT_PUBLIC_ELEVENLABS_CHATBOT_ENABLED === 'true'

  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 640px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!(open && isMobile)) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, isMobile])

  if (!enabled || !agentId) return null

  if (!open) {
    return (
      <div className={styles.root}>
        <button
          type="button"
          className={styles.bubble}
          onClick={() => setOpen(true)}
          aria-label="Open S7 chat"
        >
          <span className={styles.orb} aria-hidden />
          <span className={styles.pill}>
            {'// ASK S7 '}
            <span className={styles.pillArrow}>→</span>
          </span>
        </button>
      </div>
    )
  }

  return (
    <ConversationProvider>
      <S7ChatPanel
        agentId={agentId}
        onClose={() => setOpen(false)}
        onMinimize={() => setOpen(false)}
      />
    </ConversationProvider>
  )
}

function S7ChatPanel({
  agentId,
  onClose,
  onMinimize,
}: {
  agentId: string
  onClose: () => void
  onMinimize: () => void
}) {
  const [mode, setMode] = useState<Mode>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isWaiting, setIsWaiting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [sessionStart] = useState(() => new Date())

  const [callDuration, setCallDuration] = useState(0)
  const [voiceStatusText, setVoiceStatusText] = useState<string>('')

  const chatConvoRef = useRef<SDKConversation | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const lastSentRef = useRef<string | null>(null)

  const conversation = useConversation({
    onDisconnect: () => {
      setVoiceStatusText('')
      setCallDuration(0)
    },
    onModeChange: ({ mode: agentMode }: { mode: 'speaking' | 'listening' }) => {
      setVoiceStatusText(agentMode === 'speaking' ? 'S7 IS SPEAKING...' : 'LISTENING...')
    },
    onError: (msg: string, context?: unknown) => {
      console.error('[S7ChatWidget] voice onError:', msg, context)
    },
  })

  const voiceStatus = conversation.status
  const isCallActive = voiceStatus === 'connecting' || voiceStatus === 'connected'

  const pushMessage = useCallback((role: Role, text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: makeId(), role, text, timestamp: formatTimestamp(new Date()) },
    ])
  }, [])

  useEffect(() => {
    if (mode !== 'chat' || chatConvoRef.current) return
    let cancelled = false

    ;(async () => {
      try {
        const { Conversation } = await import('@elevenlabs/client')
        if (cancelled) return
        const convo = await Conversation.startSession({
          agentId,
          connectionType: 'websocket',
          overrides: { conversation: { textOnly: true } },
          onConnect: ({ conversationId }: { conversationId: string }) => {
            console.warn('[S7ChatWidget] Connection established (chat):', conversationId)
          },
          onMessage: ({ source, message }: { source: Role; message: string }) => {
            if (source === 'ai') {
              setIsWaiting(false)
              pushMessage('ai', message)
            } else if (source === 'user' && message !== lastSentRef.current) {
              pushMessage('user', message)
            }
          },
          onError: (msg: string, context?: unknown) => {
            console.error('[S7ChatWidget] chat onError:', msg, context)
            setIsWaiting(false)
            setErrorMsg(msg || 'Connection error')
          },
          onDisconnect: () => {
            chatConvoRef.current = null
          },
        })
        if (cancelled) {
          await convo.endSession()
          return
        }
        chatConvoRef.current = convo as unknown as SDKConversation
      } catch (err) {
        console.error('[S7ChatWidget] chat connect catch:', err)
        setErrorMsg(err instanceof Error ? err.message : 'Failed to connect')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [mode, agentId, pushMessage])

  useEffect(() => {
    return () => {
      chatConvoRef.current?.endSession().catch(() => {})
      chatConvoRef.current = null
    }
  }, [])

  useEffect(() => {
    if (mode === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isWaiting, mode])

  useEffect(() => {
    if (voiceStatus !== 'connected') return
    const id = window.setInterval(() => {
      setCallDuration((d) => d + 1)
    }, 1000)
    return () => window.clearInterval(id)
  }, [voiceStatus])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || isWaiting) return
    setErrorMsg(null)
    pushMessage('user', text)
    setInput('')
    lastSentRef.current = text
    setIsWaiting(true)
    try {
      if (chatConvoRef.current) {
        chatConvoRef.current.sendUserMessage(text)
      } else {
        setErrorMsg('Not connected yet. Try again in a moment.')
        setIsWaiting(false)
      }
    } catch (err) {
      setIsWaiting(false)
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send')
    }
  }, [input, isWaiting, pushMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const startVoiceCall = useCallback(() => {
    // iOS Safari: getUserMedia MUST be initiated synchronously inside the
    // gesture handler — no awaits, no setState before it. Capture the promise
    // first, resolve later.
    const micPromise = navigator.mediaDevices.getUserMedia({ audio: true })

    // iOS Safari: audio playback is muted unless an AudioContext is created
    // and a buffer played within the user gesture. Do both synchronously.
    let audioContext: AudioContext | null = null
    try {
      const AC: typeof AudioContext | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AC) {
        audioContext = new AC()
        const buffer = audioContext.createBuffer(1, 1, 22050)
        const source = audioContext.createBufferSource()
        source.buffer = buffer
        source.connect(audioContext.destination)
        source.start(0)
      }
    } catch (e) {
      console.warn('[S7ChatWidget] audio unlock failed:', e)
    }

    // Eager UI feedback now that the gesture-bound work is done.
    setCallDuration(0)
    setVoiceStatusText('')
    setErrorMsg(null)

    void (async () => {
      try {
        if (audioContext && audioContext.state === 'suspended') {
          await audioContext.resume()
        }

        // Resolve the mic permission promise so any rejection surfaces here
        // (rather than from the SDK's own getUserMedia call). Then release our
        // hold — the SDK will reacquire; iOS keeps the permission cached.
        const stream = await micPromise
        stream.getTracks().forEach((t) => t.stop())

        await conversation.startSession({ agentId, connectionType: 'websocket' })

        // Ensure any <audio> elements the SDK created play inline on iOS
        // instead of triggering the fullscreen player.
        requestAnimationFrame(() => {
          document.querySelectorAll('audio').forEach((a) => {
            ;(a as unknown as { playsInline: boolean }).playsInline = true
            a.setAttribute('playsinline', '')
            a.setAttribute('webkit-playsinline', '')
          })
        })
      } catch (err) {
        console.error('[S7ChatWidget] voice start failed:', err)
        const name = (err as { name?: string })?.name
        if (name === 'NotAllowedError') {
          setErrorMsg('Microphone access denied. Enable it in Settings → Safari → Microphone.')
        } else if (name === 'NotFoundError') {
          setErrorMsg('No microphone found.')
        } else if (name === 'NotReadableError') {
          setErrorMsg('Microphone in use by another app. Close other apps and try again.')
        } else {
          setErrorMsg(err instanceof Error ? `Voice failed: ${err.message}` : 'Voice failed')
        }
      }
    })()
  }, [agentId, conversation])

  const endVoiceCall = useCallback(() => {
    setVoiceStatusText('')
    try {
      conversation.endSession()
    } catch {
      /* ignore */
    }
  }, [conversation])

  const switchMode = (next: Mode) => {
    if (next === mode) return
    if (mode === 'voice' && isCallActive) {
      endVoiceCall()
    }
    setMode(next)
  }

  const closeWidget = () => {
    chatConvoRef.current?.endSession().catch(() => {})
    chatConvoRef.current = null
    if (isCallActive) {
      conversation.endSession()
    }
    onClose()
  }

  return (
    <div className={`${styles.root} ${styles.rootOpen}`}>
      <div className={styles.panel} role="dialog" aria-label="S7 Labs AI">
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerLabelRow}>
              <span className={styles.miniOrb} aria-hidden />
              <span className={styles.headerLabel}>S7 LABS // AI</span>
            </div>
            <div className={styles.statusLine}>
              {mode === 'voice' && voiceStatus === 'connected' ? (
                <>
                  <span className={styles.statusDotGreen}>●</span> CONNECTED
                </>
              ) : (
                <>
                  <span className={styles.statusDot}>●</span> ONLINE
                </>
              )}
            </div>
            <div className={styles.modeToggle} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'chat'}
                className={`${styles.modeBtn} ${mode === 'chat' ? styles.modeBtnActive : ''}`}
                onClick={() => switchMode('chat')}
              >
                CHAT
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'voice'}
                className={`${styles.modeBtn} ${mode === 'voice' ? styles.modeBtnActive : ''}`}
                onClick={() => switchMode('voice')}
              >
                VOICE
              </button>
            </div>
          </div>
          <div className={styles.headerButtons}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={onMinimize}
              aria-label="Minimize"
            >
              –
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={closeWidget}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {mode === 'chat' ? (
          <>
            <div className={styles.messages}>
              <div className={styles.divider}>{formatSessionDivider(sessionStart)}</div>

              {messages.map((m) => {
                const isUser = m.role === 'user'
                return (
                  <div key={m.id} className={`${styles.msg} ${isUser ? styles.msgUser : ''}`}>
                    {isUser ? (
                      <span className={`${styles.avatar} ${styles.avatarUser}`}>YOU</span>
                    ) : (
                      <span className={styles.avatar} aria-hidden />
                    )}
                    <div className={styles.msgBody}>
                      <div className={styles.msgMeta}>
                        {isUser ? 'you' : '▸ s7.assistant'} · {m.timestamp}
                      </div>
                      <div className={`${styles.bubbleBody} ${isUser ? styles.bubbleUser : ''}`}>
                        {m.text}
                      </div>
                    </div>
                  </div>
                )
              })}

              {isWaiting && (
                <div className={styles.msg}>
                  <span className={styles.avatar} aria-hidden />
                  <div className={styles.msgBody}>
                    <div className={styles.msgMeta}>▸ s7.assistant</div>
                    <div className={styles.bubbleBody}>
                      <span className={styles.typing}>
                        $ reading.context
                        <span className={styles.caret} />
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className={styles.msg}>
                  <span className={styles.avatar} aria-hidden />
                  <div className={styles.msgBody}>
                    <div className={styles.msgMeta}>▸ s7.assistant · error</div>
                    <div className={`${styles.bubbleBody} ${styles.error}`}>{errorMsg}</div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className={styles.input}>
              <span className={styles.prompt}>$</span>
              <input
                className={styles.field}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="type your question_"
                aria-label="Chat input"
              />
              <button
                type="button"
                className={styles.send}
                onClick={handleSend}
                disabled={!input.trim() || isWaiting}
                aria-label="Send message"
              >
                ▸
              </button>
            </div>
          </>
        ) : (
          <div className={styles.voicePane}>
            <span
              className={`${styles.voiceOrb} ${isCallActive ? styles.voiceOrbActive : ''}`}
              aria-hidden
            />

            {voiceStatus === 'disconnected' && (
              <>
                <div className={styles.voicePrompt}>TAP TO CONNECT</div>
                <button
                  type="button"
                  className={styles.voiceStartBtn}
                  onClick={startVoiceCall}
                  aria-label="Start voice call"
                >
                  <PhoneIcon />
                </button>
              </>
            )}

            {voiceStatus === 'connecting' && (
              <>
                <div className={styles.voicePrompt}>CONNECTING…</div>
                <button
                  type="button"
                  className={`${styles.voiceStartBtn} ${styles.voiceEndBtn}`}
                  onClick={endVoiceCall}
                  aria-label="Cancel"
                >
                  <PhoneIcon rotated />
                </button>
              </>
            )}

            {voiceStatus === 'connected' && (
              <>
                <div className={styles.voiceTimer}>{formatDuration(callDuration)}</div>
                {voiceStatusText && <div className={styles.voiceStatusText}>{voiceStatusText}</div>}
                <button
                  type="button"
                  className={`${styles.voiceStartBtn} ${styles.voiceEndBtn}`}
                  onClick={endVoiceCall}
                  aria-label="End call"
                >
                  <PhoneIcon rotated />
                </button>
              </>
            )}

            {voiceStatus === 'error' && (
              <>
                <div className={styles.voicePrompt}>Voice error</div>
                <button type="button" className={styles.voiceRetry} onClick={startVoiceCall}>
                  TRY AGAIN
                </button>
              </>
            )}

            {errorMsg && voiceStatus !== 'connected' && (
              <div className={styles.voiceError}>{errorMsg}</div>
            )}
          </div>
        )}

        <div className={styles.footer}>
          <span>POWERED BY ELEVENLABS</span>
          <span>S7_AI · v1.0</span>
        </div>
      </div>
    </div>
  )
}

function PhoneIcon({ rotated = false }: { rotated?: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={rotated ? { transform: 'rotate(135deg)' } : undefined}
      aria-hidden
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

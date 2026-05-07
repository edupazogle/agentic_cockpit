'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface ChatMessage {
  id: string
  role: 'user' | 'companion' | 'system'
  content: string
  timestamp: string
}

interface CompanionRailProps {
  pilotSlug: string
  threadId?: string
}

export function CompanionRail({ pilotSlug, threadId }: CompanionRailProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    setThinking(true)

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])

    try {
      const res = await fetch(`/api/pilots/${pilotSlug}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, thread_id: threadId }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'companion',
          content: data.content || data.message || '...',
          timestamp: new Date().toISOString(),
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'system',
        content: 'Message failed — gateway unreachable.',
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setThinking(false)
    }
  }, [input, pilotSlug, threadId])

  return (
    <div className="companion-rail">
      <div className="companion-header">
        <h3>Compagnon</h3>
        {thinking && <span className="thinking-dot" />}
      </div>

      <div className="companion-messages">
        {messages.length === 0 && (
          <p className="empty-hint">
            Bonjour. Je suis votre Compagnon agentique. Avant qu&apos;on parle
            d&apos;IA, j&apos;aimerais comprendre la journ&eacute;e
            d&apos;aujourd&apos;hui.
          </p>
        )}
        {messages.map(m => (
          <div key={m.id} className={`msg msg-${m.role}`}>
            <span className="msg-role">
              {m.role === 'companion' ? 'Compagnon' : m.role === 'user' ? 'Vous' : ''}
            </span>
            <p className="msg-body">{m.content}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="companion-input">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="Décrivez votre processus..."
          rows={2}
        />
        <button onClick={send} disabled={thinking || !input.trim()}>
          Envoyer
        </button>
      </div>
    </div>
  )
}

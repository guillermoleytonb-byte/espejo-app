'use client'

import { useState, useEffect, useRef, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage } from '@/lib/types'

function TypingIndicator() {
  return (
    <div className="flex gap-1 px-4 py-3 rounded-2xl rounded-bl-sm w-fit" style={{ background: '#1a1a1a' }}>
      <span className="w-1.5 h-1.5 rounded-full dot-1" style={{ background: '#d97706' }} />
      <span className="w-1.5 h-1.5 rounded-full dot-2" style={{ background: '#d97706' }} />
      <span className="w-1.5 h-1.5 rounded-full dot-3" style={{ background: '#d97706' }} />
    </div>
  )
}

function parseMessageContent(content: string) {
  content = content.replace(/\[INSIGHTS_DATA\][\s\S]*?\[\/INSIGHTS_DATA\]/g, '').trim()
  const analysisStart = content.indexOf('[INICIO_ANÁLISIS]')
  const analysisEnd = content.indexOf('[FIN_ANÁLISIS]')

  if (analysisStart !== -1 && analysisEnd !== -1) {
    const before = content.slice(0, analysisStart).trim()
    const analysis = content.slice(analysisStart + 17, analysisEnd).trim()
    return { before, analysis, hasAnalysis: true }
  }
  if (analysisStart !== -1) {
    const before = content.slice(0, analysisStart).trim()
    const partial = content.slice(analysisStart + 17)
    return { before, analysis: partial, hasAnalysis: false, streaming: true }
  }
  return { before: content, analysis: '', hasAnalysis: false }
}

function MessageBubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  const isUser = role === 'user'
  const { before, analysis, hasAnalysis, streaming } = parseMessageContent(content)

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} message-enter`}>
      <div className={`max-w-[85%] ${isUser ? '' : 'flex flex-col gap-3'}`}>
        {isUser ? (
          <div className="px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed" style={{ background: '#d97706', color: '#0a0a0a' }}>
            {content}
          </div>
        ) : (
          <>
            {before && (
              <div className="px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed whitespace-pre-wrap" style={{ background: '#1a1a1a', color: '#f0ede8' }}>
                {before}
              </div>
            )}
            {(analysis || streaming) && (
              <div className="rounded-2xl p-5 text-sm leading-relaxed whitespace-pre-wrap" style={{ background: '#111111', border: '1px solid #d97706', color: '#f0ede8' }}>
                <p className="text-xs uppercase tracking-widest mb-3 opacity-50" style={{ color: '#d97706' }}>
                  {hasAnalysis ? 'Tu mapa de esta sesión' : 'Generando tu mapa...'}
                </p>
                {analysis}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = use(params)
  const supabase = createClient()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadMessages()
  }, [sessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  async function loadMessages() {
    const { data: storedMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (storedMessages && storedMessages.length > 0) {
      setMessages(storedMessages.map(m => ({ role: m.role, content: m.content })))
      setInitialized(true)
    } else {
      setInitialized(true)
      sendMessage('__INICIAR__', true)
    }
  }

  async function sendMessage(userInput: string, isInit = false) {
    const newMessages: ChatMessage[] = isInit
      ? [{ role: 'user', content: 'Hola, quiero comenzar.' }]
      : [...messages, { role: 'user', content: userInput }]

    if (!isInit) {
      setMessages(newMessages)
      setInput('')
    }

    setIsLoading(true)
    setIsTyping(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: isInit ? [{ role: 'user', content: 'Hola, quiero comenzar.' }] : newMessages,
          sessionId,
        }),
      })

      if (!res.ok || !res.body) throw new Error('Error de respuesta')

      setIsTyping(false)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''

      setMessages(prev => [
        ...(isInit ? [] : prev),
        { role: 'assistant', content: '' }
      ])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantContent += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: assistantContent }
          return updated
        })
      }
    } catch (err) {
      setIsTyping(false)
      console.error(err)
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading) sendMessage(input.trim())
    }
  }

  const hasAnalysis = messages.some(m => m.content.includes('[FIN_ANÁLISIS]'))

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full dot-1" style={{ background: '#d97706' }} />
          <span className="w-2 h-2 rounded-full dot-2" style={{ background: '#d97706' }} />
          <span className="w-2 h-2 rounded-full dot-3" style={{ background: '#d97706' }} />
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: '#0a0a0a', color: '#f0ede8' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b flex-shrink-0" style={{ borderColor: '#1f1f1f', background: '#0a0a0a' }}>
        <Link href="/dashboard" className="text-xs opacity-40 hover:opacity-100 transition-opacity">
          ← Inicio
        </Link>
        <span className="text-xs tracking-widest uppercase opacity-60" style={{ color: '#d97706', letterSpacing: '0.2em' }}>
          espejo
        </span>
        {hasAnalysis && (
          <Link href="/profile" className="text-xs" style={{ color: '#d97706' }}>
            Ver perfil →
          </Link>
        )}
        {!hasAnalysis && <div className="w-16" />}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} />
          ))}
          {isTyping && (
            <div className="flex justify-start message-enter">
              <TypingIndicator />
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      {!hasAnalysis && (
        <div className="flex-shrink-0 px-4 py-4 border-t" style={{ borderColor: '#1f1f1f', background: '#0a0a0a' }}>
          <div className="max-w-2xl mx-auto flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Escribe aquí... (Enter para enviar)"
              rows={1}
              className="flex-1 px-4 py-3 rounded-xl text-sm resize-none outline-none leading-relaxed"
              style={{
                background: '#111111',
                border: '1px solid #1f1f1f',
                color: '#f0ede8',
                maxHeight: '120px',
              }}
            />
            <button
              onClick={() => input.trim() && !isLoading && sendMessage(input.trim())}
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 rounded-xl text-sm font-medium flex-shrink-0 transition-opacity"
              style={{
                background: '#d97706',
                color: '#0a0a0a',
                opacity: !input.trim() || isLoading ? 0.4 : 1,
              }}
            >
              →
            </button>
          </div>
          <p className="text-center text-xs opacity-20 mt-2">Shift+Enter para nueva línea</p>
        </div>
      )}

      {/* Post-analysis CTA */}
      {hasAnalysis && (
        <div className="flex-shrink-0 px-4 py-6 border-t text-center" style={{ borderColor: '#1f1f1f' }}>
          <p className="text-sm opacity-50 mb-4">Sesión completada</p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/profile"
              className="px-6 py-3 rounded-full text-sm font-medium"
              style={{ background: '#d97706', color: '#0a0a0a' }}
            >
              Ver mi perfil
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-full text-sm border"
              style={{ borderColor: '#1f1f1f', color: '#f0ede8' }}
            >
              Inicio
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}

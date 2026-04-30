'use client'

import { useState, useEffect, useRef, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage } from '@/lib/types'

const VOICES = [
  { id: 'espejo', label: 'Voz de Guillermo', description: 'La voz oficial de Espejo', icon: '🎙️' },
  { id: 'male', label: 'Voz masculina', description: 'Voz de hombre', icon: '👤' },
  { id: 'female', label: 'Voz femenina', description: 'Voz de mujer', icon: '👤' },
  { id: 'none', label: 'Sin voz', description: 'Solo texto', icon: '🔇' },
]

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
  content = content.replace(/\[AREAS_DATA\][\s\S]*?\[\/AREAS_DATA\]/g, '').trim()
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
  const [isRecording, setIsRecording] = useState(false)
  const [voicePreference, setVoicePreference] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const [lang, setLang] = useState<'es' | 'en'>('es')

  function toggleRecording() {
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognition.lang = 'es-ES'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      setInput(prev => prev ? prev + ' ' + transcript : transcript)
      setIsRecording(false)
    }
    recognition.onend = () => setIsRecording(false)
    recognition.onerror = () => setIsRecording(false)
    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }

  function stopAudio() {
    if (audioCtxRef.current) {
      audioCtxRef.current.suspend()
      audioCtxRef.current.resume()
    }
    setIsPlaying(false)
  }

  useEffect(() => {
    const saved = localStorage.getItem('lang')
    if (saved === 'en' || saved === 'es') setLang(saved)
    loadMessages()

    return () => {
      recognitionRef.current?.stop()
      audioCtxRef.current?.close()
    }
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
      const saved = localStorage.getItem('voicePreference') || 'none'
      setVoicePreference(saved)
      setInitialized(true)
    } else {
      setInitialized(true)
      // wait for voice selection before starting
    }
  }

  function selectVoice(voiceId: string) {
    if (voiceId !== 'none') {
      const ctx = new AudioContext()
      ctx.resume()
      audioCtxRef.current = ctx
    }
    localStorage.setItem('voicePreference', voiceId)
    setVoicePreference(voiceId)
    sendMessage('__INICIAR__', true, voiceId)
  }

  async function sendMessage(userInput: string, isInit = false, voiceId?: string) {
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
          messages: isInit ? [{ role: 'user', content: lang === 'en' ? 'Hi, I want to begin.' : 'Hola, quiero comenzar.' }] : newMessages,
          sessionId,
          lang,
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

      const activeVoice = voiceId ?? voicePreference
      if (activeVoice && activeVoice !== 'none') {
        await playTTSWithVoice(assistantContent, activeVoice)
      }
    } catch (err) {
      setIsTyping(false)
      console.error(err)
      setMessages(prev => [
        ...prev.filter((_, i) => i < prev.length - 1),
        { role: 'assistant', content: 'Hubo un problema al conectar. Por favor intenta de nuevo.' }
      ])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  async function playTTSWithVoice(text: string, voiceId: string) {
    const ctx = audioCtxRef.current
    if (!ctx) return
    const { before } = parseMessageContent(text)
    const textToSpeak = before.trim()
    if (!textToSpeak) return
    try {
      setIsPlaying(true)
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak, voiceId }),
      })
      if (!res.ok) { setIsPlaying(false); return }
      const arrayBuffer = await res.arrayBuffer()
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(ctx.destination)
      source.start(0)
      source.onended = () => setIsPlaying(false)
    } catch { setIsPlaying(false) }
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

  if (voicePreference === null) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#0a0a0a', color: '#f0ede8' }}>
        <span className="text-xs tracking-widest uppercase mb-12 opacity-60" style={{ color: '#d97706', letterSpacing: '0.2em' }}>
          espejo
        </span>
        <h2 className="text-2xl font-light mb-2 text-center" style={{ fontFamily: 'Georgia, serif' }}>
          ¿Cómo quieres escuchar?
        </h2>
        <p className="text-xs opacity-40 mb-10 text-center">Elige la voz que te acompañará en esta sesión</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {VOICES.map(v => (
            <button
              key={v.id}
              onClick={() => selectVoice(v.id)}
              className="px-6 py-4 rounded-2xl text-left transition-all hover:border-amber-600"
              style={{ background: '#111111', border: '1px solid #1f1f1f' }}
            >
              <div className="flex items-center gap-4">
                <span style={{ fontSize: '22px' }}>{v.icon}</span>
                <div>
                  <p className="text-sm font-medium">{v.label}</p>
                  <p className="text-xs opacity-40 mt-0.5">{v.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: '#0a0a0a', color: '#f0ede8' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b flex-shrink-0" style={{ borderColor: '#1f1f1f', background: '#0a0a0a' }}>
        <Link href="/dashboard" className="text-xs opacity-40 hover:opacity-100 transition-opacity">
          ← Inicio
        </Link>
        <div className="flex items-center gap-3">
          {isPlaying && (
            <button
              onClick={stopAudio}
              className="text-xs px-2 py-1 rounded-lg transition-opacity"
              style={{ background: '#1a1a1a', color: '#d97706', border: '1px solid #d97706' }}
            >
              ⏹ detener
            </button>
          )}
          <span className="text-xs tracking-widest uppercase opacity-60" style={{ color: '#d97706', letterSpacing: '0.2em' }}>
            espejo
          </span>
        </div>
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
            <button
              onClick={toggleRecording}
              disabled={isLoading}
              title={isRecording ? 'Detener grabación' : 'Hablar'}
              className="px-3 py-3 rounded-xl flex-shrink-0 transition-all"
              style={{
                background: isRecording ? '#ef4444' : '#1a1a1a',
                border: `1px solid ${isRecording ? '#ef4444' : '#1f1f1f'}`,
                fontSize: '18px',
              }}
            >
              🎤
            </button>
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
          <p className="text-sm opacity-50 mb-1">Sesión completada</p>
          <p className="text-xs opacity-30 mb-5">Tu próxima sesión profundizará lo que descubriste hoy</p>
          <div className="flex flex-col items-center gap-3 mb-6">
            <Link
              href="/profile"
              className="px-8 py-3 rounded-full text-sm font-medium"
              style={{ background: '#d97706', color: '#0a0a0a' }}
            >
              Ver mi perfil
            </Link>
            <Link
              href="/dashboard"
              className="text-xs opacity-40 hover:opacity-70 transition-opacity underline"
              style={{ color: '#f0ede8' }}
            >
              Ir al inicio
            </Link>
          </div>
          <div className="max-w-sm mx-auto rounded-xl px-4 py-3 text-xs leading-relaxed" style={{ background: '#111111', border: '1px solid #1f1f1f', color: '#f0ede8' }}>
            <p className="opacity-40 uppercase tracking-widest text-xs mb-1">Tu privacidad</p>
            <p className="opacity-60">Esta conversación fue eliminada de nuestros servidores al completarse. Solo conservamos tu perfil y mapa de vida. Nadie puede leer lo que compartiste aquí.</p>
          </div>
        </div>
      )}
    </main>
  )
}

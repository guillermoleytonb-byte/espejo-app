'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import StartButton from './components/StartButton'

const COPY = {
  es: {
    tagline: 'Un viaje hacia adentro',
    h1a: 'El espacio donde',
    h1b: 'te encuentras',
    h1c: 'contigo mismo',
    sub: 'No otra app de hábitos. No listas de consejos.\nSolo preguntas que nadie más te hace,\ny un espejo que recuerda lo que descubres.',
    cta: 'Comenzar — Primera sesión gratis',
    note: 'Sin registro · Sin contraseña · Tu progreso se guarda entre sesiones',
    f1t: 'La app no te mejora. Te refleja.',
    f1d: 'Sin consejos, sin tips, sin "5 hábitos del éxito". Solo conversaciones que te ayudan a escucharte.',
    f2t: 'Tu perfil, en tus palabras.',
    f2d: 'Lo que descubres cada sesión queda guardado. Después de varias sesiones, tienes un retrato real de quién eres.',
    f3t: 'Recursos que resuenan.',
    f3d: 'Al final de cada sesión, recursos conectados específicamente a lo que dijiste — no a una lista genérica.',
    quote: '"El conocimiento de uno mismo es el comienzo de toda sabiduría."',
    author: '— Aristóteles',
    privacy: 'Privacidad',
  },
  en: {
    tagline: 'A journey within',
    h1a: 'The space where you',
    h1b: 'meet yourself',
    h1c: 'for real',
    sub: 'Not another habit app. Not advice lists.\nOnly questions nobody else asks you,\nand a mirror that remembers what you discover.',
    cta: 'Begin — First session free',
    note: 'No signup · No password · Your progress is saved between sessions',
    f1t: 'The app doesn\'t improve you. It reflects you.',
    f1d: 'No tips, no life hacks, no "5 habits of success". Just conversations that help you listen to yourself.',
    f2t: 'Your profile, in your words.',
    f2d: 'What you discover each session is saved. After several sessions, you have a real portrait of who you are.',
    f3t: 'Resources that resonate.',
    f3d: 'At the end of each session, resources specifically connected to what you said — not a generic list.',
    quote: '"Knowing yourself is the beginning of all wisdom."',
    author: '— Aristotle',
    privacy: 'Privacy',
  },
}

export default function LandingPage() {
  const [lang, setLangState] = useState<'es' | 'en'>('es')

  useEffect(() => {
    const saved = localStorage.getItem('lang')
    if (saved === 'en' || saved === 'es') {
      setLangState(saved)
    } else {
      const detected = navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en'
      setLangState(detected)
      localStorage.setItem('lang', detected)
    }
  }, [])

  function toggleLang(l: 'es' | 'en') {
    localStorage.setItem('lang', l)
    setLangState(l)
  }

  const t = COPY[lang]

  return (
    <main className="min-h-screen flex flex-col" style={{ background: '#0a0a0a', color: '#f0ede8' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-4xl mx-auto w-full">
        <span className="text-lg tracking-widest uppercase" style={{ color: '#d97706', letterSpacing: '0.25em' }}>
          espejo
        </span>
        <div className="flex items-center gap-4">
          <div className="flex gap-1 text-xs">
            <button onClick={() => toggleLang('es')} className="px-2 py-1 rounded transition-opacity" style={{ opacity: lang === 'es' ? 1 : 0.3, color: '#d97706' }}>ES</button>
            <span className="opacity-20 self-center">|</span>
            <button onClick={() => toggleLang('en')} className="px-2 py-1 rounded transition-opacity" style={{ opacity: lang === 'en' ? 1 : 0.3, color: '#d97706' }}>EN</button>
          </div>
          <Link href="/privacy" className="text-xs opacity-30 hover:opacity-60 transition-opacity">
            {t.privacy}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center py-24">
        <div className="max-w-2xl">
          {/* Mirror */}
          <div className="relative mx-auto mb-10 w-24 h-24 md:w-28 md:h-28">
            <div
              className="w-full h-full rounded-full"
              style={{
                background: 'radial-gradient(circle at 38% 35%, #1c1a17 0%, #0d0c0a 60%, #0a0a0a 100%)',
                border: '1.5px solid #d97706',
                boxShadow: '0 0 40px rgba(217,119,6,0.2), 0 0 80px rgba(217,119,6,0.06), inset 0 0 30px rgba(0,0,0,0.6)',
              }}
            />
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle at 35% 30%, rgba(255,248,220,0.07) 0%, transparent 50%)',
                pointerEvents: 'none',
              }}
            />
          </div>
          <p className="text-xs tracking-widest uppercase mb-8 opacity-40">{t.tagline}</p>
          <h1 className="text-4xl md:text-6xl font-light leading-tight mb-8" style={{ fontFamily: 'Georgia, serif' }}>
            {t.h1a}
            <br />
            <span style={{ color: '#d97706' }}>{t.h1b}</span>
            <br />
            {t.h1c}
          </h1>
          <p className="text-base md:text-lg opacity-60 leading-relaxed mb-12 max-w-lg mx-auto whitespace-pre-line">
            {t.sub}
          </p>
          <StartButton />
          <p className="text-xs opacity-30 mt-6">{t.note}</p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 pb-24 w-full">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: '◎', title: t.f1t, desc: t.f1d },
            { icon: '◈', title: t.f2t, desc: t.f2d },
            { icon: '◇', title: t.f3t, desc: t.f3d },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border" style={{ background: '#111111', borderColor: '#1f1f1f' }}>
              <div className="text-2xl mb-4" style={{ color: '#d97706' }}>{f.icon}</div>
              <h3 className="font-medium mb-2 text-sm leading-snug">{f.title}</h3>
              <p className="text-xs opacity-50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-20 opacity-30">
          <p className="text-sm italic" style={{ fontFamily: 'Georgia, serif' }}>{t.quote}</p>
          <p className="text-xs mt-2">{t.author}</p>
        </div>
      </section>
    </main>
  )
}

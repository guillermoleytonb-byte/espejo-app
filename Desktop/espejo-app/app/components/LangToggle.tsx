'use client'

import { useEffect, useState } from 'react'

export function useLang() {
  const [lang, setLangState] = useState<'es' | 'en'>('es')

  useEffect(() => {
    const saved = localStorage.getItem('lang')
    if (saved === 'en' || saved === 'es') {
      setLangState(saved)
    } else {
      const browser = navigator.language.toLowerCase()
      const detected = browser.startsWith('es') ? 'es' : 'en'
      setLangState(detected)
      localStorage.setItem('lang', detected)
    }
  }, [])

  function setLang(l: 'es' | 'en') {
    localStorage.setItem('lang', l)
    setLangState(l)
  }

  return { lang, setLang }
}

export default function LangToggle() {
  const { lang, setLang } = useLang()

  return (
    <div className="flex gap-1 text-xs">
      <button
        onClick={() => setLang('es')}
        className="px-2 py-1 rounded transition-opacity"
        style={{ opacity: lang === 'es' ? 1 : 0.3, color: '#d97706' }}
      >
        ES
      </button>
      <span className="opacity-20">|</span>
      <button
        onClick={() => setLang('en')}
        className="px-2 py-1 rounded transition-opacity"
        style={{ opacity: lang === 'en' ? 1 : 0.3, color: '#d97706' }}
      >
        EN
      </button>
    </div>
  )
}

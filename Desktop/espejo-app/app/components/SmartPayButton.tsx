'use client'

import { useEffect, useState } from 'react'
import PayButton from './PayButton'
import GumroadButton from './GumroadButton'

export default function SmartPayButton() {
  const [lang, setLang] = useState<'es' | 'en'>('es')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('lang')
    if (saved === 'en') setLang('en')
    setReady(true)
  }, [])

  if (!ready) return null

  return lang === 'en'
    ? <GumroadButton label="Buy session — $4.99 USD" />
    : <PayButton label="Comprar sesión — $2.990" />
}

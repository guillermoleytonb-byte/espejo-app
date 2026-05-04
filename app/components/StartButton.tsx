'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function StartButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleStart() {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        const { error } = await supabase.auth.signInAnonymously()
        if (error) throw error
      }
      router.push('/dashboard')
    } catch {
      setError('No pudimos conectarte. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleStart}
        disabled={loading}
        className="inline-block px-8 py-4 rounded-full text-sm tracking-wide transition-all hover:opacity-90"
        style={{ background: '#d97706', color: '#0a0a0a', fontWeight: 600, opacity: loading ? 0.7 : 1 }}
      >
        {loading ? 'Entrando...' : 'Comenzar mi viaje interior'}
      </button>
      {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}
    </div>
  )
}

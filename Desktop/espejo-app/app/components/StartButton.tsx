'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function StartButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleStart() {
    setLoading(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      await supabase.auth.signInAnonymously()
    }

    router.push('/dashboard')
  }

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      className="inline-block px-8 py-4 rounded-full text-sm tracking-wide transition-all hover:opacity-90"
      style={{ background: '#d97706', color: '#0a0a0a', fontWeight: 600, opacity: loading ? 0.7 : 1 }}
    >
      {loading ? 'Entrando...' : 'Comenzar mi viaje interior'}
    </button>
  )
}

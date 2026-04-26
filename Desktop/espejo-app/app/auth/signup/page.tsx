'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleGoogle() {
    setGoogleLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, name })
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#0a0a0a', color: '#f0ede8' }}>
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center mb-10 text-lg tracking-widest uppercase" style={{ color: '#d97706', letterSpacing: '0.25em' }}>
          espejo
        </Link>

        <h1 className="text-2xl font-light text-center mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Comienza tu viaje
        </h1>
        <p className="text-center text-sm opacity-40 mb-8">Es el primer paso hacia adentro</p>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full py-3 rounded-xl text-sm font-medium mb-4 flex items-center justify-center gap-3 transition-opacity"
          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#f0ede8', opacity: googleLoading ? 0.6 : 1 }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z"/>
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
          </svg>
          {googleLoading ? 'Conectando...' : 'Continuar con Google'}
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: '#1f1f1f' }} />
          <span className="text-xs opacity-30">o con email</span>
          <div className="flex-1 h-px" style={{ background: '#1f1f1f' }} />
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs opacity-50 mb-2 uppercase tracking-wider">Tu nombre</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="¿Cómo te llamas?"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#111111', border: '1px solid #1f1f1f', color: '#f0ede8' }}
            />
          </div>

          <div>
            <label className="block text-xs opacity-50 mb-2 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#111111', border: '1px solid #1f1f1f', color: '#f0ede8' }}
            />
          </div>

          <div>
            <label className="block text-xs opacity-50 mb-2 uppercase tracking-wider">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#111111', border: '1px solid #1f1f1f', color: '#f0ede8' }}
            />
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: '#ef4444' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-medium mt-2 transition-opacity"
            style={{ background: '#d97706', color: '#0a0a0a', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm opacity-40 mt-8">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="underline" style={{ color: '#d97706' }}>
            Entrar
          </Link>
        </p>
      </div>
    </main>
  )
}

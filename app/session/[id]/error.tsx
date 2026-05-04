'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function SessionError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#0a0a0a', color: '#f0ede8' }}>
      <span className="text-xs tracking-widest uppercase mb-12 opacity-60" style={{ color: '#d97706', letterSpacing: '0.2em' }}>
        espejo
      </span>
      <h2 className="text-xl font-light mb-4 text-center" style={{ fontFamily: 'Georgia, serif' }}>
        Algo salió mal
      </h2>
      <p className="text-sm opacity-40 mb-8 text-center">La sesión encontró un problema inesperado.</p>
      <div className="flex flex-col gap-3 items-center">
        <button
          onClick={reset}
          className="px-8 py-3 rounded-full text-sm font-medium"
          style={{ background: '#d97706', color: '#0a0a0a' }}
        >
          Intentar de nuevo
        </button>
        <Link
          href="/dashboard"
          className="text-xs opacity-40 hover:opacity-70 transition-opacity underline"
          style={{ color: '#f0ede8' }}
        >
          Ir al inicio
        </Link>
      </div>
    </main>
  )
}

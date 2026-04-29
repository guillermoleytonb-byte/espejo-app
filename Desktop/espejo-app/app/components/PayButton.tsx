'use client'

import { useState } from 'react'

export default function PayButton({ label = 'Comprar sesión — $1.000' }: { label?: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  async function handlePay() {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/payment/create', { method: 'POST' })
      if (!res.ok) throw new Error()
      const { url } = await res.json()
      if (url) window.location.href = url
      else throw new Error()
    } catch {
      setLoading(false)
      setError(true)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handlePay}
        disabled={loading}
        className="px-8 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-90"
        style={{ background: '#d97706', color: '#0a0a0a', opacity: loading ? 0.6 : 1 }}
      >
        {loading ? 'Redirigiendo a pago...' : label}
      </button>
      {error && (
        <p className="text-xs" style={{ color: '#ef4444' }}>
          Hubo un problema al conectar con el pago. Intenta de nuevo.
        </p>
      )}
    </div>
  )
}

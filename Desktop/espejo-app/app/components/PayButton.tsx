'use client'

import { useState } from 'react'

export default function PayButton() {
  const [loading, setLoading] = useState(false)

  async function handlePay() {
    setLoading(true)
    try {
      const res = await fetch('/api/payment/create', { method: 'POST' })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="px-8 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-90"
      style={{ background: '#d97706', color: '#0a0a0a', opacity: loading ? 0.6 : 1 }}
    >
      {loading ? 'Redirigiendo...' : 'Comprar sesión — $1.000'}
    </button>
  )
}

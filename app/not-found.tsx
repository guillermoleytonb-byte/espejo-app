import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#0a0a0a', color: '#f0ede8' }}>
      <span className="text-xs tracking-widest uppercase mb-12 opacity-60" style={{ color: '#d97706', letterSpacing: '0.2em' }}>
        espejo
      </span>
      <h2 className="text-6xl font-light mb-4" style={{ fontFamily: 'Georgia, serif', color: '#d97706' }}>
        404
      </h2>
      <p className="text-sm opacity-40 mb-8">Esta página no existe.</p>
      <Link
        href="/"
        className="px-8 py-3 rounded-full text-sm font-medium"
        style={{ background: '#d97706', color: '#0a0a0a' }}
      >
        Volver al inicio
      </Link>
    </main>
  )
}

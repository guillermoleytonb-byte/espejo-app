import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col" style={{ background: '#0a0a0a', color: '#f0ede8' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-4xl mx-auto w-full">
        <span className="text-lg tracking-widest uppercase" style={{ color: '#d97706', letterSpacing: '0.25em' }}>
          espejo
        </span>
        <div className="flex gap-4">
          <Link href="/auth/login" className="text-sm opacity-60 hover:opacity-100 transition-opacity px-4 py-2">
            Entrar
          </Link>
          <Link
            href="/auth/signup"
            className="text-sm px-4 py-2 rounded-full border transition-colors"
            style={{ borderColor: '#d97706', color: '#d97706' }}
          >
            Comenzar
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center py-24">
        <div className="max-w-2xl">
          <p className="text-xs tracking-widest uppercase mb-8 opacity-40">Un viaje hacia adentro</p>

          <h1 className="text-4xl md:text-6xl font-light leading-tight mb-8" style={{ fontFamily: 'Georgia, serif' }}>
            El espacio donde
            <br />
            <span style={{ color: '#d97706' }}>te encuentras</span>
            <br />
            contigo mismo
          </h1>

          <p className="text-base md:text-lg opacity-60 leading-relaxed mb-12 max-w-lg mx-auto">
            No otra app de hábitos. No listas de consejos.
            <br />
            Solo preguntas que nadie más te hace,
            y un espejo que recuerda lo que descubres.
          </p>

          <Link
            href="/auth/signup"
            className="inline-block px-8 py-4 rounded-full text-sm tracking-wide transition-all hover:opacity-90"
            style={{ background: '#d97706', color: '#0a0a0a', fontWeight: 600 }}
          >
            Comenzar mi viaje interior
          </Link>

          <p className="text-xs opacity-30 mt-6">Gratis para comenzar · Sin tarjeta requerida</p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 pb-24 w-full">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '◎',
              title: 'La app no te mejora. Te refleja.',
              desc: 'Sin consejos, sin tips, sin "5 hábitos del éxito". Solo conversaciones que te ayudan a escucharte.'
            },
            {
              icon: '◈',
              title: 'Tu perfil, en tus palabras.',
              desc: 'Lo que descubres cada sesión queda guardado. Después de varias sesiones, tienes un retrato real de quién eres.'
            },
            {
              icon: '◇',
              title: 'Recursos que resuenan.',
              desc: 'Al final de cada sesión, recursos conectados específicamente a lo que dijiste — no a una lista genérica.'
            }
          ].map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl border"
              style={{ background: '#111111', borderColor: '#1f1f1f' }}
            >
              <div className="text-2xl mb-4" style={{ color: '#d97706' }}>{f.icon}</div>
              <h3 className="font-medium mb-2 text-sm leading-snug">{f.title}</h3>
              <p className="text-xs opacity-50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Quote */}
        <div className="text-center mt-20 opacity-30">
          <p className="text-sm italic" style={{ fontFamily: 'Georgia, serif' }}>
            "El conocimiento de uno mismo es el comienzo de toda sabiduría."
          </p>
          <p className="text-xs mt-2">— Aristóteles</p>
        </div>
      </section>
    </main>
  )
}

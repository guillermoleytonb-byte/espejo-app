import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Profile, Session } from '@/lib/types'

const AREA_LABELS: Record<string, string> = {
  mentalidad: 'Mentalidad',
  cuerpo: 'Cuerpo',
  relaciones: 'Relaciones',
  trabajo: 'Trabajo',
  finanzas: 'Finanzas',
  emocional: 'Emocional',
  espiritual: 'Espiritual',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const p = profile as Profile | null
  const sessionList = sessions as Session[] | null
  const name = p?.name || user.email?.split('@')[0] || 'Viajero'
  const sessionsCount = p?.sessions_count || 0
  const areas = p?.life_areas || {}
  const hasAreas = Object.keys(areas).length > 0

  async function createSession() {
    'use server'
    const supabase2 = await createClient()
    const { data: { user: u } } = await supabase2.auth.getUser()
    if (!u) redirect('/auth/login')

    const { data } = await supabase2.from('sessions').insert({
      user_id: u.id,
      title: `Sesión ${(sessionsCount || 0) + 1}`,
    }).select().single()

    if (data) redirect(`/session/${data.id}`)
  }

  return (
    <main className="min-h-screen pb-24" style={{ background: '#0a0a0a', color: '#f0ede8' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 max-w-2xl mx-auto">
        <span className="text-sm tracking-widest uppercase" style={{ color: '#d97706', letterSpacing: '0.2em' }}>
          espejo
        </span>
        <div className="flex items-center gap-4">
          <Link href="/profile" className="text-xs opacity-40 hover:opacity-100 transition-opacity">
            Mi perfil
          </Link>
          <form action={async () => {
            'use server'
            const supabase2 = await createClient()
            await supabase2.auth.signOut()
            redirect('/')
          }}>
            <button className="text-xs opacity-30 hover:opacity-60 transition-opacity">Salir</button>
          </form>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 pt-8">
        {/* Welcome */}
        <div className="mb-10">
          <p className="text-xs opacity-40 uppercase tracking-widest mb-2">Bienvenido</p>
          <h1 className="text-3xl font-light" style={{ fontFamily: 'Georgia, serif' }}>
            {name}
          </h1>
          {sessionsCount > 0 && (
            <p className="text-sm opacity-40 mt-2">
              {sessionsCount} {sessionsCount === 1 ? 'sesión completada' : 'sesiones completadas'}
            </p>
          )}
        </div>

        {/* Start Session CTA */}
        <div
          className="rounded-2xl p-8 mb-8 text-center"
          style={{ background: '#111111', border: '1px solid #1f1f1f' }}
        >
          {sessionsCount === 0 ? (
            <>
              <p className="text-sm opacity-50 mb-2">Tu viaje comienza aquí</p>
              <h2 className="text-xl font-light mb-6" style={{ fontFamily: 'Georgia, serif' }}>
                ¿Listo para tu primera sesión?
              </h2>
            </>
          ) : (
            <>
              <p className="text-sm opacity-50 mb-2">El camino continúa</p>
              <h2 className="text-xl font-light mb-6" style={{ fontFamily: 'Georgia, serif' }}>
                ¿Qué ha resonado desde la última vez?
              </h2>
            </>
          )}
          <form action={createSession}>
            <button
              type="submit"
              className="px-8 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-90"
              style={{ background: '#d97706', color: '#0a0a0a' }}
            >
              {sessionsCount === 0 ? 'Comenzar sesión 1' : `Iniciar sesión ${sessionsCount + 1}`}
            </button>
          </form>
          <p className="text-xs mt-5 opacity-25 leading-relaxed">
            🔒 Tu conversación se elimina automáticamente al finalizar la sesión.{' '}
            <Link href="/privacy" className="underline hover:opacity-60 transition-opacity">
              Política de privacidad
            </Link>
          </p>
        </div>

        {/* Areas snapshot */}
        {hasAreas && (
          <div className="mb-8">
            <p className="text-xs opacity-40 uppercase tracking-widest mb-4">Tus áreas de vida</p>
            <div className="rounded-2xl p-6" style={{ background: '#111111', border: '1px solid #1f1f1f' }}>
              <div className="flex flex-col gap-3">
                {Object.entries(areas).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs opacity-50 w-20 flex-shrink-0">{AREA_LABELS[key]}</span>
                    <div className="flex-1 h-1 rounded-full" style={{ background: '#1f1f1f' }}>
                      <div
                        className="h-1 rounded-full transition-all"
                        style={{
                          width: `${((value as number) / 10) * 100}%`,
                          background: `hsl(${30 + ((value as number) / 10) * 60}, 80%, 50%)`
                        }}
                      />
                    </div>
                    <span className="text-xs opacity-50 w-6 text-right">{value}</span>
                  </div>
                ))}
              </div>
              <Link href="/profile" className="block text-xs mt-4 text-center" style={{ color: '#d97706' }}>
                Ver perfil completo →
              </Link>
            </div>
          </div>
        )}

        {/* Recent sessions */}
        {sessionList && sessionList.length > 0 && (
          <div>
            <p className="text-xs opacity-40 uppercase tracking-widest mb-4">Sesiones anteriores</p>
            <div className="flex flex-col gap-3">
              {sessionList.map((s) => (
                <Link
                  key={s.id}
                  href={`/session/${s.id}`}
                  className="flex items-center justify-between p-4 rounded-xl transition-colors"
                  style={{ background: '#111111', border: '1px solid #1f1f1f' }}
                >
                  <div>
                    <p className="text-sm">{s.title || 'Sesión'}</p>
                    <p className="text-xs opacity-30 mt-0.5">
                      {new Date(s.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                  <span className="text-xs opacity-30">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import SmartPayButton from '../components/SmartPayButton'
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

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ payment?: string; payment_id?: string; collection_id?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const sp2 = await searchParams
  const paymentId = sp2.payment_id || sp2.collection_id
  if (sp2.payment === 'success' && paymentId) {
    try {
      const cookieStore = await cookies()
      const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({ paymentId }),
        cache: 'no-store',
      })
    } catch (e) {
      console.error('Payment verify fetch error:', e)
    }
  }

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

  const sp = sp2
  const p = profile as Profile | null
  const sessionList = sessions as Session[] | null
  const name = p?.name || user.email?.split('@')[0] || 'Viajero'
  const sessionsCount = p?.sessions_count || 0
  const credits = p?.credits || 0
  const areas = p?.life_areas || {}
  const hasAreas = Object.keys(areas).length > 0
  const isFree = sessionsCount === 0
  const canStart = isFree || credits > 0

  async function createSession() {
    'use server'
    const supabase2 = await createClient()
    const { data: { user: u } } = await supabase2.auth.getUser()
    if (!u) redirect('/')

    const { data: prof } = await supabase2.from('profiles').select('sessions_count, credits').eq('id', u.id).single()
    const isFirstSession = !prof || prof.sessions_count === 0
    if (!isFirstSession && (prof?.credits || 0) <= 0) redirect('/dashboard')

    // Decrement credit atomically before creating session to prevent race conditions.
    // The .gt('credits', 0) filter ensures credits can't go below 0 concurrently.
    if (!isFirstSession) {
      const { data: decremented } = await supabase2
        .from('profiles')
        .update({ credits: (prof!.credits || 1) - 1, updated_at: new Date().toISOString() })
        .eq('id', u.id)
        .gt('credits', 0)
        .select('id')
      if (!decremented || decremented.length === 0) redirect('/dashboard')
    }

    const { data } = await supabase2.from('sessions').insert({
      user_id: u.id,
      title: `Sesión ${(prof?.sessions_count || 0) + 1}`,
    }).select().single()

    if (!data) redirect('/dashboard')

    redirect(`/session/${data.id}`)
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
              {credits > 0 && ` · ${credits} ${credits === 1 ? 'sesión disponible' : 'sesiones disponibles'}`}
            </p>
          )}
        </div>

        {/* Payment success banner */}
        {sp.payment === 'success' && (
          <div className="rounded-xl px-5 py-4 mb-6" style={{ background: '#14532d', border: '1px solid #16a34a', color: '#86efac' }}>
            <p className="text-sm font-medium">¡Pago exitoso!</p>
            <p className="text-xs opacity-80 mt-1">Tu sesión está lista. Cuando quieras, comienza tu próximo viaje interior.</p>
          </div>
        )}
        {sp.payment === 'failure' && (
          <div className="rounded-xl px-5 py-4 mb-6" style={{ background: '#450a0a', border: '1px solid #dc2626', color: '#fca5a5' }}>
            <p className="text-sm font-medium">El pago no se completó</p>
            <p className="text-xs opacity-80 mt-1">Puedes intentarlo de nuevo cuando quieras.</p>
          </div>
        )}

        {/* Start Session CTA */}
        <div
          className="rounded-2xl p-8 mb-8 text-center"
          style={{ background: '#111111', border: '1px solid #1f1f1f' }}
        >
          {isFree ? (
            <>
              <p className="text-sm opacity-50 mb-2">Tu viaje comienza aquí</p>
              <h2 className="text-xl font-light mb-6" style={{ fontFamily: 'Georgia, serif' }}>
                ¿Listo para tu primera sesión?
              </h2>
              <form action={createSession}>
                <button
                  type="submit"
                  className="px-8 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-90"
                  style={{ background: '#d97706', color: '#0a0a0a' }}
                >
                  Comenzar sesión 1 — Gratis
                </button>
              </form>
            </>
          ) : canStart ? (
            <>
              <p className="text-sm opacity-50 mb-2">El camino continúa</p>
              <h2 className="text-xl font-light mb-6" style={{ fontFamily: 'Georgia, serif' }}>
                ¿Qué ha resonado desde la última vez?
              </h2>
              <form action={createSession}>
                <button
                  type="submit"
                  className="px-8 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-90"
                  style={{ background: '#d97706', color: '#0a0a0a' }}
                >
                  Iniciar sesión {sessionsCount + 1}
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="text-sm opacity-50 mb-2">Continúa tu viaje interior</p>
              <h2 className="text-xl font-light mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                Sesión {sessionsCount + 1}
              </h2>
              <p className="text-xs opacity-40 mb-6">Cada sesión profundiza lo que descubriste en la anterior</p>
              <SmartPayButton />
              <p className="text-sm opacity-60 mt-3">Pago único · Sin suscripción · Sin datos guardados</p>
            </>
          )}
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

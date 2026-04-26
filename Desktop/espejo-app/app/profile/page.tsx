import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Profile } from '@/lib/types'

const AREA_LABELS: Record<string, string> = {
  mentalidad: 'Mentalidad',
  cuerpo: 'Cuerpo y energía',
  relaciones: 'Relaciones',
  trabajo: 'Trabajo y propósito',
  finanzas: 'Finanzas',
  emocional: 'Emocional',
  espiritual: 'Espiritual',
}

function AreaBar({ label, value }: { label: string; value: number }) {
  const color = value >= 7 ? '#22c55e' : value >= 4 ? '#d97706' : '#ef4444'
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs">
        <span className="opacity-60">{label}</span>
        <span style={{ color }}>{value}/10</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: '#1f1f1f' }}>
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${(value / 10) * 100}%`, background: color }}
        />
      </div>
    </div>
  )
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const p = profile as Profile | null
  const name = p?.name || user.email?.split('@')[0] || 'Viajero'
  const areas = p?.life_areas || {}
  const strengths = p?.strengths || []
  const purpose = p?.purpose || ''
  const patterns = p?.patterns || []
  const sessionsCount = p?.sessions_count || 0
  const hasData = sessionsCount > 0

  return (
    <main className="min-h-screen pb-24" style={{ background: '#0a0a0a', color: '#f0ede8' }}>
      <header className="flex items-center justify-between px-6 py-5 max-w-2xl mx-auto">
        <Link href="/dashboard" className="text-xs opacity-40 hover:opacity-100 transition-opacity">
          ← Inicio
        </Link>
        <span className="text-xs tracking-widest uppercase opacity-60" style={{ color: '#d97706', letterSpacing: '0.2em' }}>
          mi perfil
        </span>
        <div className="w-16" />
      </header>

      <div className="max-w-2xl mx-auto px-6">
        {/* Identity */}
        <div className="mb-10 pt-4">
          <h1 className="text-3xl font-light mb-1" style={{ fontFamily: 'Georgia, serif' }}>{name}</h1>
          <p className="text-sm opacity-40">
            {sessionsCount === 0
              ? 'Tu perfil se construye a medida que completas sesiones'
              : `${sessionsCount} ${sessionsCount === 1 ? 'sesión completada' : 'sesiones completadas'}`}
          </p>
        </div>

        {!hasData ? (
          <div className="text-center py-16" style={{ border: '1px dashed #1f1f1f', borderRadius: '16px' }}>
            <p className="text-4xl mb-4">◎</p>
            <p className="text-sm opacity-50 mb-6">Tu perfil está esperando que lo construyas</p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 rounded-full text-sm font-medium"
              style={{ background: '#d97706', color: '#0a0a0a' }}
            >
              Comenzar primera sesión
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Purpose */}
            {purpose && (
              <div className="p-6 rounded-2xl" style={{ background: '#111111', border: '1px solid #1f1f1f' }}>
                <p className="text-xs opacity-40 uppercase tracking-widest mb-3" style={{ color: '#d97706' }}>
                  Zona de propósito
                </p>
                <p className="text-sm leading-relaxed opacity-80 italic" style={{ fontFamily: 'Georgia, serif' }}>
                  "{purpose}"
                </p>
              </div>
            )}

            {/* Strengths */}
            {strengths.length > 0 && (
              <div className="p-6 rounded-2xl" style={{ background: '#111111', border: '1px solid #1f1f1f' }}>
                <p className="text-xs opacity-40 uppercase tracking-widest mb-4" style={{ color: '#d97706' }}>
                  Fortalezas identificadas
                </p>
                <div className="flex flex-col gap-3">
                  {strengths.map((s, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="opacity-30 text-sm mt-0.5">◆</span>
                      <div>
                        <p className="text-sm font-medium">{typeof s === 'string' ? s : s.title}</p>
                        {typeof s !== 'string' && s.description && (
                          <p className="text-xs opacity-50 mt-0.5 leading-relaxed">{s.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Areas */}
            {Object.keys(areas).length > 0 && (
              <div className="p-6 rounded-2xl" style={{ background: '#111111', border: '1px solid #1f1f1f' }}>
                <p className="text-xs opacity-40 uppercase tracking-widest mb-5" style={{ color: '#d97706' }}>
                  Áreas de vida
                </p>
                <div className="flex flex-col gap-4">
                  {Object.entries(areas).map(([key, value]) => (
                    <AreaBar key={key} label={AREA_LABELS[key] || key} value={value as number} />
                  ))}
                </div>
              </div>
            )}

            {/* Patterns */}
            {patterns.length > 0 && (
              <div className="p-6 rounded-2xl" style={{ background: '#111111', border: '1px solid #1f1f1f' }}>
                <p className="text-xs opacity-40 uppercase tracking-widest mb-4" style={{ color: '#d97706' }}>
                  Patrones observados
                </p>
                <div className="flex flex-col gap-3">
                  {patterns.map((pattern, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="opacity-30 text-sm mt-0.5">◈</span>
                      <p className="text-sm opacity-70 leading-relaxed">{pattern}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Start new session */}
        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 rounded-full text-sm border transition-colors"
            style={{ borderColor: '#d97706', color: '#d97706' }}
          >
            Nueva sesión
          </Link>
        </div>
      </div>
    </main>
  )
}

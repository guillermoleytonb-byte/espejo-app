import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-12" style={{ background: '#0a0a0a', color: '#f0ede8' }}>
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-xs opacity-40 hover:opacity-100 transition-opacity">
          ← Volver
        </Link>

        <div className="mt-8 mb-10">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: '#d97706' }}>espejo</p>
          <h1 className="text-2xl font-light" style={{ fontFamily: 'Georgia, serif' }}>
            Política de privacidad
          </h1>
          <p className="text-xs opacity-30 mt-2">Última actualización: abril 2026</p>
        </div>

        <div className="flex flex-col gap-8 text-sm leading-relaxed opacity-70">

          <section>
            <h2 className="text-base font-medium mb-3 opacity-100" style={{ color: '#f0ede8' }}>
              Tu conversación no se guarda
            </h2>
            <p>
              Todo lo que compartes durante una sesión de Espejo se elimina automáticamente de nuestros servidores una vez que la sesión concluye con tu análisis. Nadie — incluido el equipo de Espejo — puede leer lo que dijiste.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3 opacity-100" style={{ color: '#f0ede8' }}>
              Qué sí conservamos
            </h2>
            <p>
              Guardamos únicamente tu perfil acumulativo: las áreas de vida con sus puntuaciones, tu zona de propósito, y el número de sesiones realizadas. Esta información es lo que permite que Espejo te acompañe de forma continua entre sesiones.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3 opacity-100" style={{ color: '#f0ede8' }}>
              Datos de cuenta
            </h2>
            <p>
              Guardamos tu nombre y correo electrónico para identificarte. Si usas Google para entrar, recibimos solo el email y nombre que Google comparte — no accedemos a ninguna otra información de tu cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3 opacity-100" style={{ color: '#f0ede8' }}>
              Inteligencia artificial
            </h2>
            <p>
              Las sesiones usan la API de Claude (Anthropic). Tus mensajes son procesados por sus servidores para generar las respuestas, pero no son usados para entrenar modelos según la política de uso de API de Anthropic. Una vez eliminados de nuestro sistema, no tenemos control sobre las copias transitorias en los servidores de Anthropic.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3 opacity-100" style={{ color: '#f0ede8' }}>
              Tus derechos
            </h2>
            <p>
              Puedes pedir que eliminemos tu cuenta y todos tus datos en cualquier momento escribiendo a <span style={{ color: '#d97706' }}>guillermo.leytonb@gmail.com</span>. Lo hacemos sin preguntas.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3 opacity-100" style={{ color: '#f0ede8' }}>
              Infraestructura
            </h2>
            <p>
              Los datos se almacenan en Supabase (base de datos cifrada) y la app corre en Vercel. Ambos son servicios con altos estándares de seguridad. La comunicación entre tu dispositivo y nuestros servidores siempre es cifrada (HTTPS).
            </p>
          </section>

        </div>
      </div>
    </main>
  )
}

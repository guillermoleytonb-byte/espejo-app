import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  try {
    const { paymentId } = await request.json()
    if (!paymentId) return Response.json({ ok: false })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ ok: false })

    const payment = new Payment(mp)
    const paymentData = await payment.get({ id: paymentId })

    if (paymentData.status === 'approved' && paymentData.external_reference === user.id) {
      const admin = adminClient()
      const { data: profile } = await admin.from('profiles').select('credits').eq('id', user.id).single()

      await admin.from('profiles').upsert({
        id: user.id,
        credits: (profile?.credits || 0) + 1,
        updated_at: new Date().toISOString(),
      })

      return Response.json({ ok: true })
    }
  } catch {}

  return Response.json({ ok: false })
}

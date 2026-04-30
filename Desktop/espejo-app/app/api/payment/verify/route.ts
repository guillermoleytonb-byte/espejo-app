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
    const resolvedPaymentId = String(paymentData.id ?? paymentId)

    if (paymentData.status === 'approved' && paymentData.external_reference === user.id) {
      const admin = adminClient()
      const { data: profile } = await admin
        .from('profiles')
        .select('credits, last_payment_id')
        .eq('id', user.id)
        .single()

      if (!profile) return Response.json({ ok: false })

      // Idempotency: skip if this payment was already processed
      if ((profile as any).last_payment_id === resolvedPaymentId) {
        return Response.json({ ok: true })
      }

      await admin.from('profiles').update({
        credits: (profile.credits || 0) + 1,
        last_payment_id: resolvedPaymentId,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id)

      return Response.json({ ok: true })
    }
  } catch (e) {
    console.error('Payment verify error:', e)
  }

  return Response.json({ ok: false })
}

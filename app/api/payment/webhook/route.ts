import { createClient as createSupabaseClient } from '@supabase/supabase-js'
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
    const body = await request.json()

    if (body.type === 'payment' && body.data?.id) {
      const payment = new Payment(mp)
      const paymentData = await payment.get({ id: body.data.id })

      if (paymentData.status === 'approved' && paymentData.external_reference) {
        const userId = paymentData.external_reference
        const paymentId = String(body.data.id)
        const supabase = adminClient()

        const { data: profile } = await supabase
          .from('profiles')
          .select('credits, last_payment_id')
          .eq('id', userId)
          .single()

        if (!profile) return new Response('User not found', { status: 200 })
        if ((profile as any).last_payment_id === paymentId) return new Response('Already processed', { status: 200 })

        await supabase.from('profiles').update({
          credits: (profile?.credits || 0) + 1,
          last_payment_id: paymentId,
          updated_at: new Date().toISOString(),
        }).eq('id', userId)
      }
    }
  } catch {}

  return new Response('OK', { status: 200 })
}

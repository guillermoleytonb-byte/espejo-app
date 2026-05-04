import { createClient } from '@/lib/supabase/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const preference = new Preference(mp)
  const result = await preference.create({
    body: {
      items: [{
        id: 'sesion-espejo',
        title: 'Mirror Session',
        quantity: 1,
        unit_price: 2990,
        currency_id: 'CLP',
      }],
      external_reference: user.id,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=success`,
        failure: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=failure`,
        pending: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=pending`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/webhook`,
    },
  })

  return Response.json({ url: result.init_point })
}

import { createClient as createAdmin } from '@supabase/supabase-js'

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.formData()
    const saleId = body.get('sale_id') as string
    const referrer = body.get('referrer') as string

    if (!referrer || !saleId) return new Response('OK', { status: 200 })

    const admin = adminClient()

    const { data: tokenRow } = await admin
      .from('gumroad_tokens')
      .select('user_id, used')
      .eq('token', referrer)
      .single()

    if (!tokenRow || tokenRow.used) return new Response('OK', { status: 200 })

    await admin.from('gumroad_tokens').update({ used: true, sale_id: saleId }).eq('token', referrer)

    const { data: profile } = await admin
      .from('profiles')
      .select('credits')
      .eq('id', tokenRow.user_id)
      .single()

    await admin.from('profiles').update({
      credits: (profile?.credits || 0) + 1,
      updated_at: new Date().toISOString(),
    }).eq('id', tokenRow.user_id)

  } catch (e) {
    console.error('Gumroad webhook error:', e)
  }

  return new Response('OK', { status: 200 })
}

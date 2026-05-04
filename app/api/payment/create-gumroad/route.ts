import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const GUMROAD_URL = 'https://leyton62.gumroad.com/l/mayix'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const token = randomUUID()
  const admin = adminClient()

  await admin.from('gumroad_tokens').insert({
    token,
    user_id: user.id,
    created_at: new Date().toISOString(),
  })

  const checkoutUrl = `${GUMROAD_URL}?wanted=true&referrer=${token}`
  return Response.json({ url: checkoutUrl })
}

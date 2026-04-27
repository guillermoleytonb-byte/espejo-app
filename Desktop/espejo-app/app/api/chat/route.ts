import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { buildSystemPrompt } from '@/lib/claude-prompt'
import type { ChatMessage, Profile } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { messages, sessionId } = await request.json() as {
    messages: ChatMessage[]
    sessionId: string
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isFirstSession = !profile || profile.sessions_count === 0
  const systemPrompt = buildSystemPrompt(profile as Profile | null, isFirstSession)

  const lastUserMessage = messages[messages.length - 1]
  if (lastUserMessage?.role === 'user') {
    await supabase.from('messages').insert({
      session_id: sessionId,
      role: 'user',
      content: lastUserMessage.content,
    })
  }

  const stream = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      }
    ],
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    stream: true,
  })

  let fullResponse = ''

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const text = chunk.delta.text
          fullResponse += text
          controller.enqueue(encoder.encode(text))
        }
      }

      await supabase.from('messages').insert({
        session_id: sessionId,
        role: 'assistant',
        content: fullResponse,
      })

      if (fullResponse.includes('[FIN_ANÁLISIS]')) {
        await updateProfileFromAnalysis(supabase, user.id, fullResponse, profile)
        await supabase.from('messages').delete().eq('session_id', sessionId)
      }

      if (fullResponse.includes('[/INSIGHTS_DATA]')) {
        await saveInsightsData(supabase, user.id, sessionId, fullResponse)
      }

      controller.close()
    },
    cancel() {},
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}

async function saveInsightsData(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  userId: string,
  sessionId: string,
  fullResponse: string
) {
  const match = fullResponse.match(/\[INSIGHTS_DATA\]([\s\S]*?)\[\/INSIGHTS_DATA\]/)
  if (!match) return
  try {
    const data = JSON.parse(match[1].trim())
    await supabase.from('session_insights').upsert({
      session_id: sessionId,
      user_id: userId,
      ...data,
    })
  } catch {}
}

async function updateProfileFromAnalysis(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  userId: string,
  analysis: string,
  currentProfile: Profile | null
) {
  let newAreas = currentProfile?.life_areas || {}
  let newPurpose = currentProfile?.purpose || ''

  const areasMatch = analysis.match(/\[AREAS_DATA\]([\s\S]*?)\[\/AREAS_DATA\]/)
  if (areasMatch) {
    try {
      const data = JSON.parse(areasMatch[1].trim())
      const { proposito, ...areas } = data
      if (Object.values(areas).some(v => Number(v) > 0)) newAreas = areas
      if (proposito) newPurpose = proposito
    } catch {}
  }

  await supabase.from('profiles').upsert({
    id: userId,
    life_areas: newAreas,
    purpose: newPurpose,
    sessions_count: (currentProfile?.sessions_count || 0) + 1,
    updated_at: new Date().toISOString(),
  })
}

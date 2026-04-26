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

async function updateProfileFromAnalysis(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  userId: string,
  analysis: string,
  currentProfile: Profile | null
) {
  const areasMatch = analysis.match(/Mentalidad: (\d+)\/10[\s\S]*?Cuerpo: (\d+)\/10[\s\S]*?Relaciones: (\d+)\/10[\s\S]*?Trabajo: (\d+)\/10[\s\S]*?Finanzas: (\d+)\/10[\s\S]*?Emocional: (\d+)\/10[\s\S]*?Espiritual: (\d+)\/10/)

  const newAreas = areasMatch ? {
    mentalidad: parseInt(areasMatch[1]),
    cuerpo: parseInt(areasMatch[2]),
    relaciones: parseInt(areasMatch[3]),
    trabajo: parseInt(areasMatch[4]),
    finanzas: parseInt(areasMatch[5]),
    emocional: parseInt(areasMatch[6]),
    espiritual: parseInt(areasMatch[7]),
  } : currentProfile?.life_areas || {}

  const purposeMatch = analysis.match(/\*\*ZONA DE PROPÓSITO\*\*\n([\s\S]*?)\n\n\*\*/)
  const newPurpose = purposeMatch ? purposeMatch[1].trim() : currentProfile?.purpose || ''

  await supabase.from('profiles').upsert({
    id: userId,
    life_areas: newAreas,
    purpose: newPurpose,
    sessions_count: (currentProfile?.sessions_count || 0) + 1,
    updated_at: new Date().toISOString(),
  })
}

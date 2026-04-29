import { NextRequest } from 'next/server'

const VOICE_MAP: Record<string, string> = {
  espejo: process.env.ELEVENLABS_VOICE_ID || '',
  male: 'pNInz6obpgDQGcFmaJgB',   // Adam
  female: 'EXAVITQu4vr4xnSDxMaL', // Bella
}

export async function POST(req: NextRequest) {
  const { text, voiceId } = await req.json()
  if (!text || !voiceId) return new Response('Missing params', { status: 400 })

  const elevenVoiceId = VOICE_MAP[voiceId]
  if (!elevenVoiceId) return new Response('Invalid voice', { status: 400 })

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${elevenVoiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.slice(0, 1500),
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.3, similarity_boost: 0.85, style: 0.5, use_speaker_boost: true },
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    console.error('ElevenLabs error:', err)
    return new Response('TTS error', { status: 500 })
  }

  const audioBuffer = await response.arrayBuffer()
  return new Response(audioBuffer, {
    headers: { 'Content-Type': 'audio/mpeg' },
  })
}

export interface Profile {
  id: string
  name: string | null
  strengths: Strength[]
  life_areas: LifeAreas
  purpose: string
  patterns: string[]
  sessions_count: number
  created_at: string
  updated_at: string
}

export interface Strength {
  title: string
  description: string
  evidence: string
}

export interface LifeAreas {
  mentalidad?: number
  cuerpo?: number
  relaciones?: number
  trabajo?: number
  finanzas?: number
  emocional?: number
  espiritual?: number
}

export interface Session {
  id: string
  user_id: string
  title: string | null
  summary: string | null
  analysis: SessionAnalysis | null
  resources: Resource[]
  areas_snapshot: LifeAreas | null
  completed: boolean
  created_at: string
}

export interface Message {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface SessionAnalysis {
  strengths_found: Strength[]
  areas: LifeAreas
  purpose_synthesis: string
  patterns: string[]
  key_ideas: string[]
  questions_to_carry: string[]
  next_steps: string[]
  resources: Resource[]
}

export interface Resource {
  type: 'libro' | 'podcast' | 'video' | 'test' | 'práctica'
  title: string
  author?: string
  description: string
  connection: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

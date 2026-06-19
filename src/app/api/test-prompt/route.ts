import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const DEFAULT_MODEL = 'claude-sonnet-4-6'
const MAX_PROMPT_CHARS = 30_000

const ALLOWED_MODELS = [
  'claude-sonnet-4-6',
  'claude-haiku-4-5-20251001',
  'claude-opus-4-5',
] as const
type AllowedModel = typeof ALLOWED_MODELS[number]

export async function POST(req: NextRequest) {
  // S-01: verificar sesión Supabase
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No autorizado. Inicia sesión para usar el test en vivo.' }, { status: 401 })
  }
  const token = authHeader.slice(7)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Sesión inválida o expirada. Vuelve a iniciar sesión.' }, { status: 401 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY no configurada en el servidor.' },
      { status: 500 }
    )
  }

  const body = await req.json() as { prompt?: string; model?: string }
  const { prompt } = body

  // S-03: validar tamaño del prompt
  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'Prompt vacío' }, { status: 400 })
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    return NextResponse.json(
      { error: `Prompt demasiado largo (máx. ${MAX_PROMPT_CHARS.toLocaleString()} caracteres)` },
      { status: 400 }
    )
  }

  // S-02: whitelist de modelos permitidos
  const rawModel = body.model
  const model: AllowedModel = ALLOWED_MODELS.includes(rawModel as AllowedModel)
    ? (rawModel as AllowedModel)
    : DEFAULT_MODEL

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.json() as { error?: { message?: string } }
      return NextResponse.json(
        { error: err.error?.message ?? `Error de la API de Anthropic (${response.status})` },
        { status: response.status }
      )
    }

    const data = await response.json() as {
      content?: { text?: string }[]
      usage?: { input_tokens?: number; output_tokens?: number }
      model?: string
    }
    const text = data.content?.[0]?.text ?? ''
    const usage = data.usage ?? {}

    return NextResponse.json({
      result: text,
      inputTokens: usage.input_tokens ?? 0,
      outputTokens: usage.output_tokens ?? 0,
      model: data.model ?? model,
    })
  } catch {
    return NextResponse.json({ error: 'Error de red al llamar a la API de Anthropic' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { parseAiClassification } from '@/lib/ai-classification-parser'
import { AiClassificationParseError } from '@/types/ai-classification'
import type { AiClassification } from '@/types/ai-classification'

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001'
const DEFAULT_MAX_TOKENS = 1024
const DEFAULT_TIMEOUT_MS = 20_000

const ARCHETYPES_LIST = `- booking-system: agenda, citas, reservas, disponibilidad, control de acceso, cuotas periódicas
- course-platform: cursos, aprendizaje, alumnos, instructores, lecciones, módulos
- landing-page: captación de leads, conversión, formularios de contacto, propuesta de valor
- marketplace: catálogo de productos, vendedores, compradores, listings, precios
- crm: seguimiento comercial, leads, pipeline, clientes potenciales, oportunidades
- support-system: incidencias, tickets, helpdesk, soporte al cliente, SLA
- content-system: blog, artículos, publicaciones, editorial, contenido
- custom: solo si ninguno de los anteriores encaja de forma razonable`

function buildClassifySystemPrompt(): string {
  return `You are a software project architect. Classify a project idea into the closest system archetype — by what the system actually does, NOT by the business domain name.

Available archetypes:
${ARCHETYPES_LIST}

MAPPING GUIDANCE (domain → archetype):
- Gym / fitness center → booking-system (class reservations, member management, access control)
- Nursery school / daycare → crm or booking-system (family tracking, slot reservations)
- Driving school → booking-system (lesson scheduling)
- Vet clinic → booking-system (appointment scheduling)
- Coworking space → booking-system (desk/room reservations)
- Dog grooming / hair salon → booking-system (appointment management)
- Language academy → course-platform or booking-system (classes + students)
- Driving instructor → booking-system (lesson slots)
Choose 'custom' ONLY when no archetype fits even loosely.

Extract domain-specific (NOT generic) entities, roles, screens, and requirements from the idea.

Respond with ONLY a valid JSON object. No markdown, no code fences, no explanation. Raw JSON only.

OUTPUT SCHEMA:
{
  "category": "<one of the 8 archetypes>",
  "subtype": "<domain-specific subtype, e.g. gym-management, veterinary-clinic, coworking-space>",
  "confidence": <integer 0-100>,
  "reasoning": "<one sentence explaining the archetype choice>",
  "objective": "<one-line goal of this project, specific to the domain>",
  "entities": ["<entity1>", "<entity2>", ...],
  "roles": ["<role1>", "<role2>", ...],
  "screens": ["<screen1>", "<screen2>", ...],
  "audience": ["<audience segment1>", ...],
  "confirmedRequirements": ["<explicitly stated by user>", ...],
  "suggestedRequirements": ["<reasonable domain inference not stated>", ...],
  "integrations": ["<typical integration for this domain>", ...]
}`
}

function buildClassifyUserPrompt(idea: string): string {
  return `Project idea: "${idea}"\n\nClassify and extract domain information. Raw JSON only.`
}

interface AnthropicContentBlock {
  type: string
  text?: string
}

interface AnthropicErrorResponse {
  error?: { message?: string }
}

interface AnthropicSuccessResponse {
  content?: AnthropicContentBlock[]
}

export async function POST(req: NextRequest) {
  // ── 1. API key ──────────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY_NOT_CONFIGURED' },
      { status: 503 }
    )
  }

  // ── 2. Parse body ──────────────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    const parsed: unknown = await req.json()
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return NextResponse.json({ error: 'El body debe ser un objeto JSON' }, { status: 400 })
    }
    body = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'JSON inválido en el body' }, { status: 400 })
  }

  // ── 3. Validate idea ───────────────────────────────────────────────────────
  const idea = body['idea']
  if (typeof idea !== 'string' || !idea.trim()) {
    return NextResponse.json(
      { error: 'idea es requerida y debe ser un string no vacío' },
      { status: 400 }
    )
  }

  // ── 4. Call Anthropic with hard timeout ────────────────────────────────────
  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL
  const maxTokens = parseInt(process.env.ANTHROPIC_MAX_TOKENS ?? String(DEFAULT_MAX_TOKENS), 10)
  const timeoutMs = parseInt(process.env.ANTHROPIC_TIMEOUT_MS ?? String(DEFAULT_TIMEOUT_MS), 10)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  const startMs = Date.now()

  let raw: string
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
        max_tokens: maxTokens,
        system: buildClassifySystemPrompt(),
        messages: [{ role: 'user', content: buildClassifyUserPrompt(idea.trim()) }],
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const err = await response.json() as AnthropicErrorResponse
      return NextResponse.json(
        { error: err.error?.message ?? `Error de Anthropic (${response.status})` },
        { status: response.status }
      )
    }

    const data = await response.json() as AnthropicSuccessResponse
    raw = data.content?.find((block) => block.type === 'text')?.text ?? ''

    if (!raw.trim()) {
      return NextResponse.json(
        { error: 'La API de Anthropic devolvió una respuesta vacía' },
        { status: 502 }
      )
    }
  } catch (err) {
    const durationMs = Date.now() - startMs
    if (err instanceof Error && err.name === 'AbortError') {
      console.log(JSON.stringify({ event: 'nexus_classify', model, status: 'timeout', durationMs }))
      return NextResponse.json(
        { error: 'Timeout al llamar a la API de Anthropic' },
        { status: 504 }
      )
    }
    console.log(JSON.stringify({ event: 'nexus_classify', model, status: 'network_error', durationMs }))
    return NextResponse.json(
      { error: 'Error de red al contactar la API de Anthropic' },
      { status: 500 }
    )
  } finally {
    clearTimeout(timeoutId)
  }

  // ── 5. Parse response ──────────────────────────────────────────────────────
  const durationMs = Date.now() - startMs
  let classification: AiClassification
  try {
    classification = parseAiClassification(raw)
    console.log(JSON.stringify({ event: 'nexus_classify', model, status: 'success', durationMs }))
  } catch (err) {
    console.log(JSON.stringify({ event: 'nexus_classify', model, status: 'parse_error', durationMs }))
    if (err instanceof AiClassificationParseError) {
      return NextResponse.json(
        { error: `Respuesta inválida de /classify: ${err.message}` },
        { status: 502 }
      )
    }
    return NextResponse.json(
      { error: 'Error inesperado al procesar la clasificación' },
      { status: 500 }
    )
  }

  return NextResponse.json({ classification })
}

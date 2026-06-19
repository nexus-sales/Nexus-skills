import { NextRequest, NextResponse } from 'next/server'
import {
  buildNexusApiSystemPrompt,
  buildNexusApiUserPrompt,
  parseNexusApiResponse,
} from '@/lib/nexus-api-prompt'
import { prepareBlueprintForApi } from '@/lib/prepare-blueprint-for-api'
import { NexusApiParseError } from '@/types/nexus-api'
import type {
  IntegrationCapability,
  StructuredProjectBlueprint,
  StructuredProjectCategory,
} from '@/types/project-blueprint'
import type { NexusApiArtifacts } from '@/types/nexus-api'

const DEFAULT_MODEL = 'claude-3-5-sonnet-latest'
const DEFAULT_MAX_TOKENS = 4096
const DEFAULT_TIMEOUT_MS = 25_000

const VALID_CATEGORIES: readonly string[] = [
  'booking-system',
  'course-platform',
  'landing-page',
  'marketplace',
  'crm',
  'support-system',
  'content-system',
  'custom',
]

interface AnthropicContentBlock {
  type: string
  text?: string
}

interface AnthropicErrorResponse {
  error?: { message?: string }
}

interface AnthropicSuccessResponse {
  content?: AnthropicContentBlock[]
  model?: string
  usage?: { input_tokens?: number; output_tokens?: number }
}

function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

function validateStructuredBlueprintInput(
  input: Record<string, unknown>
): StructuredProjectBlueprint | null {
  // Required strings with whitelist check on category
  if (typeof input['category'] !== 'string' || !input['category'].trim()) return null
  if (!VALID_CATEGORIES.includes(input['category'])) return null
  if (typeof input['objective'] !== 'string' || !input['objective'].trim()) return null
  if (typeof input['originalIdea'] !== 'string' || !input['originalIdea'].trim()) return null

  // Required arrays — must be arrays (can be empty)
  if (!Array.isArray(input['confirmedRequirements'])) return null
  if (!Array.isArray(input['inferredRequirements'])) return null
  if (!Array.isArray(input['suggestedRequirements'])) return null
  if (!Array.isArray(input['constraints'])) return null
  if (!Array.isArray(input['mvpScope'])) return null
  if (!Array.isArray(input['futureScope'])) return null

  const confLevels = ['high', 'medium', 'low'] as const
  const rawConf = input['confidenceLevel']
  const confidenceLevel = (confLevels as readonly unknown[]).includes(rawConf)
    ? (rawConf as 'high' | 'medium' | 'low')
    : 'medium'

  const integrationCapabilities: IntegrationCapability[] = Array.isArray(
    input['integrationCapabilities']
  )
    ? input['integrationCapabilities']
        .filter(
          (item): item is Record<string, unknown> =>
            typeof item === 'object' && item !== null && !Array.isArray(item)
        )
        .map((item) => ({
          name: typeof item['name'] === 'string' ? item['name'] : '',
          capabilities: strArr(item['capabilities']),
          risk: typeof item['risk'] === 'string' ? item['risk'] : '',
        }))
        .filter((item) => item.name.length > 0)
    : []

  return {
    id: typeof input['id'] === 'string' ? input['id'] : `api-${Date.now()}`,
    category: input['category'] as StructuredProjectCategory,
    subtype: typeof input['subtype'] === 'string' ? input['subtype'] : undefined,
    subtypeConfidence:
      typeof input['subtypeConfidence'] === 'number' ? input['subtypeConfidence'] : undefined,
    subtypeReasoning:
      typeof input['subtypeReasoning'] === 'string' ? input['subtypeReasoning'] : undefined,
    subtypeSignals: Array.isArray(input['subtypeSignals'])
      ? strArr(input['subtypeSignals'])
      : undefined,
    businessModel:
      typeof input['businessModel'] === 'string' ? input['businessModel'] : undefined,
    confidence:
      typeof input['confidence'] === 'number' && isFinite(input['confidence'])
        ? input['confidence']
        : 50,
    confidenceLevel,
    needsDiscovery:
      typeof input['needsDiscovery'] === 'boolean' ? input['needsDiscovery'] : false,
    originalIdea: input['originalIdea'] as string,
    baseIdea: typeof input['baseIdea'] === 'string' ? input['baseIdea'] : undefined,
    incorporatedDiscoveryAnswers: strArr(input['incorporatedDiscoveryAnswers']),
    objective: input['objective'] as string,
    audience: strArr(input['audience']),
    confirmedRequirements: strArr(input['confirmedRequirements']),
    inferredRequirements: strArr(input['inferredRequirements']),
    suggestedRequirements: strArr(input['suggestedRequirements']),
    screens: strArr(input['screens']),
    entities: strArr(input['entities']),
    roles: strArr(input['roles']),
    integrations: strArr(input['integrations']),
    suggestedIntegrations: strArr(input['suggestedIntegrations']),
    visualDesign: strArr(input['visualDesign']),
    suggestedVisualDesign: strArr(input['suggestedVisualDesign']),
    monetization: strArr(input['monetization']),
    constraints: strArr(input['constraints']),
    risks: strArr(input['risks']),
    mvpScope: strArr(input['mvpScope']),
    futureScope: strArr(input['futureScope']),
    nonFunctionalRequirements: strArr(input['nonFunctionalRequirements']),
    implementationRisks: strArr(input['implementationRisks']),
    integrationCapabilities,
    successMetrics: strArr(input['successMetrics']),
    pendingQuestions: [],
  }
}

export async function POST(req: NextRequest) {
  // ── 1. API key ─────────────────────────────────────────────────────────────
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

  // ── 3. Validate blueprint ──────────────────────────────────────────────────
  const rawBlueprint = body['blueprint']
  if (!rawBlueprint || typeof rawBlueprint !== 'object' || Array.isArray(rawBlueprint)) {
    return NextResponse.json({ error: 'blueprint es requerido' }, { status: 400 })
  }

  const blueprint = validateStructuredBlueprintInput(rawBlueprint as Record<string, unknown>)
  if (!blueprint) {
    return NextResponse.json(
      { error: 'blueprint inválido: faltan campos requeridos o category desconocida' },
      { status: 400 }
    )
  }

  // ── 4. Sanitize blueprint before building Claude prompt ────────────────────
  const preparedBlueprint = prepareBlueprintForApi(blueprint)

  // ── 5. Build prompts ───────────────────────────────────────────────────────
  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL
  const maxTokens = parseInt(process.env.ANTHROPIC_MAX_TOKENS ?? String(DEFAULT_MAX_TOKENS), 10)
  const timeoutMs = parseInt(process.env.ANTHROPIC_TIMEOUT_MS ?? String(DEFAULT_TIMEOUT_MS), 10)
  const systemPrompt = buildNexusApiSystemPrompt()
  const userPrompt = buildNexusApiUserPrompt(preparedBlueprint)

  // ── 6. Call Anthropic API with hard timeout ────────────────────────────────
  const startMs = Date.now()
  let raw: string
  let inputTokens = 0
  let outputTokens = 0

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

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
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
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
    inputTokens = data.usage?.input_tokens ?? 0
    outputTokens = data.usage?.output_tokens ?? 0

    if (!raw.trim()) {
      return NextResponse.json(
        { error: 'La API de Anthropic devolvió una respuesta vacía' },
        { status: 502 }
      )
    }
  } catch (err) {
    const durationMs = Date.now() - startMs
    if (err instanceof Error && err.name === 'AbortError') {
      console.log(JSON.stringify({
        event: 'nexus_generate', model, status: 'timeout', durationMs,
      }))
      return NextResponse.json(
        { error: 'Timeout al llamar a la API de Anthropic' },
        { status: 504 }
      )
    }
    console.log(JSON.stringify({
      event: 'nexus_generate', model, status: 'network_error', durationMs,
    }))
    return NextResponse.json(
      { error: 'Error de red al contactar la API de Anthropic' },
      { status: 500 }
    )
  } finally {
    clearTimeout(timeoutId)
  }

  // ── 7. Parse response ──────────────────────────────────────────────────────
  const durationMs = Date.now() - startMs
  let artifacts: NexusApiArtifacts
  try {
    artifacts = parseNexusApiResponse(raw)
    console.log(JSON.stringify({
      event: 'nexus_generate',
      model,
      status: 'success',
      parseSuccess: true,
      durationMs,
      inputTokens,
      outputTokens,
    }))
  } catch (err) {
    console.log(JSON.stringify({
      event: 'nexus_generate',
      model,
      status: 'parse_error',
      parseSuccess: false,
      durationMs,
      inputTokens,
      outputTokens,
    }))
    if (err instanceof NexusApiParseError) {
      return NextResponse.json(
        { error: `Respuesta inválida de la API: ${err.message}` },
        { status: 502 }
      )
    }
    return NextResponse.json(
      { error: 'Error inesperado al procesar la respuesta' },
      { status: 500 }
    )
  }

  return NextResponse.json({ artifacts })
}

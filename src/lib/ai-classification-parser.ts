import type { AiClassification } from '@/types/ai-classification'
import { AiClassificationParseError } from '@/types/ai-classification'
import type { StructuredProjectCategory } from '@/types/project-blueprint'

const VALID_CATEGORIES: readonly StructuredProjectCategory[] = [
  'booking-system',
  'course-platform',
  'landing-page',
  'marketplace',
  'crm',
  'support-system',
  'content-system',
  'custom',
]

function safeStr(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function safeStrArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((item): item is string => typeof item === 'string')
}

function safeNumber(v: unknown, fallback = 0): number {
  return typeof v === 'number' && isFinite(v) ? v : fallback
}

function safeCategory(v: unknown): StructuredProjectCategory {
  return (VALID_CATEGORIES as readonly string[]).includes(v as string)
    ? (v as StructuredProjectCategory)
    : 'custom'
}

function stripMarkdownFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()
}

export function parseAiClassification(raw: string): AiClassification {
  const cleaned = stripMarkdownFences(raw)

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new AiClassificationParseError('La respuesta de /classify no es JSON válido', raw)
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new AiClassificationParseError('La respuesta JSON de /classify no es un objeto', raw)
  }

  const data = parsed as Record<string, unknown>

  return {
    category: safeCategory(data['category']),
    subtype:
      typeof data['subtype'] === 'string' && data['subtype'].trim()
        ? data['subtype']
        : undefined,
    confidence: safeNumber(data['confidence'], 50),
    reasoning: safeStr(data['reasoning']),
    objective: safeStr(data['objective']),
    entities: safeStrArray(data['entities']),
    roles: safeStrArray(data['roles']),
    screens: safeStrArray(data['screens']),
    audience: safeStrArray(data['audience']),
    confirmedRequirements: safeStrArray(data['confirmedRequirements']),
    suggestedRequirements: safeStrArray(data['suggestedRequirements']),
    integrations: safeStrArray(data['integrations']),
  }
}

import { sanitizeFinalPromptBlueprint } from '@/lib/prompt-blueprint-generator'
import type { StructuredProjectBlueprint } from '@/types/project-blueprint'

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// Only keep discovery answers humanized by sanitizeDiscoveryDecision
const HUMANIZED_PREFIXES = ['decision confirmada:', 'restriccion confirmada:']

export function prepareBlueprintForApi(
  blueprint: StructuredProjectBlueprint
): StructuredProjectBlueprint {
  const sanitized = sanitizeFinalPromptBlueprint(blueprint)

  // Drop residual 'question -> raw answer' strings — keep only humanized lines
  const safeDiscoveryAnswers = (sanitized.incorporatedDiscoveryAnswers ?? []).filter((item) =>
    HUMANIZED_PREFIXES.some((prefix) => normalize(item).startsWith(prefix))
  )

  return {
    ...sanitized,
    incorporatedDiscoveryAnswers: safeDiscoveryAnswers,
  }
}

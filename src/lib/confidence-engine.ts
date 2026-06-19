import type {
  PendingQuestion,
  RequirementSeverity,
  StructuredProjectBlueprint,
  StructuredProjectCategory,
} from '@/types/project-blueprint'

type ConfidenceInput = Omit<StructuredProjectBlueprint, 'confidence' | 'confidenceLevel' | 'needsDiscovery'>

function usefulWordCount(value: string): number {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-záéíóúüñ0-9]/gi, ''))
    .filter((word) => word.length > 2 && !['quiero', 'necesito', 'para', 'una', 'app'].includes(word))
    .length
}

export function getConfidenceLevel(score: number): StructuredProjectBlueprint['confidenceLevel'] {
  if (score >= 75) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

function normalized(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function includesAny(value: string, keywords: string[]): boolean {
  const text = normalized(value)
  return keywords.some((keyword) => text.includes(normalized(keyword)))
}

function questionKeyFor(question: string): string {
  const text = normalized(question)
  if (/compra online|solo catalogo|solo catalogo|ecommerce|checkout/.test(text)) return 'marketplace_checkout_scope'
  if (/panel de administracion|subir y editar/.test(text)) return 'marketplace-admin-panel'
  if (/comentarios|visitantes/.test(text)) return 'marketplace-comments-source'
  if (/descuentos|temporada|manual/.test(text)) return 'marketplace-discounts-mode'
  if (/instagram/.test(text)) return 'marketplace-instagram-mode'
  if (/whatsapp/.test(text)) return 'marketplace-whatsapp-mode'
  if (/stock|unidades|inventario/.test(text)) return 'marketplace-stock-mode'
  return text.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64)
}

export function classifyQuestionSeverity(
  question: string,
  category: StructuredProjectCategory
): RequirementSeverity {
  if (category === 'booking-system' && includesAny(question, ['citas', 'agenda', 'disponibilidad', 'profesionales'])) {
    return 'critical'
  }

  if (category === 'marketplace' && includesAny(question, ['compra online', 'checkout', 'catalogo', 'catálogo', 'ecommerce'])) {
    return 'critical'
  }

  if (category === 'course-platform' && includesAny(question, ['acceso a cursos', 'tipo de contenido'])) {
    return 'critical'
  }

  if (category === 'support-system' && includesAny(question, ['canales de incidencias', 'sla', 'escalado'])) {
    return 'critical'
  }

  if (includesAny(question, [
    'stock',
    'personalizaciones visuales',
    'automatizaciones secundarias',
    'importaciones',
    'importara publicaciones',
    'importacion automatica',
    'instagram en una fase futura',
    'instagram api',
    'fase futura',
  ])) {
    return 'optional'
  }

  if (includesAny(question, ['idiomas', 'whatsapp', 'instagram', 'crm', 'analytics', 'integraciones'])) {
    return 'important'
  }

  return 'important'
}

function questionReason(_question: string, severity: RequirementSeverity, category: StructuredProjectCategory): string {
  if (severity === 'critical') {
    if (category === 'marketplace') return 'Define arquitectura comercial, pedidos y checkout.'
    if (category === 'booking-system') return 'Define agenda, disponibilidad y reglas de reserva.'
    if (category === 'course-platform') return 'Define acceso, contenido y modelo del aprendizaje.'
    if (category === 'support-system') return 'Define flujo de incidencias, prioridad y escalado.'
    return 'Bloquea decisiones clave del sistema base.'
  }

  if (severity === 'important') return 'Mejora la arquitectura, integraciones y alcance funcional.'
  return 'Puede aplazarse sin bloquear el sistema base.'
}

export function normalizePendingQuestions(
  questions: Array<string | PendingQuestion>,
  category: StructuredProjectCategory,
  mode: 'classify' | 'legacy' = 'classify'
): PendingQuestion[] {
  const seen = new Set<string>()

  return questions.reduce<PendingQuestion[]>((result, item) => {
    const pendingQuestion = typeof item === 'string'
      ? {
          questionKey: questionKeyFor(item),
          question: item,
          severity: mode === 'legacy' ? 'important' : classifyQuestionSeverity(item, category),
          reason: mode === 'legacy'
            ? 'Migrated from legacy format'
            : questionReason(item, classifyQuestionSeverity(item, category), category),
        }
      : { ...item, questionKey: item.questionKey ?? questionKeyFor(item.question) }
    const key = normalized(pendingQuestion.question).trim()

    if (!key || seen.has(key)) return result
    seen.add(key)
    result.push(pendingQuestion)
    return result
  }, [])
}

export function calculateBlueprintConfidence(blueprint: ConfidenceInput): number {
  let score = 0
  const usefulWords = usefulWordCount(blueprint.originalIdea)

  if (blueprint.category !== 'custom' || blueprint.aiClassified) score += 25
  if (blueprint.objective && !blueprint.objective.toLowerCase().includes('definir y construir')) score += 15
  if (blueprint.audience.length > 0 && !blueprint.audience.includes('usuarios-objetivo-del-proyecto')) score += 10
  score += Math.min(18, blueprint.confirmedRequirements.length * 6)
  score += Math.min(12, blueprint.inferredRequirements.length * 3)
  if (blueprint.integrations.length > 0) score += 10
  if (blueprint.roles.length > 0) score += 7
  if (blueprint.entities.length > 0) score += 8

  if (blueprint.originalIdea.length < 28) score -= 10
  if (usefulWords < 5) score -= 15
  if (blueprint.category === 'custom' && !blueprint.aiClassified) score -= 20
  if (blueprint.confirmedRequirements.length === 0 && blueprint.inferredRequirements.length === 0) score -= 15
  if (blueprint.entities.length === 0) score -= 10

  const criticalQuestions = blueprint.pendingQuestions.filter((question) => question.severity === 'critical')
  const importantQuestions = blueprint.pendingQuestions.filter((question) => question.severity === 'important')
  const optionalQuestions = blueprint.pendingQuestions.filter((question) => question.severity === 'optional')

  score -= Math.min(18, importantQuestions.length * 4)
  score -= Math.min(5, optionalQuestions.length)

  if (criticalQuestions.length > 0) return Math.max(0, Math.min(49, score - Math.min(30, criticalQuestions.length * 10)))

  const clampedScore = Math.max(0, Math.min(100, score))
  if (importantQuestions.length === 0 && optionalQuestions.length > 0) return Math.max(90, clampedScore)
  return clampedScore
}

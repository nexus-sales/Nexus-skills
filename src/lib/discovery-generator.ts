import { DISCOVERY_CATALOG } from '@/lib/discovery-catalog'
import type { StructuredProjectBlueprint, StructuredProjectCategory } from '@/types/project-blueprint'

function normalized(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function matchesAny(question: string, terms: string[]): boolean {
  const q = normalized(question)
  return terms.some((t) => q.includes(normalized(t)))
}

function isCommerce(blueprint: StructuredProjectBlueprint): boolean {
  return (
    blueprint.category === 'marketplace' ||
    matchesAny(blueprint.subtype ?? '', ['commerce', 'shop', 'tienda', 'inventor', 'subscri', 'members'])
  )
}

function isBookingContext(blueprint: StructuredProjectBlueprint): boolean {
  return (
    blueprint.category === 'booking-system' ||
    matchesAny(blueprint.originalIdea, ['cita', 'reserva', 'agenda', 'disponibilidad', 'turno'])
  )
}

function isRelevantQuestion(question: string, blueprint: StructuredProjectBlueprint): boolean {
  // Stock: only meaningful in commerce/inventory contexts
  if (matchesAny(question, ['stock', 'unidades disponibles'])) return isCommerce(blueprint)

  // Appointments: only meaningful when booking is in scope
  if (/gestionara citas\??$/i.test(question.trim())) return isBookingContext(blueprint)

  // Subscription/pricing model: only for course platforms and commerce
  if (matchesAny(question, ['pago unico', 'suscripcion'])) {
    return blueprint.category === 'course-platform' || isCommerce(blueprint)
  }

  // Platform choice is moot if the idea already specifies the platform
  if (matchesAny(question, ['web, movil', 'web o movil', 'movil o ambas'])) {
    return !matchesAny(blueprint.originalIdea, ['app', 'movil', 'ios', 'android'])
  }

  return true
}

export function generateDiscoveryQuestions(
  categoryOrBlueprint: StructuredProjectCategory | StructuredProjectBlueprint
): string[] {
  const category = typeof categoryOrBlueprint === 'string' ? categoryOrBlueprint : categoryOrBlueprint.category

  // Legacy domain-specific override: kept as local fallback for vet clinics
  if (typeof categoryOrBlueprint !== 'string' && /veterinari/i.test(categoryOrBlueprint.originalIdea)) {
    return [
      'Sera para clientes o para personal interno?',
      'Gestionara citas?',
      'Gestionara historiales medicos?',
      'Gestionara vacunaciones?',
    ]
  }

  // AI-classified blueprints with a specific subtype already have domain data —
  // returning generic custom questions would be misleading and redundant.
  if (
    typeof categoryOrBlueprint !== 'string' &&
    categoryOrBlueprint.aiClassified &&
    category === 'custom' &&
    categoryOrBlueprint.subtype &&
    categoryOrBlueprint.subtype !== 'generic'
  ) {
    return []
  }

  const baseQuestions = DISCOVERY_CATALOG[category] ?? DISCOVERY_CATALOG.custom

  if (typeof categoryOrBlueprint === 'string') {
    return baseQuestions
  }

  return baseQuestions.filter((q) => isRelevantQuestion(q, categoryOrBlueprint))
}

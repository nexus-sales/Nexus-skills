import { DISCOVERY_CATALOG } from '@/lib/discovery-catalog'
import type { StructuredProjectBlueprint, StructuredProjectCategory } from '@/types/project-blueprint'

export function generateDiscoveryQuestions(
  categoryOrBlueprint: StructuredProjectCategory | StructuredProjectBlueprint
): string[] {
  const category = typeof categoryOrBlueprint === 'string' ? categoryOrBlueprint : categoryOrBlueprint.category
  const baseQuestions = DISCOVERY_CATALOG[category] ?? DISCOVERY_CATALOG.custom

  if (typeof categoryOrBlueprint !== 'string' && /veterinari/i.test(categoryOrBlueprint.originalIdea)) {
    return [
      'Sera para clientes o para personal interno?',
      'Gestionara citas?',
      'Gestionara historiales medicos?',
      'Gestionara vacunaciones?',
      'Sera web, movil o ambas?',
    ]
  }

  return baseQuestions
}

import { DOMAIN_CATALOG } from '@/lib/domain-catalog'
import type { AiClassification } from '@/types/ai-classification'
import { generateProjectBlueprint } from '@/lib/blueprint-generator'
import { calculateBlueprintConfidence, getConfidenceLevel, normalizePendingQuestions } from '@/lib/confidence-engine'
import {
  applyDiscoveryAnswersToBlueprint,
  cleanIdeaFromDiscoveryAnswers,
  parseDiscoveryAnswers,
} from '@/lib/discovery-answer-parser'
import { getDomainKnowledgeRules } from '@/lib/domain-knowledge-rules'
import { generateDiscoveryQuestions } from '@/lib/discovery-generator'
import { refineProjectDomain } from '@/lib/domain-refinement-engine'
import type { ProjectBlueprint } from '@/types/blueprint'
import type { StructuredProjectBlueprint, StructuredProjectCategory } from '@/types/project-blueprint'

const SYNONYMS: Record<string, string> = {
  'pasarela-de-pago': 'payment-gateway',
  'base-de-conocimiento': 'knowledge-base',
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}

export function uniqueValues(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => SYNONYMS[normalizeToken(item)] ?? normalizeToken(item)).filter(Boolean)))
}

export function humanizeBlueprintLabel(value: string): string {
  const known: Record<string, string> = {
    cta: 'CTA',
    crm: 'CRM',
    sla: 'SLA',
    whatsapp: 'WhatsApp',
    'google-calendar': 'Google Calendar',
    'payment-gateway': 'Pasarela de pago',
    'knowledge-base': 'Base de conocimiento',
  }
  if (known[value]) return known[value]
  return value.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

function mapCategory(category: ProjectBlueprint['category']): StructuredProjectCategory {
  if (category === 'booking-system') return 'booking-system'
  if (category === 'course-platform') return 'course-platform'
  if (category === 'landing-page') return 'landing-page'
  if (category === 'marketplace' || category === 'ecommerce') return 'marketplace'
  if (category === 'crm') return 'crm'
  if (category === 'helpdesk') return 'support-system'
  if (category === 'content-site') return 'content-system'
  return 'custom'
}

function getDomainDefaults(category: StructuredProjectCategory) {
  return category === 'custom' ? null : DOMAIN_CATALOG[category]
}

function removeKnown(items: string[], known: string[]): string[] {
  const knownSet = new Set(known.map((item) => SYNONYMS[normalizeToken(item)] ?? normalizeToken(item)))
  return uniqueValues(items).filter((item) => !knownSet.has(item))
}

function removeResolvedQuestions(questions: string[], category: StructuredProjectCategory, idea: string): string[] {
  const normalizedIdea = normalizeToken(idea)

  return questions.filter((question) => {
    const normalizedQuestion = normalizeToken(question)
    if (
      category === 'marketplace' &&
      /marketplace|ecommerce|tienda|checkout|compra-online|catalogo|catálogo/.test(normalizedIdea) &&
      /compra-online|solo-catalogo|ecommerce|checkout/.test(normalizedQuestion)
    ) {
      return false
    }

    return true
  })
}

function resolvedQuestionTexts(blueprint: StructuredProjectBlueprint): string {
  return normalizeToken([
    ...blueprint.confirmedRequirements,
    ...blueprint.integrations,
    ...blueprint.constraints,
    ...blueprint.monetization,
    ...(blueprint.incorporatedDiscoveryAnswers ?? []),
  ].join(' '))
}

function filterKnowledgeQuestions(
  blueprint: StructuredProjectBlueprint,
  questions: string[]
): string[] {
  const resolvedText = resolvedQuestionTexts(blueprint)

  return questions.filter((question) => {
    const normalizedQuestion = normalizeToken(question)
    if (
      /compra-online|checkout|catalogo/.test(normalizedQuestion) &&
      /venta-local|checkout-online-pospuesto-a-fase-2|catalogo-con-contacto-local/.test(resolvedText)
    ) {
      return false
    }

    if (
      /recordatorios/.test(normalizedQuestion) &&
      /recordatorio/.test(resolvedText)
    ) {
      return false
    }

    if (
      /comentarios/.test(normalizedQuestion) &&
      /comentarios-de-creador-y-visitantes/.test(resolvedText)
    ) {
      return false
    }

    return true
  })
}

export function generateStructuredBlueprint(
  idea: string,
  projectBlueprint = generateProjectBlueprint(idea),
  classificationOverride?: AiClassification
): StructuredProjectBlueprint {
  const category = classificationOverride?.category ?? mapCategory(projectBlueprint.category)
  const defaults = classificationOverride
    ? {
        defaultScreens: classificationOverride.screens,
        defaultEntities: classificationOverride.entities,
        defaultRoles: classificationOverride.roles,
        defaultSuggestedIntegrations: classificationOverride.integrations,
        defaultRisks: [] as string[],
      }
    : getDomainDefaults(category)
  const confirmedRequirements = classificationOverride
    ? uniqueValues(classificationOverride.confirmedRequirements)
    : uniqueValues(projectBlueprint.confirmedFeatures ?? [])
  const inferredRequirements = classificationOverride
    ? uniqueValues(classificationOverride.suggestedRequirements)
    : removeKnown(projectBlueprint.inferredFeatures ?? [], confirmedRequirements)
  const suggestedRequirements = uniqueValues([
    ...(projectBlueprint.suggestedMonetization ?? []),
    ...(projectBlueprint.suggestedVisualDesign ?? []),
  ])
  const integrations = uniqueValues(projectBlueprint.confirmedIntegrations ?? projectBlueprint.integrations)

  const initialQuestions = normalizePendingQuestions(
    removeResolvedQuestions(uniqueValues(projectBlueprint.questions), category, idea),
    category
  )

  const draft = {
    id: projectBlueprint.id,
    category,
    subtype: classificationOverride?.subtype ?? 'generic',
    subtypeConfidence: classificationOverride?.confidence ?? 0,
    subtypeReasoning: classificationOverride?.reasoning ?? '',
    subtypeSignals: [],
    businessModel: undefined,
    mvpScope: [],
    futureScope: [],
    nonFunctionalRequirements: [],
    implementationRisks: [],
    integrationCapabilities: [],
    successMetrics: [],
    confidence: 0,
    confidenceLevel: 'low' as const,
    needsDiscovery: true,
    originalIdea: projectBlueprint.originalIdea,
    baseIdea: projectBlueprint.originalIdea,
    incorporatedDiscoveryAnswers: [],
    objective: classificationOverride?.objective ?? projectBlueprint.objective,
    audience: classificationOverride?.audience.length
      ? uniqueValues(classificationOverride.audience)
      : uniqueValues([projectBlueprint.audience]),
    confirmedRequirements,
    inferredRequirements,
    suggestedRequirements,
    screens: uniqueValues(defaults?.defaultScreens ?? []),
    entities: uniqueValues(projectBlueprint.entities.length > 0 ? projectBlueprint.entities : (defaults?.defaultEntities ?? [])),
    roles: uniqueValues(projectBlueprint.roles.length > 0 ? projectBlueprint.roles : (defaults?.defaultRoles ?? [])),
    integrations,
    suggestedIntegrations: removeKnown([
      ...(projectBlueprint.suggestedIntegrations ?? []),
      ...(defaults?.defaultSuggestedIntegrations ?? []),
    ], integrations),
    visualDesign: uniqueValues(projectBlueprint.confirmedVisualDesign ?? []),
    suggestedVisualDesign: removeKnown(projectBlueprint.suggestedVisualDesign ?? [], projectBlueprint.confirmedVisualDesign ?? []),
    monetization: uniqueValues(projectBlueprint.confirmedMonetization ?? projectBlueprint.monetization),
    constraints: [],
    risks: uniqueValues([...(projectBlueprint.risks ?? []), ...(defaults?.defaultRisks ?? [])]),
    pendingQuestions: initialQuestions,
  }

  const initialAnswers = parseDiscoveryAnswers(idea, draft.pendingQuestions)
  const answeredDraft = initialAnswers.length > 0
    ? {
        ...applyDiscoveryAnswersToBlueprint(draft, initialAnswers),
        baseIdea: cleanIdeaFromDiscoveryAnswers(projectBlueprint.originalIdea, initialAnswers),
      }
    : draft
  const confidence = calculateBlueprintConfidence(answeredDraft)
  const confidenceLevel = getConfidenceLevel(confidence)
  const discoveryQuestions = normalizePendingQuestions(
    generateDiscoveryQuestions({ ...answeredDraft, confidence, confidenceLevel, needsDiscovery: true }),
    category
  )
  const finalQuestions = confidenceLevel === 'low' && initialAnswers.length === 0
    ? discoveryQuestions
    : answeredDraft.pendingQuestions
  const finalConfidence = calculateBlueprintConfidence({ ...answeredDraft, pendingQuestions: finalQuestions })
  const finalConfidenceLevel = getConfidenceLevel(finalConfidence)
  const refinedDomain = refineProjectDomain({
    ...answeredDraft,
    confidence: finalConfidence,
    confidenceLevel: finalConfidenceLevel,
    needsDiscovery: false,
    pendingQuestions: finalQuestions,
  })
  const knowledgeRules = getDomainKnowledgeRules(category, refinedDomain.subtype)
  const knowledgeQuestions = normalizePendingQuestions([
    ...filterKnowledgeQuestions(answeredDraft, knowledgeRules.criticalQuestions),
    ...filterKnowledgeQuestions(answeredDraft, knowledgeRules.recommendedQuestions),
    ...filterKnowledgeQuestions(answeredDraft, knowledgeRules.optionalQuestions),
  ], category)
  const mergedQuestions = normalizePendingQuestions([
    ...finalQuestions,
    ...knowledgeQuestions,
  ], category)
  const mergedBlueprintDraft = {
    ...answeredDraft,
    pendingQuestions: mergedQuestions,
  }
  const mergedConfidence = calculateBlueprintConfidence(mergedBlueprintDraft)
  const mergedConfidenceLevel = getConfidenceLevel(mergedConfidence)
  const hasBlockingDiscovery =
    mergedConfidence < 40 ||
    answeredDraft.confirmedRequirements.length < 2
  const consolidatedIntegrations = refinedDomain.integrationCapabilities.length > 0
    ? refinedDomain.integrationCapabilities.map((capability) => capability.name)
    : answeredDraft.integrations
  const consolidatedSuggestedIntegrations = refinedDomain.subtype === 'artisan-catalog'
    ? answeredDraft.suggestedIntegrations.filter((item) => !['payment-gateway', 'pasarela-de-pago', 'instagram', 'whatsapp'].includes(normalizeToken(item)))
    : answeredDraft.suggestedIntegrations

  return {
    ...answeredDraft,
    subtype: classificationOverride?.subtype ?? refinedDomain.subtype,
    subtypeConfidence: classificationOverride?.confidence ?? refinedDomain.confidence,
    subtypeReasoning: classificationOverride?.reasoning ?? refinedDomain.reasoning,
    subtypeSignals: refinedDomain.signals,
    businessModel: refinedDomain.businessModel,
    mvpScope: uniqueValues([...refinedDomain.mvpScope, ...knowledgeRules.mvpDefaults]),
    futureScope: uniqueValues([...refinedDomain.futureScope, ...knowledgeRules.futureDefaults]),
    nonFunctionalRequirements: uniqueValues([...refinedDomain.nonFunctionalRequirements, ...knowledgeRules.nonFunctionalRequirements]),
    implementationRisks: uniqueValues([...refinedDomain.implementationRisks, ...knowledgeRules.risks]),
    integrationCapabilities: refinedDomain.integrationCapabilities,
    successMetrics: uniqueValues([...refinedDomain.successMetrics, ...knowledgeRules.successMetrics]),
    integrations: consolidatedIntegrations,
    suggestedIntegrations: consolidatedSuggestedIntegrations,
    confidence: mergedConfidence,
    confidenceLevel: mergedConfidenceLevel,
    needsDiscovery: hasBlockingDiscovery,
    pendingQuestions: mergedQuestions,
  }
}

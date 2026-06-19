import type { PromptBlueprint } from '@/types/prompt-blueprint'
import type { TargetModel } from '@/types/prompt'
import type { StructuredProjectBlueprint } from '@/types/project-blueprint'

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const HUMANIZED_PREFIXES = [
  'idea base:',
  'categoria visible:',
  'modelo de negocio:',
  'objetivo confirmado:',
  'audiencia confirmada:',
  'decision confirmada:',
  'restriccion confirmada:',
  'requisito confirmado:',
  'integracion confirmada:',
  'diseno confirmado:',
  'monetizacion confirmada:',
]

function canonicalPromptItem(value: string): string {
  const text = normalize(value)
  // Never mangle already-humanized lines — they carry a valid prefix
  if (HUMANIZED_PREFIXES.some((prefix) => text.startsWith(prefix))) return value
  if (/^i18n([-\s].*)?$/.test(text) || /i18n.*es.*en.*fr/.test(text)) return 'i18n ES/EN/FR'
  if (/estructura.*traducciones.*contenido dinamico/.test(text)) return 'estructura para traducciones de contenido dinámico'
  if (/mobile-first|responsive\/mobile-first|responsive/.test(text)) return 'responsive/mobile-first'
  if (/seo-basico-para-productos|seo productos/.test(text)) return 'SEO básico para productos'
  if (/imagenes-optimizadas|performance-en-imagenes/.test(text)) return 'performance en imágenes'
  if (/accesibilidad basica/.test(text)) return 'accesibilidad básica'
  if (/clics.*whatsapp/.test(text)) return 'clics en WhatsApp'
  if (/visitas-a-ficha-de-producto|visitas-ficha-producto/.test(text)) return 'visitas a ficha de producto'
  if (/productos publicados/.test(text)) return 'productos publicados'
  if (/contactos generados/.test(text)) return 'contactos generados'
  if (/tiempo de carga de imagenes/.test(text)) return 'tiempo de carga de imágenes'
  // Exact match only — don't mangle compound phrases like checkout-online-pospuesto-a-fase-2
  if (/^(checkout-online|checkout online)$/.test(text)) return 'checkout online'
  if (/^(stock-avanzado|stock avanzado)$/.test(text)) return 'stock avanzado'
  // Match both word orders: importacion-instagram-automatica AND importacion-automatica-desde-instagram-api
  if (/importacion.*instagram.*automatica|importacion.*automatica.*instagram/.test(text)) return 'importacion-instagram-automatica'
  if (/payment-gateway|pasarela de pago|pasarela-de-pago/.test(text)) return 'pasarela-de-pago'
  return value
}

function uniquePromptItems(items: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const item of items.filter(Boolean)) {
    const canonical = canonicalPromptItem(item)
    // Strip trailing dots and normalize hyphens: "checkout-online-pospuesto-a-fase-2"
    // and "Checkout online pospuesto a fase 2." share the same dedup key
    const key = normalize(canonical).replace(/\.\s*$/, '').replace(/-/g, ' ')
    if (seen.has(key)) continue
    seen.add(key)
    result.push(canonical)
  }

  return result
}

function formatPromptList(items: string[]): string {
  const unique = uniquePromptItems(items)
  return unique.length > 0 ? unique.map((item) => `- ${item}`).join('\n') : '- No especificado'
}

function formatIntegrationCapabilities(
  items: StructuredProjectBlueprint['integrationCapabilities']
): string {
  return items.length > 0
    ? items.map((item) => `- ${item.name}: ${uniquePromptItems(item.capabilities).join(', ')}. Riesgo: ${item.risk}`).join('\n')
    : '- No especificado'
}

function expertLabel(blueprint: StructuredProjectBlueprint): string {
  if (blueprint.subtype === 'artisan-catalog') return 'catalogo artesanal / comercio local monovendedor'
  if (blueprint.subtype && blueprint.subtype !== 'generic') return blueprint.subtype
  return blueprint.category
}

function selectTargetModel(blueprint: StructuredProjectBlueprint): TargetModel {
  if (blueprint.category === 'support-system' || blueprint.category === 'course-platform') return 'claude'
  if (blueprint.category === 'landing-page' || blueprint.category === 'marketplace') return 'gpt4'
  return 'universal'
}

function buildOutputFormat(blueprint: StructuredProjectBlueprint): string {
  if (blueprint.subtype && blueprint.subtype !== 'generic') {
    return `blueprint de ${blueprint.subtype} con pantallas, entidades, roles, reglas, integraciones, riesgos y proximos pasos`
  }
  if (blueprint.category === 'booking-system') return 'blueprint de reservas con pantallas, entidades, roles, reglas de agenda e integraciones'
  if (blueprint.category === 'landing-page') return 'blueprint de landing con secciones, formulario, CTA, entidades y medicion'
  if (blueprint.category === 'course-platform') return 'blueprint de cursos con catalogo, modulos, lecciones, progreso y permisos'
  if (blueprint.category === 'support-system') return 'blueprint de soporte con tickets, prioridades, estados, roles y escalado'
  if (blueprint.category === 'marketplace') return 'blueprint de marketplace/catalogo con pantallas, entidades, roles y flujo comercial'
  return 'blueprint de producto con pantallas, entidades, roles, riesgos y proximos pasos'
}

const CONFIRMED_ALLOWED_PREFIXES = [
  'idea base:',
  'categoria visible:',
  'modelo de negocio:',
  'objetivo confirmado:',
  'audiencia confirmada:',
  'decision confirmada:',
  'restriccion confirmada:',
  'requisito confirmado:',
  'integracion confirmada:',
  'diseno confirmado:',
  'monetizacion confirmada:',
]

// Header facts are factual metadata — never filtered by prohibited content
const CONFIRMED_HEADER_PREFIXES = [
  'idea base:',
  'categoria visible:',
  'modelo de negocio:',
  'objetivo confirmado:',
  'audiencia confirmada:',
]

function sanitizeConfirmedLines(items: string[]): string[] {
  const prohibitedConfirmedItems = [
    'pasarela-de-pago',
    'payment-gateway',
    'checkout-online',
    'pedidos',
    'gestion-de-stock',
    'stock',
    'stock-simple',
  ]

  return items.filter((item) => {
    const normalizedItem = normalize(item)

    // Drop any line that doesn't start with a valid humanized prefix
    if (!CONFIRMED_ALLOWED_PREFIXES.some((prefix) => normalizedItem.startsWith(prefix))) {
      return false
    }

    // Header facts (idea, objetivo, audiencia…) are never filtered — their content
    // may mention prohibited terms (e.g. "stock" in the original idea) but that's fine
    if (CONFIRMED_HEADER_PREFIXES.some((prefix) => normalizedItem.startsWith(prefix))) {
      return true
    }

    // Allow valid restriction phrases that contain otherwise-prohibited keywords
    if (
      normalizedItem.startsWith('restriccion confirmada: stock avanzado') ||
      normalizedItem.startsWith('restriccion confirmada: stock-avanzado') ||
      normalizedItem.startsWith('restriccion confirmada: checkout online pospuesto') ||
      normalizedItem.startsWith('restriccion confirmada: checkout-online-pospuesto')
    ) {
      return true
    }

    return !prohibitedConfirmedItems.some((prohibited) => normalizedItem.includes(prohibited))
  })
}

function hasExplicitStockDecision(blueprint: StructuredProjectBlueprint): boolean {
  const text = normalize([
    ...(blueprint.incorporatedDiscoveryAnswers ?? []),
    ...blueprint.confirmedRequirements,
    ...blueprint.constraints,
  ].join(' '))

  return /stock|inventario|unidades/.test(text)
}

function isStockDeferred(blueprint: StructuredProjectBlueprint): boolean {
  const text = normalize([
    ...(blueprint.incorporatedDiscoveryAnswers ?? []),
    ...blueprint.constraints,
    ...blueprint.futureScope,
  ].join(' '))
  return /stock.*fase futura|stock.*opcional|sin stock|stock avanzado|puede aplazarse|no bloquea/.test(text)
}

function sanitizeDiscoveryDecision(answer: string): string[] {
  const text = normalize(answer)
  const parts = answer.split('->')
  const rawAnswer = (parts.length > 1 ? parts[parts.length - 1] : answer).trim()
  const normalizedAnswer = normalize(rawAnswer)

  if (/puede aplazarse sin bloquear el sistema base/.test(text)) {
    return []
  }

  if (/venta local con checkout online pospuesto a fase 2/.test(normalizedAnswer)) {
    return [
      'Decisión confirmada: Venta local en fase 1.',
      'Restricción confirmada: Checkout online pospuesto a fase 2.',
    ]
  }

  if (/panel de administracion|si, tiene que haberlo/.test(normalizedAnswer)) {
    return ['Decisión confirmada: Panel de administración requerido para crear y editar productos.']
  }

  if (/comentarios.*visitantes|comentarios-de-creador-y-visitantes|ambos/.test(normalizedAnswer)) {
    return ['Decisión confirmada: Comentarios permitidos para creador y visitantes.']
  }

  // "manuelmente" is a common typo for "manualmente" — match both
  if (
    /descuentos.*manual|descuentos-estacionales-y-manuales|temporada y manualmente|temporada y manuelmente|por temporada/.test(normalizedAnswer) ||
    (/descuentos|temporada|oferta/.test(text) && /manual|manualmente|manuelmente|temporada/.test(normalizedAnswer))
  ) {
    return ['Decisión confirmada: Descuentos estacionales y ofertas puntuales manuales.']
  }

  // "ambas" only makes sense as instagram when the question mentions instagram
  if (/instagram/.test(normalizedAnswer) || (/instagram/.test(text) && /ambas|enlace|importacion|manual/.test(normalizedAnswer))) {
    return ['Decisión confirmada: Instagram como enlace e importación manual.']
  }

  // "si, será el contacto" only makes sense as whatsapp when the question mentions whatsapp
  if (/whatsapp/.test(normalizedAnswer) || (/whatsapp/.test(text) && /si|contacto|sera|canal/.test(normalizedAnswer))) {
    return ['Decisión confirmada: WhatsApp como canal de contacto.']
  }

  return [`Decisión confirmada: ${rawAnswer}.`]
}

function filterPromptQuestions(
  blueprint: StructuredProjectBlueprint,
  questions: PromptBlueprint['questions']
): PromptBlueprint['questions'] {
  const futureScopeText = normalize(blueprint.futureScope.join(' '))
  const risksText = normalize(blueprint.implementationRisks.join(' '))

  return questions.filter((question) => {
    const text = normalize(question.question)

    if (
      question.severity === 'optional' &&
      /instagram/.test(text) &&
      (/importacion-instagram-automatica/.test(futureScopeText) || /instagram api/.test(risksText))
    ) {
      return false
    }

    if (
      question.severity === 'optional' &&
      /stock|inventario|unidades/.test(text) &&
      /stock avanzado/.test(futureScopeText)
    ) {
      return false
    }

    return true
  })
}

function deslugify(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}

function humanizeAudienceItems(items: string[]): string[] {
  return items
    .flatMap((item) => item.split(',').map((s) => s.trim().replace(/-/g, ' ')))
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
}

export function sanitizeFinalPromptBlueprint(blueprint: StructuredProjectBlueprint): StructuredProjectBlueprint {
  const sanitizedNonFunctionalRequirements = uniquePromptItems(
    blueprint.subtype === 'artisan-catalog'
      ? [
          'responsive/mobile-first',
          'SEO básico para productos',
          'performance en imágenes',
          'accesibilidad básica',
          'i18n ES/EN/FR',
          'estructura para traducciones de contenido dinámico',
        ]
      : blueprint.nonFunctionalRequirements
  )

  const sanitizedSuccessMetrics = uniquePromptItems(
    blueprint.subtype === 'artisan-catalog'
      ? [
          'clics en WhatsApp',
          'visitas a ficha de producto',
          'productos publicados',
          'contactos generados',
          'tiempo de carga de imágenes',
        ]
      : blueprint.successMetrics
  )

  const checkoutDeferred = blueprint.constraints.includes('checkout-online-pospuesto-a-fase-2')
  const stockAnswered = hasExplicitStockDecision(blueprint)
  const stockDeferred = isStockDeferred(blueprint)
  const stockQuestionPresent = blueprint.pendingQuestions.some((item) => item.questionKey === 'marketplace-stock-mode' || /stock|inventario|unidades/.test(normalize(item.question)))

  const confirmedRequirements = blueprint.confirmedRequirements.filter((item) => {
    if (checkoutDeferred && /pasarela-de-pago|payment-gateway|checkout-online|pedidos/.test(normalize(item))) return false
    if (item === 'gestion-de-stock' && !stockAnswered) return false
    if (item === 'gestion-de-stock' && stockDeferred) return false
    if (/stock|stock-simple/.test(normalize(item)) && (stockQuestionPresent || stockDeferred)) return false
    return true
  })

  const integrations = blueprint.integrations.filter((item) => !(checkoutDeferred && /pasarela-de-pago|payment-gateway/.test(normalize(item))))
  const monetization = blueprint.monetization.filter((item) => !(checkoutDeferred && /payment-gateway|pasarela|checkout-online/.test(normalize(item))))

  const constraints = uniquePromptItems([
    ...blueprint.constraints,
    ...(stockDeferred ? ['stock-avanzado-fase-futura'] : []),
  ])

  const optionalStockQuestion = !stockAnswered
    ? [{
        questionKey: 'marketplace-stock-mode',
        question: 'Necesitas gestión de stock o unidades disponibles?',
        severity: 'optional' as const,
        reason: 'Define si el MVP necesita control simple de unidades o puede aplazarse.',
      }]
    : []

  const pendingQuestions = [
    ...blueprint.pendingQuestions.filter((item) => item.questionKey !== 'marketplace-stock-mode'),
    ...((!stockAnswered || stockDeferred) ? optionalStockQuestion : []),
  ]

  const mvpScope = blueprint.subtype === 'artisan-catalog'
    ? uniquePromptItems([
        ...blueprint.mvpScope.filter((item) => !/instagram.*automatica|pasarela|payment-gateway|checkout online/.test(normalize(item))),
        'Venta local en fase 1',
        'Instagram como enlace/perfil y carga manual de contenido',
        'WhatsApp como contacto por wa.me',
      ])
    : uniquePromptItems(blueprint.mvpScope)

  const futureScope = uniquePromptItems([
    ...blueprint.futureScope,
    ...(checkoutDeferred ? ['checkout online', 'pasarela-de-pago'] : []),
    ...(blueprint.subtype === 'artisan-catalog' ? ['importacion-instagram-automatica'] : []),
    ...((stockDeferred || stockQuestionPresent) ? ['stock-avanzado'] : []),
  ])

  const suggestedIntegrations = blueprint.suggestedIntegrations.filter((item) => {
    if (checkoutDeferred && /payment-gateway|pasarela/.test(normalize(item))) return false
    return true
  })

  const incorporatedDiscoveryAnswers = uniquePromptItems(
    (blueprint.incorporatedDiscoveryAnswers ?? []).flatMap(sanitizeDiscoveryDecision)
  )

  const integrationCapabilities = blueprint.integrationCapabilities.map((item) => {
    if (blueprint.subtype === 'artisan-catalog' && item.name === 'Instagram') {
      return {
        ...item,
        capabilities: uniquePromptItems(['profile-link', 'manual-content-load']),
      }
    }

    if (item.name === 'WhatsApp') {
      return {
        ...item,
        capabilities: uniquePromptItems(['contact-button', 'wa.me-link']),
      }
    }

    return {
      ...item,
      capabilities: uniquePromptItems(item.capabilities),
    }
  })

  return {
    ...blueprint,
    confirmedRequirements: uniquePromptItems(confirmedRequirements),
    integrations: uniquePromptItems(integrations),
    suggestedIntegrations: uniquePromptItems(suggestedIntegrations),
    monetization: uniquePromptItems(monetization),
    constraints: uniquePromptItems(constraints),
    pendingQuestions,
    mvpScope,
    futureScope,
    nonFunctionalRequirements: sanitizedNonFunctionalRequirements,
    successMetrics: sanitizedSuccessMetrics,
    incorporatedDiscoveryAnswers,
    integrationCapabilities,
  }
}

export function generatePromptBlueprint(blueprint: StructuredProjectBlueprint): PromptBlueprint {
  const sanitizedBlueprint = sanitizeFinalPromptBlueprint(blueprint)

  return {
    role: `Eres un arquitecto de producto especializado en ${expertLabel(sanitizedBlueprint)}.`,
    task: `Disena la arquitectura funcional y el sistema base para: ${sanitizedBlueprint.objective}.`,
    context: [
      `Idea base: ${sanitizedBlueprint.baseIdea ?? sanitizedBlueprint.originalIdea}`,
      sanitizedBlueprint.subtype && sanitizedBlueprint.subtype !== 'generic' ? `Categoria visible: ${sanitizedBlueprint.subtype}` : `Categoria visible: ${sanitizedBlueprint.category}`,
      sanitizedBlueprint.subtypeReasoning && `Razon de subtipo: ${sanitizedBlueprint.subtypeReasoning}`,
      sanitizedBlueprint.subtypeSignals?.length ? `Senales de subtipo: ${sanitizedBlueprint.subtypeSignals.join(', ')}` : '',
      sanitizedBlueprint.businessModel ? `Modelo de negocio: ${sanitizedBlueprint.businessModel}` : '',
      `Audiencia: ${sanitizedBlueprint.audience.join(', ')}`,
      `Confianza: ${sanitizedBlueprint.confidence}% (${sanitizedBlueprint.confidenceLevel})`,
    ].filter(Boolean).join('\n'),
    requirements: [
      'Confirmado por la idea original',
      ...sanitizedBlueprint.confirmedRequirements.map((item) => `Confirmado: ${item}`),
      ...sanitizedBlueprint.integrations.map((item) => `Integracion confirmada: ${item}`),
      ...sanitizedBlueprint.visualDesign.map((item) => `Diseno confirmado: ${item}`),
      ...sanitizedBlueprint.monetization.map((item) => `Monetizacion confirmada: ${item}`),
      'Inferencia razonable',
      ...sanitizedBlueprint.inferredRequirements.map((item) => `Inferido: ${item}`),
      ...sanitizedBlueprint.screens.map((item) => `Pantalla inferida: ${item}`),
      ...sanitizedBlueprint.entities.map((item) => `Entidad inferida: ${item}`),
      ...sanitizedBlueprint.roles.map((item) => `Rol inferido: ${item}`),
      'Sugerencia opcional',
      ...sanitizedBlueprint.suggestedRequirements.map((item) => `Sugerido: ${item}`),
      ...sanitizedBlueprint.suggestedIntegrations.map((item) => `Integracion sugerida: ${item}`),
      ...sanitizedBlueprint.suggestedVisualDesign.map((item) => `Diseno sugerido: ${item}`),
      ...sanitizedBlueprint.nonFunctionalRequirements.map((item) => `No funcional: ${item}`),
    ],
    entities: sanitizedBlueprint.entities,
    constraints: [
      'No inventes requisitos.',
      'Separa hechos confirmados, inferencias y sugerencias.',
      'Si algo es critico y no esta definido, indicalo.',
      'No escribas codigo final salvo pseudocodigo o estructura de archivos si ayuda.',
    ],
    questions: sanitizedBlueprint.pendingQuestions,
    outputFormat: buildOutputFormat(sanitizedBlueprint),
    targetModel: selectTargetModel(sanitizedBlueprint),
  }
}

export function renderFinalPromptFromBlueprint(
  blueprint: StructuredProjectBlueprint,
  promptBlueprint: PromptBlueprint
): string {
  const sanitizedBlueprint = sanitizeFinalPromptBlueprint(blueprint)
  const filteredQuestions = filterPromptQuestions(sanitizedBlueprint, promptBlueprint.questions)
  const confirmed = sanitizeConfirmedLines([
    `Idea base: ${sanitizedBlueprint.baseIdea ?? sanitizedBlueprint.originalIdea}`,
    sanitizedBlueprint.subtype && sanitizedBlueprint.subtype !== 'generic' ? `Categoria visible: ${sanitizedBlueprint.subtype}` : `Categoria visible: ${sanitizedBlueprint.category}`,
    sanitizedBlueprint.businessModel ? `Modelo de negocio: ${sanitizedBlueprint.businessModel}` : '',
    `Objetivo confirmado: ${sanitizedBlueprint.objective}`,
    sanitizedBlueprint.audience.length > 0
      ? `Audiencia confirmada: ${humanizeAudienceItems(sanitizedBlueprint.audience).join(', ')}`
      : '',
    ...(sanitizedBlueprint.incorporatedDiscoveryAnswers ?? []),
    ...sanitizedBlueprint.confirmedRequirements.map((item) => `Requisito confirmado: ${item}`),
    ...sanitizedBlueprint.integrations.map((item) => `Integracion confirmada: ${item}`),
    ...sanitizedBlueprint.visualDesign.map((item) => `Diseno confirmado: ${item}`),
    ...sanitizedBlueprint.monetization.map((item) => `Monetizacion confirmada: ${item}`),
    // deslugify constraints so "checkout-online-pospuesto-a-fase-2" → "Checkout online pospuesto a fase 2"
    // (dedup key normalization in uniquePromptItems merges this with the humanized discovery answer)
    ...sanitizedBlueprint.constraints.map((item) => `Restriccion confirmada: ${deslugify(item)}`),
  ].filter(Boolean))

  const inferred = [
    ...sanitizedBlueprint.inferredRequirements.map((item) => `Requisito inferido: ${item}`),
    ...sanitizedBlueprint.screens.map((item) => `Pantalla inferida: ${item}`),
    ...sanitizedBlueprint.entities.map((item) => `Entidad inferida: ${item}`),
    ...sanitizedBlueprint.roles.map((item) => `Rol inferido: ${item}`),
  ]

  const suggested = [
    ...sanitizedBlueprint.suggestedRequirements.map((item) => `Requisito sugerido: ${item}`),
    ...sanitizedBlueprint.suggestedIntegrations
      .filter((item) => !['payment-gateway', 'pasarela-de-pago', 'pasarela de pago'].includes(normalize(item)))
      .map((item) => `Integracion sugerida: ${item}`),
    ...sanitizedBlueprint.suggestedVisualDesign.map((item) => `Diseno sugerido: ${item}`),
  ]

  const businessContext = [
    sanitizedBlueprint.subtype && sanitizedBlueprint.subtype !== 'generic' ? `Categoria visible: ${sanitizedBlueprint.subtype}` : `Categoria visible: ${sanitizedBlueprint.category}`,
    sanitizedBlueprint.businessModel ? `Modelo de negocio: ${sanitizedBlueprint.businessModel}` : '',
    sanitizedBlueprint.subtypeReasoning ? `Razon de dominio: ${sanitizedBlueprint.subtypeReasoning}` : '',
    ...(sanitizedBlueprint.subtypeSignals ?? []).map((item) => `Senal usada: ${item}`),
  ]

  const futureScope = uniquePromptItems(sanitizedBlueprint.futureScope)
  const confirmedBlock = formatPromptList(confirmed)
  const criticalQuestions = filteredQuestions
    .filter((item) => item.severity === 'critical')
    .map((item) => `${item.question} (${item.reason})`)
  const importantQuestions = filteredQuestions
    .filter((item) => item.severity === 'important')
    .map((item) => `${item.question} (${item.reason})`)
  const optionalQuestions = filteredQuestions
    .filter((item) => item.severity === 'optional')
    .map((item) => `${item.question} (${item.reason})`)
  const pendingQuestionsBlock = criticalQuestions.length === 0 && importantQuestions.length === 0
    ? '- No hay preguntas críticas o recomendables pendientes.'
    : [
        'Informacion critica:',
        formatPromptList(criticalQuestions),
        '',
        'Informacion recomendable:',
        formatPromptList(importantQuestions),
        optionalQuestions.length > 0 ? `\nInformacion opcional:\n${formatPromptList(optionalQuestions)}` : '',
      ].filter(Boolean).join('\n')

  if (/<confirmado>/.test(confirmedBlock) || /- pasarela-de-pago/i.test(confirmedBlock)) {
    throw new Error('El bloque <confirmado> contiene elementos prohibidos o estructura invalida.')
  }

  return `<rol>
${promptBlueprint.role}
</rol>

<tarea>
${promptBlueprint.task}
</tarea>

<confirmado>
${confirmedBlock}
</confirmado>

<inferido>
${formatPromptList(inferred)}
</inferido>

<sugerido>
${formatPromptList(suggested)}
</sugerido>

<contexto_negocio>
${formatPromptList(businessContext)}
</contexto_negocio>

<alcance_mvp>
${formatPromptList(sanitizedBlueprint.mvpScope)}
</alcance_mvp>

<fase_futura>
${formatPromptList(futureScope)}
</fase_futura>

<requisitos_no_funcionales>
${formatPromptList(sanitizedBlueprint.nonFunctionalRequirements)}
</requisitos_no_funcionales>

<riesgos_tecnicos>
${formatPromptList(sanitizedBlueprint.implementationRisks)}
</riesgos_tecnicos>

<integraciones_capacidades>
${formatIntegrationCapabilities(sanitizedBlueprint.integrationCapabilities)}
</integraciones_capacidades>

<metricas_exito>
${formatPromptList(sanitizedBlueprint.successMetrics)}
</metricas_exito>

<preguntas_pendientes>
${pendingQuestionsBlock}
</preguntas_pendientes>

<restricciones>
${formatPromptList(promptBlueprint.constraints)}
</restricciones>

<formato_salida>
${promptBlueprint.outputFormat}
</formato_salida>`
}

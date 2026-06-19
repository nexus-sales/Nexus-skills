import type {
  IntegrationCapability,
  StructuredProjectBlueprint,
  StructuredProjectCategory,
} from '@/types/project-blueprint'

export interface DomainRefinementResult {
  category: StructuredProjectCategory
  subtype: string
  confidence: number
  reasoning: string
  signals: string[]
  businessModel?: string
  mvpScope: string[]
  futureScope: string[]
  nonFunctionalRequirements: string[]
  implementationRisks: string[]
  integrationCapabilities: IntegrationCapability[]
  successMetrics: string[]
}

interface SubtypeRule {
  subtype: string
  signals: Array<{ label: string; keywords: string[] }>
  reasoning: string
  businessModel?: string
  mvpScope?: string[]
  futureScope?: string[]
  nonFunctionalRequirements?: string[]
  implementationRisks?: string[]
  successMetrics?: string[]
}

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function evidenceText(blueprint: StructuredProjectBlueprint): string {
  return normalize([
    blueprint.originalIdea,
    blueprint.baseIdea,
    ...blueprint.confirmedRequirements,
    ...blueprint.integrations,
    ...blueprint.monetization,
    ...blueprint.constraints,
    ...(blueprint.incorporatedDiscoveryAnswers ?? []),
  ].filter(Boolean).join(' '))
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)))
}

function mergeCapabilities(items: IntegrationCapability[]): IntegrationCapability[] {
  const merged = new Map<string, IntegrationCapability>()

  for (const item of items) {
    const current = merged.get(item.name)
    if (!current) {
      merged.set(item.name, {
        name: item.name,
        capabilities: unique(item.capabilities),
        risk: item.risk,
      })
      continue
    }

    merged.set(item.name, {
      name: item.name,
      capabilities: unique([...current.capabilities, ...item.capabilities]),
      risk: current.risk.length >= item.risk.length ? current.risk : item.risk,
    })
  }

  return Array.from(merged.values())
}

function artisanCatalogCapabilities(blueprint: StructuredProjectBlueprint): IntegrationCapability[] {
  const text = evidenceText(blueprint)
  const capabilities: IntegrationCapability[] = []

  if (/instagram/.test(text)) {
    capabilities.push({
      name: 'Instagram',
      capabilities: unique([
        'profile-link',
        /importacion|importar|content-import|instagram-enlace-e-importacion/.test(text) ? 'content-import' : 'manual-reference',
      ]),
      risk: 'La importacion automatica puede depender de API oficial, permisos, tokens y limites.',
    })
  }

  if (/whatsapp/.test(text)) {
    capabilities.push({
      name: 'WhatsApp',
      capabilities: ['contact-button'],
      risk: 'Usar enlace wa.me en fase 1. WhatsApp Business API solo si se automatizan mensajes.',
    })
  }

  return capabilities
}

function matchedSignals(text: string, rule: SubtypeRule): string[] {
  return rule.signals
    .filter((signal) => signal.keywords.some((keyword) => text.includes(normalize(keyword))))
    .map((signal) => signal.label)
}

const RULES: Record<StructuredProjectCategory, SubtypeRule[]> = {
  marketplace: [
    {
      subtype: 'artisan-catalog',
      reasoning: 'Catalogo artesanal de un creador con venta local o contacto directo.',
      businessModel: 'single-creator-local-sales',
      signals: [
        { label: 'handmade products', keywords: ['manualidades', 'artesanal', 'artesania', 'handmade', 'creaciones', 'materiales'] },
        { label: 'single creator', keywords: ['mis creaciones', 'creador', 'creadora', 'producto propio', 'single-creator'] },
        { label: 'local sales', keywords: ['venta-local', 'compra local', 'solo local', 'contacto local'] },
        { label: 'no checkout', keywords: ['checkout-online-pospuesto-a-fase-2', 'sin checkout', 'sin compra online'] },
      ],
      mvpScope: [
        'Home',
        'catalogo',
        'ficha de producto',
        'panel admin de productos',
        'comentarios con moderacion',
        'descuentos estacionales/manuales',
        'WhatsApp como contacto',
        'Instagram como enlace o importacion manual',
        'i18n ES/EN/FR',
      ],
      futureScope: [
        'checkout online',
        'pasarela de pago',
        'pedidos',
        'usuarios clientes',
        'stock avanzado',
        'importacion automatica desde Instagram API',
      ],
      nonFunctionalRequirements: [
        'responsive/mobile-first',
        'SEO basico para productos',
        'performance en imagenes',
        'accesibilidad basica',
        'i18n ES/EN/FR',
        'estructura preparada para traducciones de contenido dinamico',
      ],
      implementationRisks: [
        'La importacion automatica desde Instagram puede requerir API oficial y permisos adicionales.',
        'El catalogo multilenguaje necesita estructura de traducciones para contenido dinamico.',
        'El rendimiento depende de compresion, formatos y carga diferida de imagenes.',
      ],
      successMetrics: [
        'clics en WhatsApp',
        'visitas a ficha de producto',
        'productos publicados',
        'contactos generados',
        'tiempo de carga de imagenes',
      ],
    },
    {
      subtype: 'single-vendor-store',
      reasoning: 'Tienda de un solo vendedor con catalogo propio.',
      businessModel: 'single-vendor-sales',
      signals: [
        { label: 'single vendor', keywords: ['tienda propia', 'producto propio', 'single vendor'] },
      ],
    },
    {
      subtype: 'local-commerce',
      reasoning: 'Comercio local con contacto o venta cercana.',
      businessModel: 'local-sales',
      signals: [
        { label: 'local commerce', keywords: ['negocio local', 'tienda local', 'local'] },
        { label: 'local sales', keywords: ['venta-local', 'compra local'] },
      ],
    },
    {
      subtype: 'multivendor-marketplace',
      reasoning: 'Marketplace con multiples vendedores y catalogo compartido.',
      businessModel: 'multivendor-commission',
      signals: [
        { label: 'multiple sellers', keywords: ['multivendor', 'varios vendedores', 'multiples vendedores', 'vendedores', 'sellers'] },
      ],
    },
    {
      subtype: 'ecommerce',
      reasoning: 'Venta online con checkout o pagos activos.',
      businessModel: 'online-direct-sales',
      signals: [
        { label: 'checkout', keywords: ['checkout', 'carrito', 'compra online', 'pedido online'] },
        { label: 'payments', keywords: ['payment-gateway', 'pasarela de pago', 'stripe', 'paypal'] },
      ],
    },
  ],
  'booking-system': [
    {
      subtype: 'salon-booking',
      reasoning: 'Reservas para peluqueria, salon o belleza.',
      signals: [{ label: 'salon service', keywords: ['peluqueria', 'salon', 'belleza', 'corte', 'barberia'] }],
    },
    {
      subtype: 'clinic-booking',
      reasoning: 'Reservas para clinica o consulta sanitaria.',
      signals: [{ label: 'clinic service', keywords: ['clinica', 'consulta', 'medico', 'salud', 'paciente'] }],
    },
    {
      subtype: 'veterinary-booking',
      reasoning: 'Reservas para veterinario o mascotas.',
      signals: [{ label: 'veterinary service', keywords: ['veterinario', 'veterinaria', 'mascota', 'animal'] }],
    },
    {
      subtype: 'restaurant-booking',
      reasoning: 'Reservas para restaurante o mesas.',
      signals: [{ label: 'restaurant service', keywords: ['restaurante', 'mesa', 'comensales', 'reserva de mesa'] }],
    },
  ],
  'course-platform': [
    {
      subtype: 'online-academy',
      reasoning: 'Academia online con cursos y alumnos.',
      signals: [{ label: 'academy', keywords: ['academia', 'cursos online', 'alumnos', 'instructor'] }],
    },
    {
      subtype: 'certification-platform',
      reasoning: 'Plataforma orientada a certificados y evaluacion.',
      signals: [{ label: 'certification', keywords: ['certificado', 'certificacion', 'evaluacion', 'examen'] }],
    },
    {
      subtype: 'internal-training',
      reasoning: 'Formacion interna para equipos o empleados.',
      signals: [{ label: 'internal training', keywords: ['formacion interna', 'empleados', 'equipo interno', 'onboarding'] }],
    },
  ],
  'landing-page': [
    {
      subtype: 'lead-generation',
      reasoning: 'Landing orientada a captacion de leads.',
      signals: [{ label: 'lead capture', keywords: ['captar leads', 'lead', 'formulario', 'presupuesto'] }],
    },
    {
      subtype: 'local-service-leads',
      reasoning: 'Landing de negocio o servicio local con objetivo de contactos.',
      signals: [{ label: 'local service', keywords: ['reformas', 'servicio local', 'negocio local', 'peluqueria', 'clinica'] }],
    },
    {
      subtype: 'product-launch',
      reasoning: 'Pagina para lanzamiento de producto.',
      signals: [{ label: 'product launch', keywords: ['lanzamiento', 'nuevo producto', 'preventa', 'beta'] }],
    },
  ],
  'support-system': [
    {
      subtype: 'incident-management',
      reasoning: 'Gestion de incidencias y escalado.',
      signals: [{ label: 'incident management', keywords: ['incidencia', 'incidencias', 'sla', 'escalado', 'prioridad'] }],
    },
    {
      subtype: 'internal-helpdesk',
      reasoning: 'Mesa de ayuda interna.',
      signals: [{ label: 'internal helpdesk', keywords: ['interno', 'empleados', 'helpdesk interno', 'it'] }],
    },
    {
      subtype: 'customer-support',
      reasoning: 'Soporte a clientes externos.',
      signals: [{ label: 'customer support', keywords: ['cliente', 'clientes', 'soporte al cliente', 'atencion al cliente'] }],
    },
  ],
  crm: [],
  'content-system': [],
  custom: [],
}

function defaultReadiness(blueprint: StructuredProjectBlueprint): Omit<DomainRefinementResult, 'category' | 'subtype' | 'confidence' | 'reasoning' | 'signals'> {
  return {
    businessModel: undefined,
    mvpScope: [],
    futureScope: [],
    nonFunctionalRequirements: [],
    implementationRisks: [],
    integrationCapabilities: mergeCapabilities(artisanCatalogCapabilities(blueprint)),
    successMetrics: [],
  }
}

export function refineProjectDomain(blueprint: StructuredProjectBlueprint): DomainRefinementResult {
  const rules = RULES[blueprint.category]
  const text = evidenceText(blueprint)
  const matches = rules
    .map((rule) => {
      const signals = matchedSignals(text, rule)
      return { rule, signals, score: signals.length }
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)

  const readiness = defaultReadiness(blueprint)
  const best = matches[0]

  if (!best) {
    return {
      category: blueprint.category,
      subtype: 'generic',
      confidence: 0,
      reasoning: 'No hay senales confirmadas suficientes para refinar el dominio.',
      signals: [],
      ...readiness,
    }
  }

  const confidence = Math.min(100, 45 + best.score * 18)
  const subtype = confidence >= 60 ? best.rule.subtype : 'generic'

  return {
    category: blueprint.category,
    subtype,
    confidence,
    reasoning: confidence >= 60
      ? best.rule.reasoning
      : 'Las senales detectadas no alcanzan confianza minima para subtipo.',
    signals: best.signals,
    businessModel: best.rule.businessModel,
    mvpScope: unique(best.rule.mvpScope ?? []),
    futureScope: unique(best.rule.futureScope ?? []),
    nonFunctionalRequirements: unique(best.rule.nonFunctionalRequirements ?? []),
    implementationRisks: unique([
      ...(best.rule.implementationRisks ?? []),
      ...artisanCatalogCapabilities(blueprint).map((capability) => capability.risk),
    ]),
    integrationCapabilities: mergeCapabilities(artisanCatalogCapabilities(blueprint)),
    successMetrics: unique(best.rule.successMetrics ?? []),
  }
}

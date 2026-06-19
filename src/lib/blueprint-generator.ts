import { detectProjectType, type ProjectCategory } from '@/lib/project-detector'
import {
  extractBookingRequirements,
  extractCoursePlatformRequirements,
  extractHelpdeskRequirements,
  extractLandingRequirements,
  extractMarketplaceRequirements,
  type SpecializedProjectRequirements,
} from '@/lib/project-extractors'
import type { ProjectBlueprint } from '@/types/blueprint'

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function unique(items: Array<string | false | undefined>): string[] {
  return Array.from(new Set(items.filter((item): item is string => Boolean(item))))
}

function hasAny(idea: string, keywords: string[]): boolean {
  const text = normalize(idea)
  return keywords.some((keyword) => text.includes(normalize(keyword)))
}

function createBlueprintId(idea: string): string {
  const slug = normalize(idea)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'project'

  return `blueprint_${slug}_${Date.now().toString(36)}`
}

function getSpecializedRequirements(category: ProjectCategory, idea: string): SpecializedProjectRequirements | null {
  switch (category) {
    case 'landing-page':
      return extractLandingRequirements(idea)
    case 'marketplace':
    case 'ecommerce':
      return extractMarketplaceRequirements(idea)
    case 'booking-system':
      return extractBookingRequirements(idea)
    case 'helpdesk':
      return extractHelpdeskRequirements(idea)
    case 'course-platform':
      return extractCoursePlatformRequirements(idea)
    default:
      return null
  }
}

function inferObjective(idea: string, category: ProjectCategory, projectType: string): string {
  const text = normalize(idea)

  if (category === 'booking-system') return 'Permitir que clientes reserven citas y reciban recordatorios'
  if (category === 'landing-page') return 'Captar leads cualificados y convertir visitantes en contactos'
  if (category === 'course-platform') return 'Publicar cursos online y gestionar el aprendizaje de alumnos'
  if (category === 'helpdesk') return 'Gestionar incidencias de clientes con seguimiento y prioridad'
  if (category === 'marketplace' && /(manualidad|manualidades|artesania|artesanal)/i.test(text)) {
    return 'Exponer y vender creaciones artesanales'
  }
  if (category === 'marketplace') return 'Mostrar oferta comercial y facilitar la relacion entre compradores y vendedores'
  if (category === 'ecommerce') return 'Vender productos online con gestion de catalogo y pedidos'

  return `Definir y construir ${projectType}`
}

function inferAudience(category: ProjectCategory): string {
  const audiences: Partial<Record<ProjectCategory, string>> = {
    'booking-system': 'Clientes que necesitan reservar y equipo que gestiona la agenda',
    'landing-page': 'Visitantes interesados y equipo comercial',
    marketplace: 'Clientes, compradores y administradores del catalogo',
    ecommerce: 'Clientes online y responsables de tienda',
    helpdesk: 'Clientes con incidencias y equipo de soporte',
    'course-platform': 'Alumnos, instructores y administradores',
    crm: 'Equipo comercial',
    'internal-tool': 'Usuarios internos y responsables operativos',
    portfolio: 'Clientes potenciales, reclutadores o visitantes profesionales',
    'content-site': 'Lectores y equipo editorial',
    'mobile-app': 'Usuarios moviles',
    saas: 'Usuarios de producto y administradores de cuenta',
    community: 'Miembros de la comunidad y moderadores',
  }

  return audiences[category] ?? 'Usuarios objetivo del proyecto'
}

function extractVisualDesign(idea: string): string[] {
  const text = normalize(idea)

  return unique([
    /apple|ios|mac/.test(text) && 'Apple style',
    /moderno|actual|clean/.test(text) && 'Moderno',
    /minimalista|simple|limpio/.test(text) && 'Minimalista',
    /estacional|temporada|navidad|verano|primavera|otono/.test(text) && 'Estacional',
    /responsive|movil|mobile/.test(text) && 'Responsive',
  ])
}

function suggestedVisualDesignForCategory(category: ProjectCategory): string[] {
  if (category === 'landing-page') return ['Claro y orientado a conversion']
  if (category === 'marketplace' || category === 'ecommerce') return ['Visual, confiable y facil de explorar']
  if (category === 'booking-system') return ['Simple, rapido y mobile-first']
  if (category === 'course-platform') return ['Ordenado y enfocado en aprendizaje']
  if (category === 'helpdesk') return ['Operativo, claro y orientado a seguimiento']
  return []
}

function extractLanguages(idea: string): string[] {
  const text = normalize(idea)

  return unique([
    /(espanol|castellano)/.test(text) && 'ES',
    /(ingles|english)/.test(text) && 'EN',
    /(frances|french)/.test(text) && 'FR',
    /(aleman|german)/.test(text) && 'DE',
    /\bES\b/.test(idea) && 'ES',
    /\bEN\b/.test(idea) && 'EN',
    /\bFR\b/.test(idea) && 'FR',
    /\bDE\b/.test(idea) && 'DE',
  ])
}

function extractIntegrations(idea: string): string[] {
  const text = normalize(idea)

  return unique([
    /(whats\s?app|whatsapp|whatssapp|wasap)/.test(text) && 'WhatsApp',
    /instagram/.test(text) && 'Instagram',
    /(redes sociales|social media|social networks|rrss)/.test(text) && 'Redes sociales',
    /stripe/.test(text) && 'Stripe',
    /paypal/.test(text) && 'PayPal',
    /(email|correo)/.test(text) && 'Email',
    /google calendar/.test(text) && 'Google Calendar',
  ])
}

function suggestedIntegrationsForCategory(category: ProjectCategory): string[] {
  const suggestions: Partial<Record<ProjectCategory, string[]>> = {
    'booking-system': ['Google Calendar', 'Email'],
    'landing-page': ['Analytics', 'CRM', 'Email'],
    'course-platform': ['Video hosting', 'Pasarela de pago', 'Email'],
    helpdesk: ['Email', 'Base de conocimiento'],
    marketplace: ['Email'],
    ecommerce: ['Pasarela de pago', 'Email'],
  }

  return suggestions[category] ?? []
}

function extractMonetization(idea: string): string[] {
  const text = normalize(idea)

  return unique([
    /(vender|venta|comprar|tienda|precio|precios)/.test(text) && 'Venta directa',
    /(descuento|descuentos|oferta|promocion)/.test(text) && 'Descuentos y promociones',
    /(suscripcion|membresia|planes)/.test(text) && 'Suscripcion',
    /(gratis|gratuito)/.test(text) && 'Acceso gratuito',
  ])
}

function inferredMonetizationForCategory(category: ProjectCategory): string[] {
  if (category === 'marketplace' || category === 'ecommerce') return ['Modelo comercial pendiente: catalogo, compra online o contacto']
  return []
}

function suggestedMonetizationForCategory(category: ProjectCategory): string[] {
  if (category === 'course-platform') return ['Pago unico, suscripcion o acceso gratuito pendiente de definir']
  if (category === 'saas') return ['Planes o suscripcion pendiente de definir']
  return []
}

function extractConfirmedFeatures(idea: string, category: ProjectCategory): string[] {
  return unique([
    hasAny(idea, ['cita', 'citas', 'reserva', 'reservas', 'booking']) && 'Citas o reservas',
    hasAny(idea, ['peluqueria', 'barberia', 'salon']) && 'Peluqueria',
    hasAny(idea, ['recordatorio', 'recordatorios']) && 'Recordatorios',
    hasAny(idea, ['landing', 'landing page', 'pagina de aterrizaje']) && 'Landing page',
    hasAny(idea, ['captar leads', 'captacion de leads', 'lead', 'leads']) && 'Captacion de leads',
    hasAny(idea, ['reforma', 'reformas']) && 'Reformas',
    hasAny(idea, ['curso', 'cursos online', 'plataforma de cursos']) && 'Cursos online',
    hasAny(idea, ['manualidad', 'manualidades', 'artesania', 'artesanal']) && 'Catalogo artesanal',
    hasAny(idea, ['incidencia', 'incidencias', 'ticket', 'tickets']) && 'Gestion de incidencias',
    category === 'unknown' && idea.trim(),
  ])
}

function filterInferredFeatures(features: string[], confirmedFeatures: string[]): string[] {
  const confirmedText = normalize(confirmedFeatures.join(' '))
  return features.filter((feature) => !confirmedText.includes(normalize(feature)))
}

function extractConstraints(idea: string): string[] {
  const text = normalize(idea)
  const noMatches = Array.from(idea.matchAll(/\bno\s+([^.,;]+)/gi)).map((match) => `No ${match[1].trim()}`)
  const sinMatches = Array.from(idea.matchAll(/\bsin\s+([^.,;]+)/gi)).map((match) => `Sin ${match[1].trim()}`)

  return unique([
    /rapido|urgente/.test(text) && 'Priorizar entrega rapida',
    /barato|economico|sin coste/.test(text) && 'Mantener coste bajo',
    /privacidad|rgpd|datos personales/.test(text) && 'Cuidar privacidad y datos personales',
    ...noMatches,
    ...sinMatches,
    'No inventar requisitos no mencionados',
  ])
}

function fallbackFeatures(category: ProjectCategory): string[] {
  const features: Partial<Record<ProjectCategory, string[]>> = {
    portfolio: ['Presentacion profesional', 'Galeria de trabajos', 'Formulario de contacto'],
    'content-site': ['Listado de contenidos', 'Categorias', 'Detalle de publicacion'],
    'mobile-app': ['Experiencia responsive', 'Flujo principal movil', 'Notificaciones si aplica'],
    saas: ['Onboarding', 'Panel de usuario', 'Gestion de cuenta'],
    community: ['Perfiles de usuario', 'Publicaciones', 'Moderacion'],
    crm: ['Gestion de leads', 'Pipeline comercial', 'Recordatorios'],
    'internal-tool': ['Dashboard operativo', 'Gestion de datos', 'Roles internos'],
  }

  return features[category] ?? ['Definir funcionalidades principales del proyecto']
}

export function generateProjectBlueprint(idea: string): ProjectBlueprint {
  const cleanIdea = idea.trim()
  if (!cleanIdea) throw new Error('La idea no puede estar vacia')

  const detection = detectProjectType(cleanIdea)
  const specialized = getSpecializedRequirements(detection.category, cleanIdea)
  const explicitIntegrations = extractIntegrations(cleanIdea)
  const confirmedFeatures = extractConfirmedFeatures(cleanIdea, detection.category)
  const verticalFeatures = specialized?.functionalities ?? fallbackFeatures(detection.category)
  const inferredFeatures = filterInferredFeatures(verticalFeatures, confirmedFeatures)
  const confirmedVisualDesign = extractVisualDesign(cleanIdea)
  const suggestedVisualDesign = confirmedVisualDesign.length === 0 ? suggestedVisualDesignForCategory(detection.category) : []
  const confirmedMonetization = extractMonetization(cleanIdea)
  const inferredMonetization = confirmedMonetization.length === 0 ? inferredMonetizationForCategory(detection.category) : []
  const suggestedMonetization = confirmedMonetization.length === 0 ? suggestedMonetizationForCategory(detection.category) : []
  const suggestedIntegrations = suggestedIntegrationsForCategory(detection.category).filter((integration) => !explicitIntegrations.includes(integration))

  return {
    id: createBlueprintId(cleanIdea),
    originalIdea: cleanIdea,
    projectType: detection.type,
    category: detection.category,
    confidence: detection.confidence,
    objective: inferObjective(cleanIdea, detection.category, detection.type),
    audience: inferAudience(detection.category),
    features: unique([...confirmedFeatures, ...inferredFeatures]),
    confirmedFeatures,
    inferredFeatures,
    entities: specialized?.entities ?? [],
    roles: specialized?.roles ?? [],
    integrations: explicitIntegrations,
    confirmedIntegrations: explicitIntegrations,
    suggestedIntegrations,
    visualDesign: unique([...confirmedVisualDesign, ...suggestedVisualDesign]),
    confirmedVisualDesign,
    suggestedVisualDesign,
    monetization: unique([...confirmedMonetization, ...inferredMonetization]),
    confirmedMonetization,
    inferredMonetization,
    suggestedMonetization,
    constraints: extractConstraints(cleanIdea),
    risks: specialized?.risks ?? ['Faltan detalles funcionales para cerrar alcance y prioridad'],
    questions: specialized?.pendingQuestions ?? ['Que alcance minimo debe tener la primera version?'],
    languages: extractLanguages(cleanIdea),
    createdAt: new Date().toISOString(),
  }
}

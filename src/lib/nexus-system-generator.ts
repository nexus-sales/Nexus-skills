import { PREDEFINED_AGENTS } from '@/constants/agents'
import { PREDEFINED_SKILLS } from '@/constants/skills'
import { TEMPLATES } from '@/constants/templates'
import { generateProjectBlueprint } from '@/lib/blueprint-generator'
import { generateDomainSkill } from '@/lib/domain-skill-generator'
import { generatePromptBlueprint, renderFinalPromptFromBlueprint } from '@/lib/prompt-blueprint-generator'
import { generateStructuredBlueprint } from '@/lib/structured-blueprint-generator'
import { detectProjectType, type ProjectCategory } from '@/lib/project-detector'
import {
  extractBookingRequirements,
  extractCoursePlatformRequirements,
  extractHelpdeskRequirements,
  extractLandingRequirements,
  extractMarketplaceRequirements,
  type SpecializedProjectRequirements,
} from '@/lib/project-extractors'
import { scorePrompt } from '@/lib/quality-scorer'
import { matchTemplate } from '@/lib/template-matcher'
import type {
  Agent,
  AutonomyLevel,
  PromptTemplate,
  Skill,
  TargetModel,
  TechniqueId,
  WorkflowStep,
} from '@/types/prompt'
import type { ProjectBlueprint } from '@/types/blueprint'
import type { StructuredProjectBlueprint } from '@/types/project-blueprint'
import type { AiClassification } from '@/types/ai-classification'
import type {
  NexusAgentDraft,
  NexusExpectedResult,
  NexusFinalSystem,
  NexusIdeaAnalysis,
  NexusRecommendedPrompt,
  NexusSkillDraft,
  NexusSystem,
  NexusSystemStage,
  NexusWorkflowDraft,
} from '@/types/nexus'
import type { NexusApiArtifacts } from '@/types/nexus-api'

// Motor local y determinista: no llama a proveedores LLM.
// En fases futuras puede delegar estas decisiones a OpenAI, Claude u otros sin cambiar NexusSystem.
const NEXUS_SYSTEM_VERSION = '1.0.0-local'

type NexusDomain =
  | 'ventas'
  | 'marketing'
  | 'software'
  | 'soporte'
  | 'legal'
  | 'educacion'
  | 'productividad'
  | 'documentacion'
  | 'general'

type NexusComplexity = 'baja' | 'media' | 'alta'

interface IdeaHeuristics {
  domain: NexusDomain
  complexity: NexusComplexity
  outputType: string
  targetModel: TargetModel
  techniques: TechniqueId[]
  templateId?: string
  matchedTemplate: PromptTemplate
  baseSkill: Skill
  baseAgent: Agent
}

const DOMAIN_KEYWORDS: Record<NexusDomain, string[]> = {
  ventas: ['venta', 'ventas', 'cliente potencial', 'lead', 'crm', 'comercial', 'propuesta', 'seguimiento'],
  marketing: ['marketing', 'campana', 'contenido', 'linkedin', 'email', 'copy', 'seo', 'conversion'],
  software: ['software', 'app', 'codigo', 'bug', 'api', 'react', 'next', 'typescript', 'supabase'],
  soporte: ['soporte', 'ticket', 'incidencia', 'ayuda', 'faq', 'atencion', 'reclamacion'],
  legal: ['legal', 'contrato', 'normativa', 'rgpd', 'nis2', 'compliance', 'privacidad'],
  educacion: ['educacion', 'curso', 'formacion', 'aprender', 'clase', 'leccion', 'alumno'],
  productividad: ['productividad', 'automatizar', 'automatizacion', 'tarea', 'proceso', 'operacion', 'workflow'],
  documentacion: ['documentacion', 'documentar', 'informe', 'reporte', 'manual', 'guia', 'procedimiento'],
  general: [],
}

const DEFAULT_TEMPLATE = TEMPLATES.automatizacion ?? TEMPLATES.analisis ?? TEMPLATES.conversion
const DEFAULT_SKILL = PREDEFINED_SKILLS[0]
const DEFAULT_AGENT = PREDEFINED_AGENTS[0]

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function hasWholeWord(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => {
    const normalizedKeyword = normalize(keyword)
    const escapedKeyword = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(^|[^a-z0-9])${escapedKeyword}([^a-z0-9]|$)`, 'i').test(text)
  })
}

function hasLanguageCode(text: string, code: string): boolean {
  const escapedCode = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^a-zA-Z])${escapedCode}([^a-zA-Z]|$)`).test(text)
}

function countMatches(text: string, keywords: string[]): number {
  const normalizedText = normalize(text)
  return keywords.filter((keyword) => normalizedText.includes(normalize(keyword))).length
}

function createId(idea: string): string {
  const slug = normalize(idea)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36) || 'idea'
  return `nexus_${slug}_${Date.now().toString(36)}`
}

function createTitle(idea: string, domain: string): string {
  const clean = idea.trim().replace(/\s+/g, ' ')
  const base = clean.length > 56 ? `${clean.slice(0, 53).trim()}...` : clean
  return domain === 'general' ? base : `${domain}: ${base}`
}

function detectDomain(idea: string): NexusDomain {
  let bestDomain: NexusDomain = 'general'
  let bestScore = 0

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS) as [NexusDomain, string[]][]) {
    if (domain === 'general') continue
    const score = countMatches(idea, keywords)
    if (score > bestScore) {
      bestDomain = domain
      bestScore = score
    }
  }

  return bestDomain
}

function detectComplexity(idea: string): NexusComplexity {
  const highSignals = ['integracion', 'api', 'base de datos', 'multiusuario', 'roles', 'seguridad', 'legal', 'sistema']
  const mediumSignals = ['automatizar', 'workflow', 'seguimiento', 'analizar', 'generar', 'clasificar', 'dashboard']
  const highCount = countMatches(idea, highSignals)
  const mediumCount = countMatches(idea, mediumSignals)

  if (highCount >= 2 || idea.length > 180) return 'alta'
  if (highCount === 1 || mediumCount >= 1 || idea.length > 80) return 'media'
  return 'baja'
}

function detectOutputType(idea: string, domain: NexusDomain): string {
  const text = normalize(idea)
  if (/(manualidad|artesania|artesanal|creaciones|hecho a mano)/i.test(text)) return 'blueprint de catalogo web artesanal con pantallas, entidades, contenido e integraciones'
  if (text.includes('email') || text.includes('correo')) return 'secuencia de mensajes lista para usar'
  if (text.includes('informe') || text.includes('reporte')) return 'informe estructurado con acciones priorizadas'
  if (text.includes('dashboard') || text.includes('panel')) return 'blueprint operativo con pantallas, datos y flujo'
  if (text.includes('document')) return 'documento reutilizable con secciones claras'
  if (domain === 'ventas') return 'sistema comercial con pasos, mensajes y criterios de seguimiento'
  if (domain === 'software') return 'blueprint tecnico con prompt, skill, workflow y agente'
  if (domain === 'soporte') return 'proceso de soporte con clasificacion, respuesta y escalado'
  return 'sistema de IA reutilizable con instrucciones, flujo y resultado esperado'
}

function suggestTargetModel(domain: NexusDomain, complexity: NexusComplexity): TargetModel {
  if (complexity === 'alta' || domain === 'software' || domain === 'legal') return 'claude'
  if (domain === 'marketing' || domain === 'ventas') return 'gpt4'
  return 'universal'
}

function suggestTechniques(domain: NexusDomain, complexity: NexusComplexity): TechniqueId[] {
  const techniques: TechniqueId[] = ['neg', 'crit']
  if (complexity !== 'baja') techniques.push('cot')
  if (domain === 'software' || domain === 'legal' || domain === 'documentacion') techniques.push('xml')
  if (domain === 'marketing' || domain === 'ventas') techniques.push('pre')
  return techniques
}

function selectTemplate(idea: string, domain: NexusDomain): { id?: string; template: PromptTemplate } {
  const match = matchTemplate(idea)
  if (match) return { id: match.id, template: match.template }

  const fallbackByDomain: Partial<Record<NexusDomain, string>> = {
    ventas: 'propuesta',
    marketing: 'linkedin',
    software: 'analisis',
    legal: 'nis2',
    educacion: 'educacion',
    productividad: 'automatizacion',
    documentacion: 'doc',
  }
  const fallbackId = fallbackByDomain[domain]
  const fallbackTemplate = fallbackId ? TEMPLATES[fallbackId] : undefined
  return { id: fallbackId, template: fallbackTemplate ?? DEFAULT_TEMPLATE }
}

function selectSkill(domain: NexusDomain): Skill {
  const wantedCategory: Skill['category'] = domain === 'productividad' ? 'workflow' : 'behavior'
  return PREDEFINED_SKILLS.find((skill) => skill.category === wantedCategory) ?? DEFAULT_SKILL
}

function selectAgent(domain: NexusDomain): Agent {
  if (domain === 'ventas' || domain === 'marketing') {
    return PREDEFINED_AGENTS.find((agent) => agent.id === 'agent_copywriter') ?? DEFAULT_AGENT
  }
  if (domain === 'software') {
    return PREDEFINED_AGENTS.find((agent) => agent.id === 'agent_dev_senior') ?? DEFAULT_AGENT
  }
  if (domain === 'legal') {
    return PREDEFINED_AGENTS.find((agent) => agent.id === 'agent_nis2') ?? DEFAULT_AGENT
  }
  return PREDEFINED_AGENTS.find((agent) => agent.id === 'agent_architect_ia') ?? DEFAULT_AGENT
}

function buildHeuristics(idea: string): IdeaHeuristics {
  const domain = detectDomain(idea)
  const complexity = detectComplexity(idea)
  const outputType = detectOutputType(idea, domain)
  const targetModel = suggestTargetModel(domain, complexity)
  const techniques = suggestTechniques(domain, complexity)
  const { id: templateId, template: matchedTemplate } = selectTemplate(idea, domain)

  return {
    domain,
    complexity,
    outputType,
    targetModel,
    techniques,
    templateId,
    matchedTemplate,
    baseSkill: selectSkill(domain),
    baseAgent: selectAgent(domain),
  }
}

function buildPromptTemplateDraft(
  idea: string,
  analysis: NexusIdeaAnalysis,
  heuristics: IdeaHeuristics
): PromptTemplate {
  const pendingQuestions = generatePendingQuestions(analysis, idea)
  const functionalityCriteria = [
    `Objetivo: ${analysis.objective}`,
    `Audiencia: ${analysis.audience}`,
    `Tipo de proyecto: ${analysis.projectType}`,
    analysis.features.length > 0 && `Funcionalidades:\n${analysis.features.join('\n')}`,
    analysis.entities.length > 0 && `Entidades:\n${analysis.entities.join('\n')}`,
    analysis.roles.length > 0 && `Roles:\n${analysis.roles.join('\n')}`,
    analysis.visualDesign.length > 0 && `Diseño visual:\n${analysis.visualDesign.join('\n')}`,
    analysis.languages.length > 0 && `Idiomas:\n${analysis.languages.join(', ')}`,
    analysis.monetization.length > 0 && `Monetización:\n${analysis.monetization.join('\n')}`,
    analysis.integrations.length > 0 && `Integraciones:\n${analysis.integrations.join('\n')}`,
    analysis.restrictions.length > 0 && `Restricciones:\n${analysis.restrictions.join('\n')}`,
    pendingQuestions.length > 0 && `Preguntas pendientes:\n${pendingQuestions.join('\n')}`,
    `Prioridad: ${analysis.priority}`,
  ].filter((item): item is string => Boolean(item))

  return {
    ...heuristics.matchedTemplate,
    name: `Nexus - ${analysis.projectType}`,
    rol: heuristics.baseAgent.role,
    tarea: `Diseña el sistema base para esta idea del usuario: ${idea}`,
    proyecto: analysis.projectType,
    stack: heuristics.domain === 'software' ? 'Next.js, React, TypeScript, Tailwind, Supabase' : '',
    destino: analysis.audience,
    restriccion: [
      'No inventes datos criticos. Distingue hechos, inferencias y suposiciones.',
      ...analysis.restrictions,
    ].join('\n'),
    outputType: heuristics.outputType,
    ext: heuristics.complexity === 'alta' ? 'respuesta detallada y completa' : 'respuesta media de entre 300 y 500 palabras',
    tono: 'profesional, claro y orientado a accion',
    criterios: functionalityCriteria.join('\n\n'),
    autonomia: heuristics.complexity === 'alta' ? 'si falta informacion critica, haz preguntas antes' : 'ejecuta directamente usando supuestos razonables y declaralos',
    fuentes: 'usa conocimiento general marcado claramente como inferencia cuando no venga de la idea original',
    cot: heuristics.techniques.includes('cot'),
    sc: heuristics.techniques.includes('sc'),
    xml: heuristics.techniques.includes('xml'),
    neg: heuristics.techniques.includes('neg'),
    ej: heuristics.techniques.includes('ej'),
    pre: heuristics.techniques.includes('pre'),
    int: false,
    crit: heuristics.techniques.includes('crit'),
    devil: false,
    matType: 'contexto',
    matFile: '',
    material: idea,
    evidenceMode: true,
    assumptionPolicy: 'distingue claramente hechos, inferencias y suposiciones',
    missingInfoPolicy: 'si falta informacion critica, pregunta antes de concluir o implementar',
    verificationDepth: 'validacion estricta: revisa requisitos, riesgos, contradicciones y datos no respaldados',
    antiHallucinationNotes: 'La idea original es la unica fuente confirmada en esta version local.',
    appGoal: analysis.objective,
    appType: analysis.projectType,
    promptPhase: 'fase 1: requisitos y arquitectura antes de implementar',
    appScreens: analysis.features.length > 0 ? analysis.features.join('\n') : 'Pantallas principales pendientes de definir segun la app del usuario',
    appData: [
      ...analysis.content,
      analysis.monetization.length > 0 && `Monetizacion: ${analysis.monetization.join(', ')}`,
      analysis.languages.length > 0 && `Idiomas: ${analysis.languages.join(', ')}`,
    ].filter((item): item is string => Boolean(item)).join('\n') || 'Contenido y entidades pendientes de definir',
    appIntegrations: analysis.integrations.length > 0 ? analysis.integrations.join('\n') : 'Sin integraciones externas en la version local',
    appPermissions: 'Definir si habra administrador, creador, cliente o usuario anonimo',
    appDesign: analysis.visualDesign.length > 0 ? analysis.visualDesign.join('\n') : 'Interfaz operativa, clara, enfocada en revisar y reutilizar artefactos',
    appAcceptance: functionalityCriteria.join('\n\n'),
  }
}

function formatPromptList(items: string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join('\n') : '- No especificado'
}

void buildPromptTemplateDraft
void formatPromptList

function firstMatchingLabel(idea: string, rules: Array<{ keywords: string[]; label: string }>, fallback: string): string {
  const normalizedIdea = normalize(idea)
  const match = rules.find((rule) => rule.keywords.some((keyword) => normalizedIdea.includes(normalize(keyword))))
  return match?.label ?? fallback
}

function matchingLabels(idea: string, rules: Array<{ keywords: string[]; label: string }>): string[] {
  const normalizedIdea = normalize(idea)
  return rules
    .filter((rule) => rule.keywords.some((keyword) => normalizedIdea.includes(normalize(keyword))))
    .map((rule) => rule.label)
}

function uniqueOrFallback(items: string[], fallback: string[]): string[] {
  const unique = Array.from(new Set(items))
  return unique.length > 0 ? unique : fallback
}

function uniqueItems(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)))
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

function hasDocumentationSignal(idea: string): boolean {
  const normalizedIdea = normalize(idea)
  return (
    hasWholeWord(normalizedIdea, ['documentacion', 'documentar', 'docs', 'doc', 'manual', 'guia']) ||
    /estructura documental|documental/i.test(normalizedIdea)
  )
}

function hasAnalysisFeature(analysis: NexusIdeaAnalysis, pattern: RegExp): boolean {
  return analysis.features.some((feature) => pattern.test(normalize(feature)))
}

function hasAnalysisIntegration(analysis: NexusIdeaAnalysis, pattern: RegExp): boolean {
  return analysis.integrations.some((integration) => pattern.test(normalize(integration)))
}

function isCommerceLikeProject(analysis: NexusIdeaAnalysis): boolean {
  return /(catalogo|marketplace|tienda|ecommerce|artesanal)/i.test(normalize(analysis.projectType))
}

function generatePendingQuestions(analysis: NexusIdeaAnalysis, idea: string): string[] {
  if (analysis.pendingQuestions.length > 0) return analysis.pendingQuestions

  const questions: string[] = []

  if (isCommerceLikeProject(analysis)) {
    if (!hasAnalysisFeature(analysis, /carrito|checkout|compra|pedido/)) {
      questions.push('La app tendra compra online o sera solo catalogo?')
    }

    if (!hasAnalysisFeature(analysis, /panel|dashboard|administracion/)) {
      questions.push('Habra panel de administracion para subir y editar creaciones?')
    }

    if (hasAnalysisFeature(analysis, /comentario|valoracion|resena/)) {
      questions.push('Los comentarios los escribira el creador o tambien los visitantes?')
    }

    if (hasAnalysisFeature(analysis, /descuento|promocion|oferta/)) {
      questions.push('Los descuentos por temporada se aplicaran automaticamente o manualmente?')
    }

    if (hasAnalysisIntegration(analysis, /instagram/)) {
      questions.push('Instagram sera solo un enlace externo o importara publicaciones y fotos?')
    }

    if (hasAnalysisIntegration(analysis, /whatsapp/)) {
      questions.push('WhatsApp se usara como contacto, boton de compra o soporte?')
    }

    if (!hasAnalysisFeature(analysis, /stock|inventario/)) {
      questions.push('Necesitas gestion de stock o unidades disponibles?')
    }

    return questions
  }

  if (analysis.monetization.includes('Pendiente de definir')) {
    questions.push('Como se monetizara o validara economicamente el proyecto?')
  }

  if (analysis.integrations.includes('Sin integraciones explicitas')) {
    questions.push('Necesita integraciones externas o canales concretos?')
  }

  if (analysis.restrictions.includes('No inventar requisitos no mencionados')) {
    questions.push('Hay restricciones de presupuesto, privacidad, plazos o tecnologia?')
  }

  if (!analysis.features.some((feature) => /compra|pedido|contacto|catalogo|dashboard|usuario/i.test(feature))) {
    questions.push('Que pantallas y flujo minimo debe tener la primera version?')
  }

  if (hasDocumentationSignal(idea) && !hasAnalysisFeature(analysis, /audiencia|seccion|version/)) {
    questions.push('Que estructura documental, secciones y responsables debe tener?')
  }

  return questions
}

function extractObjective(idea: string): string {
  const normalizedIdea = normalize(idea)

  if (/(manualidad|artesania|artesanal|creaciones|hecho a mano)/i.test(normalizedIdea)) {
    if (/(vender|venta|tienda|precio|catalogo|catalogo|marketplace)/i.test(normalizedIdea)) {
      return 'Exponer y vender creaciones artesanales'
    }
    return 'Mostrar creaciones artesanales y facilitar el contacto con clientes'
  }
  if (/(cliente potencial|lead|seguimiento comercial|crm|comercial)/i.test(normalizedIdea)) {
    return 'Automatizar el seguimiento de clientes potenciales'
  }
  if (/(documentacion|documentar|manual|guia tecnica)/i.test(normalizedIdea)) {
    return 'Crear y mantener documentacion tecnica reutilizable'
  }
  if (/(soporte|ticket|atencion al cliente|faq|incidencia)/i.test(normalizedIdea)) {
    return 'Ayudar a clientes y resolver solicitudes de soporte'
  }
  if (/(campana|marketing|redes sociales|contenido|linkedin|instagram)/i.test(normalizedIdea)) {
    return 'Planificar y generar campañas de marketing reutilizables'
  }

  return idea.replace(/^(quiero|necesito|me gustaria|busco)\s+/i, '').trim() || 'Convertir la idea en un sistema de IA reutilizable'
}

function extractAudience(idea: string): string {
  const normalizedIdea = normalize(idea)
  const paraMatch = idea.match(/\bpara\s+([^.,;]+)/i)
  if (paraMatch?.[1]) return paraMatch[1].trim()

  if (/(manualidad|artesania|artesanal|hecho a mano)/i.test(normalizedIdea)) return 'Clientes interesados en artesania'
  if (/(cliente potencial|lead|comercial|crm)/i.test(normalizedIdea)) return 'Equipo comercial y responsables de ventas'
  if (/(soporte|ticket|atencion al cliente|faq)/i.test(normalizedIdea)) return 'Clientes que necesitan ayuda y equipo de soporte'
  if (/(documentacion|manual|guia tecnica)/i.test(normalizedIdea)) return 'Equipo tecnico, usuarios internos y futuros mantenedores'
  if (/(marketing|redes sociales|campana|contenido)/i.test(normalizedIdea)) return 'Equipo de marketing y audiencia objetivo de la marca'

  return 'Usuarios que necesitan resolver este proceso de forma repetible'
}

function extractFeatures(idea: string): string[] {
  const labels = matchingLabels(idea, [
    { keywords: ['foto', 'imagen', 'galeria', 'portfolio'], label: 'Fotos o galeria visual' },
    { keywords: ['material', 'materiales', 'ingredientes'], label: 'Ficha de materiales o componentes' },
    { keywords: ['precio', 'precios', 'tarifa'], label: 'Precios visibles' },
    { keywords: ['comentario', 'comentarios', 'resena', 'valoracion'], label: 'Comentarios o valoraciones' },
    { keywords: ['descuento', 'oferta', 'cupon', 'promocion'], label: 'Descuentos y promociones' },
    { keywords: ['carrito', 'checkout', 'comprar', 'pedido'], label: 'Carrito o flujo de compra' },
    { keywords: ['catalogo', 'productos', 'creaciones'], label: 'Catalogo de productos o creaciones' },
    { keywords: ['stock', 'inventario'], label: 'Gestion de stock o inventario' },
    { keywords: ['cliente potencial', 'lead', 'crm', 'seguimiento'], label: 'Seguimiento de leads o clientes' },
    { keywords: ['email', 'correo', 'mensaje'], label: 'Mensajes o emails automatizados' },
    { keywords: ['ticket', 'soporte', 'faq'], label: 'Clasificacion y respuesta de soporte' },
    { keywords: ['documentacion', 'manual', 'guia'], label: 'Generacion de documentacion estructurada' },
    { keywords: ['dashboard', 'panel', 'metricas'], label: 'Panel de control y metricas' },
    { keywords: ['login', 'usuario', 'cuenta'], label: 'Cuentas de usuario' },
  ])
  const filteredLabels = hasDocumentationSignal(idea)
    ? labels
    : labels.filter((label) => label !== 'Generacion de documentacion estructurada')

  return uniqueOrFallback(filteredLabels, ['Captura de idea', 'Generacion de artefactos reutilizables', 'Exportacion del sistema'])
}

function extractVisualDesign(idea: string): string[] {
  const labels = matchingLabels(idea, [
    { keywords: ['apple', 'ios', 'mac'], label: 'Apple style' },
    { keywords: ['moderno', 'actual', 'clean'], label: 'Moderno' },
    { keywords: ['minimalista', 'simple', 'limpio'], label: 'Minimalista' },
    { keywords: ['estacional', 'temporada', 'navidad', 'verano', 'primavera', 'otono', 'otoño'], label: 'Estacional' },
    { keywords: ['elegante', 'premium', 'lujo'], label: 'Elegante' },
    { keywords: ['artesanal', 'manualidades', 'hecho a mano'], label: 'Calido y artesanal' },
    { keywords: ['mobile', 'movil', 'responsive'], label: 'Responsive y mobile-first' },
  ])

  return uniqueOrFallback(labels, ['Moderno', 'Claro', 'Responsive'])
}

function extractLanguages(idea: string): string[] {
  const normalizedIdea = normalize(idea)
  const explicitLabels = [
    (hasWholeWord(normalizedIdea, ['espanol', 'español', 'castellano']) || hasLanguageCode(idea, 'ES')) && 'ES',
    (hasWholeWord(normalizedIdea, ['ingles', 'inglés', 'english']) || hasLanguageCode(idea, 'EN')) && 'EN',
    (hasWholeWord(normalizedIdea, ['frances', 'francés', 'french']) || hasLanguageCode(idea, 'FR')) && 'FR',
    (hasWholeWord(normalizedIdea, ['aleman', 'alemán', 'german']) || hasLanguageCode(idea, 'DE')) && 'DE',
    (hasWholeWord(normalizedIdea, ['italiano', 'italian']) || hasLanguageCode(idea, 'IT')) && 'IT',
    (hasWholeWord(normalizedIdea, ['portugues', 'portugués', 'portuguese']) || hasLanguageCode(idea, 'PT')) && 'PT',
  ].filter((label): label is string => Boolean(label))

  if (/(multiidioma|multilingue|multilingüe|varios idiomas)/i.test(normalizedIdea) && explicitLabels.length === 0) {
    return ['ES', 'EN']
  }

  return uniqueOrFallback(explicitLabels, ['ES'])
}
/*
  const labels = matchingLabels(idea, [
    { keywords: ['espanol', 'español', 'castellano', 'es'], label: 'ES' },
    { keywords: ['ingles', 'inglés', 'english', 'en'], label: 'EN' },
    { keywords: ['frances', 'francés', 'french', 'fr'], label: 'FR' },
    { keywords: ['aleman', 'alemán', 'german', 'de'], label: 'DE' },
    { keywords: ['italiano', 'italian', 'it'], label: 'IT' },
    { keywords: ['portugues', 'portugués', 'portuguese', 'pt'], label: 'PT' },
  ])

  if (/(multiidioma|multilingue|multilingüe|varios idiomas)/i.test(normalize(idea)) && labels.length === 0) {
    return ['ES', 'EN']
  }

  return uniqueOrFallback(labels, ['ES'])
}

*/
function extractContent(idea: string): string[] {
  const labels = matchingLabels(idea, [
    { keywords: ['foto', 'imagen', 'galeria'], label: 'Imagenes del producto o servicio' },
    { keywords: ['material', 'materiales'], label: 'Materiales o detalles de fabricacion' },
    { keywords: ['precio', 'precios'], label: 'Precios y condiciones' },
    { keywords: ['descripcion', 'descripciones'], label: 'Descripciones de cada elemento' },
    { keywords: ['comentario', 'resena', 'valoracion'], label: 'Comentarios y testimonios' },
    { keywords: ['documentacion', 'manual', 'guia'], label: 'Documentacion organizada por secciones' },
    { keywords: ['post', 'redes', 'campana'], label: 'Piezas de contenido para canales sociales' },
  ])
  const filteredLabels = hasDocumentationSignal(idea)
    ? labels
    : labels.filter((label) => label !== 'Documentacion organizada por secciones')

  return uniqueOrFallback(filteredLabels, ['Idea original', 'Requisitos extraidos', 'Artefactos generados'])
}

function extractMonetization(idea: string): string[] {
  const labels = matchingLabels(idea, [
    { keywords: ['vender', 'venta', 'comprar', 'tienda'], label: 'Venta directa' },
    { keywords: ['precio', 'precios', 'tarifa'], label: 'Precios por producto o servicio' },
    { keywords: ['descuento', 'oferta', 'cupon'], label: 'Descuentos y promociones' },
    { keywords: ['suscripcion', 'membresia'], label: 'Suscripcion' },
    { keywords: ['comision', 'marketplace'], label: 'Comision por transaccion' },
    { keywords: ['donacion', 'propina'], label: 'Donaciones o aportaciones voluntarias' },
  ])

  return uniqueOrFallback(labels, ['Pendiente de definir'])
}

function extractIntegrations(idea: string): string[] {
  const normalizedIdea = normalize(idea)
  const explicitLabels = [
    /whats\s?app|whatsapp|whatssapp|wasap/i.test(normalizedIdea) && 'WhatsApp',
    /instagram/i.test(normalizedIdea) && 'Instagram',
    /(redes sociales|social media|social networks|rrss)/i.test(normalizedIdea) && 'Redes sociales',
  ].filter((label): label is string => Boolean(label))

  const labels = matchingLabels(idea, [
    { keywords: ['stripe'], label: 'Stripe' },
    { keywords: ['paypal'], label: 'PayPal' },
    { keywords: ['whatsapp'], label: 'WhatsApp' },
    { keywords: ['email', 'correo'], label: 'Email' },
    { keywords: ['instagram'], label: 'Instagram' },
    { keywords: ['redes sociales', 'social media', 'social networks', 'rrss'], label: 'Redes sociales' },
    { keywords: ['facebook'], label: 'Facebook' },
    { keywords: ['google maps', 'maps'], label: 'Google Maps' },
    { keywords: ['supabase'], label: 'Supabase' },
    { keywords: ['api'], label: 'API externa' },
  ])

  return uniqueOrFallback([...labels, ...explicitLabels], ['Sin integraciones explicitas'])
}

function extractRestrictions(idea: string): string[] {
  const labels = matchingLabels(idea, [
    { keywords: ['barato', 'economico', 'económico', 'sin coste'], label: 'Mantener coste bajo' },
    { keywords: ['rapido', 'rápido', 'urgente'], label: 'Priorizar entrega rapida' },
    { keywords: ['sin login', 'no login', 'sin registro'], label: 'Evitar login o registro' },
    { keywords: ['simple', 'sencillo'], label: 'Mantener una experiencia sencilla' },
    { keywords: ['privacidad', 'rgpd', 'datos personales'], label: 'Cuidar privacidad y datos personales' },
    { keywords: ['mobile', 'movil', 'responsive'], label: 'Debe funcionar bien en mobile' },
  ])
  const noMatches = Array.from(idea.matchAll(/\bno\s+([^.,;]+)/gi)).map((match) => `No ${match[1].trim()}`)
  const sinMatches = Array.from(idea.matchAll(/\bsin\s+([^.,;]+)/gi)).map((match) => `Sin ${match[1].trim()}`)

  return uniqueOrFallback([...labels, ...noMatches, ...sinMatches], ['No inventar requisitos no mencionados'])
}

function extractPriority(idea: string): string {
  const normalizedIdea = normalize(idea)
  if (/(urgente|cuanto antes|esta semana|lanzar|cliente real|venta|vender|pago|checkout)/i.test(normalizedIdea)) return 'Alta'
  if (/(app|sistema|automatizar|dashboard|marketplace|crm|soporte)/i.test(normalizedIdea)) return 'Media'
  return 'Baja'
}

function extractProjectType(idea: string): string {
  const detectedProject = detectProjectType(idea)
  if (detectedProject.category !== 'unknown') return detectedProject.type

  return firstMatchingLabel(idea, [
    { keywords: ['manualidad', 'manualidades', 'artesania', 'artesanal', 'hecho a mano'], label: 'Catalogo web artesanal / marketplace artesanal' },
    { keywords: ['cliente potencial', 'lead', 'crm', 'seguimiento comercial'], label: 'Sistema comercial de seguimiento' },
    { keywords: ['documentacion', 'manual', 'guia tecnica'], label: 'Sistema de documentacion tecnica' },
    { keywords: ['soporte', 'ticket', 'faq', 'atencion al cliente'], label: 'Asistente de soporte al cliente' },
    { keywords: ['marketing', 'campana', 'redes sociales', 'contenido'], label: 'Sistema de campañas de marketing' },
    { keywords: ['curso', 'formacion', 'alumno'], label: 'Plataforma educativa' },
    { keywords: ['dashboard', 'panel', 'metricas'], label: 'Dashboard operativo' },
    { keywords: ['tienda', 'ecommerce', 'checkout', 'carrito'], label: 'Tienda online' },
  ], 'Sistema de IA reutilizable')
}

function analysisFromBlueprint(blueprint: ProjectBlueprint): NexusIdeaAnalysis {
  const heuristics = buildHeuristics(blueprint.originalIdea)
  const content = uniqueItems([
    ...blueprint.entities.map((entity) => `Entidad: ${entity}`),
    ...blueprint.features.slice(0, 4),
  ])
  const priority = blueprint.risks.length > 2 ? 'Alta' : 'Media'

  return {
    summary: `Objetivo: ${blueprint.objective}. Audiencia: ${blueprint.audience}. Tipo: ${blueprint.projectType}. Categoria: ${blueprint.category}.`,
    domain: blueprint.projectType,
    objective: blueprint.objective,
    audience: blueprint.audience,
    features: blueprint.features,
    visualDesign: blueprint.visualDesign,
    languages: blueprint.languages,
    content,
    entities: blueprint.entities,
    roles: blueprint.roles,
    pendingQuestions: blueprint.questions,
    monetization: blueprint.monetization,
    integrations: blueprint.integrations.length > 0 ? blueprint.integrations : ['Sin integraciones explicitas'],
    restrictions: blueprint.constraints,
    priority,
    projectType: blueprint.projectType,
    targetUser: blueprint.audience,
    mainGoal: blueprint.objective,
    useCases: [
      `Crear una primera version de ${blueprint.projectType}`,
      `Validar requisitos para ${blueprint.audience}`,
      `Resolver el objetivo principal: ${blueprint.objective}`,
    ],
    requiredInputs: [
      'Idea inicial del usuario',
      blueprint.entities.length > 0 ? `Entidades a modelar: ${blueprint.entities.join(', ')}` : '',
      blueprint.roles.length > 0 ? `Roles a contemplar: ${blueprint.roles.join(', ')}` : '',
      blueprint.questions.length > 0 ? `Preguntas pendientes: ${blueprint.questions.join(' | ')}` : '',
    ].filter((item): item is string => Boolean(item)),
    expectedOutputs: [
      `Sistema base tipo: ${blueprint.projectType}`,
      `Funcionalidades: ${blueprint.features.join(', ')}`,
      `Entidades: ${blueprint.entities.join(', ')}`,
      `Roles: ${blueprint.roles.join(', ')}`,
      'Prompt recomendado listo para revisar',
      'Skill, workflow y agente sugeridos como drafts compatibles',
    ],
    risks: [
      `Prioridad detectada: ${priority}`,
      `Complejidad tecnica aproximada: ${heuristics.complexity}`,
      ...blueprint.risks,
    ],
    assumptions: [
      `Tipo inferido: ${blueprint.projectType}`,
      `Categoria detectada: ${blueprint.category}`,
      `Confianza del tipo de proyecto: ${Math.round(blueprint.confidence * 100)}%`,
      `Monetizacion: ${blueprint.monetization.join(', ') || 'Pendiente de definir'}`,
      `Integraciones: ${blueprint.integrations.join(', ') || 'Sin integraciones explicitas'}`,
    ],
    confidence: blueprint.confidence,
  }
}

export function analyzeIdea(idea: string): NexusIdeaAnalysis {
  return analysisFromBlueprint(generateProjectBlueprint(idea))

  const cleanIdea = idea.trim()
  const heuristics = buildHeuristics(cleanIdea)
  const detectedProject = detectProjectType(cleanIdea)
  const specializedRequirements = getSpecializedRequirements(detectedProject.category, cleanIdea)
  const objective = extractObjective(cleanIdea)
  const audience = extractAudience(cleanIdea)
  const features = uniqueItems([
    ...extractFeatures(cleanIdea),
    ...(specializedRequirements?.functionalities ?? []),
  ])
  const visualDesign = extractVisualDesign(cleanIdea)
  const languages = extractLanguages(cleanIdea)
  const content = extractContent(cleanIdea)
  const entities = specializedRequirements?.entities ?? []
  const roles = specializedRequirements?.roles ?? []
  const pendingQuestions = specializedRequirements?.pendingQuestions ?? []
  const monetization = extractMonetization(cleanIdea)
  const integrations = uniqueOrFallback([
    ...extractIntegrations(cleanIdea).filter((integration) => integration !== 'Sin integraciones explicitas'),
    ...(specializedRequirements?.suggestedIntegrations ?? []),
  ], ['Sin integraciones explicitas'])
  const restrictions = extractRestrictions(cleanIdea)
  const priority = extractPriority(cleanIdea)
  const projectType = detectedProject.category === 'unknown' ? extractProjectType(cleanIdea) : detectedProject.type
  const hasSemanticSignals = [
    features,
    visualDesign,
    content,
    monetization.filter((item) => item !== 'Pendiente de definir'),
    integrations.filter((item) => item !== 'Sin integraciones explicitas'),
    restrictions.filter((item) => item !== 'No inventar requisitos no mencionados'),
  ].some((items) => items.length > 0)

  return {
    summary: `Objetivo: ${objective}. Audiencia: ${audience}. Tipo: ${projectType}. Prioridad: ${priority}.`,
    domain: projectType,
    objective,
    audience,
    features,
    visualDesign,
    languages,
    content,
    entities,
    roles,
    pendingQuestions,
    monetization,
    integrations,
    restrictions,
    priority,
    projectType,
    targetUser: audience,
    mainGoal: objective,
    useCases: [
      `Crear una primera version de ${projectType}`,
      `Validar requisitos para ${audience}`,
      'Convertir los requisitos en prompt, skill, workflow y agente',
    ],
    requiredInputs: [
      'Idea inicial del usuario',
      'Contenido real que debe aparecer en el sistema',
      'Criterios de exito, restricciones y prioridades',
      entities.length > 0 ? `Entidades a modelar: ${entities.join(', ')}` : '',
      roles.length > 0 ? `Roles a contemplar: ${roles.join(', ')}` : '',
    ].filter(Boolean),
    expectedOutputs: [
      `Sistema base tipo: ${projectType}`,
      `Funcionalidades: ${features.join(', ')}`,
      `Diseño: ${visualDesign.join(', ')}`,
      `Idiomas: ${languages.join(', ')}`,
      'Prompt recomendado listo para revisar',
      'Skill, workflow y agente sugeridos como drafts compatibles',
    ],
    risks: [
      `Prioridad detectada: ${priority}`,
      `Complejidad tecnica aproximada: ${heuristics.complexity}`,
      ...(specializedRequirements?.risks ?? []),
      'Puede faltar informacion de contenido, pricing, permisos o alcance funcional',
      'Los requisitos extraidos son heurísticos y deben revisarse antes de producir',
    ],
    assumptions: [
      `Tipo inferido: ${projectType}`,
      `Categoria detectada: ${detectedProject.category}`,
      `Confianza del tipo de proyecto: ${Math.round(detectedProject.confidence * 100)}%`,
      `Monetizacion: ${monetization.join(', ')}`,
      `Integraciones: ${integrations.join(', ')}`,
    ],
    confidence: Math.max(detectedProject.confidence, hasSemanticSignals ? 0.82 : 0.58),
  }
}

export function generatePromptFromStructuredBlueprint(
  blueprint: StructuredProjectBlueprint,
  promptBlueprint = generatePromptBlueprint(blueprint)
): NexusRecommendedPrompt {
  const heuristics = buildHeuristics(blueprint.originalIdea)
  const promptTemplateDraft: PromptTemplate = {
    ...heuristics.matchedTemplate,
    rol: promptBlueprint.role,
    tarea: promptBlueprint.task,
    proyecto: blueprint.category,
    stack: '',
    destino: blueprint.audience.join(', '),
    restriccion: promptBlueprint.constraints.join('\n'),
    outputType: promptBlueprint.outputFormat,
    ext: 'respuesta compacta y accionable',
    tono: 'claro, preciso y orientado a producto',
    criterios: promptBlueprint.requirements.join('\n'),
    autonomia: 'si falta informacion critica, indicala como pregunta pendiente',
    fuentes: 'usa solo la idea original como hecho confirmado',
    cot: false,
    sc: false,
    xml: true,
    neg: true,
    ej: false,
    pre: false,
    int: false,
    crit: true,
    devil: false,
    matType: 'idea_original',
    matFile: '',
    material: blueprint.originalIdea,
    evidenceMode: true,
    assumptionPolicy: 'separa confirmado, inferido y sugerido',
    missingInfoPolicy: 'pregunta si falta informacion critica',
    verificationDepth: 'validacion compacta',
    antiHallucinationNotes: 'no presentes sugerencias como requisitos confirmados',
    appGoal: blueprint.objective,
    appType: blueprint.category,
    appScreens: '',
    appData: '',
    appIntegrations: '',
    appPermissions: '',
    appDesign: '',
    appAcceptance: '',
  }
  const prompt = renderFinalPromptFromBlueprint(blueprint, promptBlueprint)
  const quality = scorePrompt(promptTemplateDraft)

  return {
    title: `Prompt recomendado para ${blueprint.category}`,
    prompt,
    rationale: `Se genera desde StructuredProjectBlueprint con categoria ${blueprint.category}, confianza ${blueprint.confidence}% (${blueprint.confidenceLevel}) y salida esperada: ${promptBlueprint.outputFormat}.`,
    targetModel: promptBlueprint.targetModel,
    templateId: heuristics.templateId,
    promptTemplateDraft,
    qualitySignals: [
      `Score estimado: ${quality.total}/100`,
      ...quality.tips,
    ],
  }
}

export function generatePromptFromBlueprint(
  blueprint: ProjectBlueprint,
  promptBlueprint = generatePromptBlueprint(generateStructuredBlueprint(blueprint.originalIdea, blueprint))
): NexusRecommendedPrompt {
  return generatePromptFromStructuredBlueprint(generateStructuredBlueprint(blueprint.originalIdea, blueprint), promptBlueprint)
}

export function generatePromptFromIdea(idea: string, analysis = analyzeIdea(idea)): NexusRecommendedPrompt {
  void analysis
  const blueprint = generateProjectBlueprint(idea)
  const structuredBlueprint = generateStructuredBlueprint(idea, blueprint)
  const promptBlueprint = generatePromptBlueprint(structuredBlueprint)
  return generatePromptFromStructuredBlueprint(structuredBlueprint, promptBlueprint)
}

export function generateSkillFromPrompt(
  idea: string,
  recommendedPrompt = generatePromptFromIdea(idea)
): NexusSkillDraft {
  const heuristics = buildHeuristics(idea)
  const analysis = analyzeIdea(idea)
  const baseSkill = heuristics.baseSkill

  return {
    name: `Skill Nexus - ${analysis.projectType}`,
    description: `Instruccion reutilizable para convertir ideas tipo ${analysis.projectType} en sistemas de IA.`,
    category: heuristics.domain === 'productividad' ? 'workflow' : baseSkill.category,
    content: [
      `Idea base: ${idea.trim()}`,
      'Transforma la solicitud en un sistema reutilizable con analisis, prompt, skill, workflow, agente, sistema final y resultado esperado.',
      `Usa este prompt recomendado como referencia:\n${recommendedPrompt.prompt}`,
    ].join('\n\n'),
    insertTarget: 'tarea',
    isExportable: true,
    compatibleSkill: {
      name: `Skill Nexus - ${analysis.projectType}`,
      description: `Convierte ideas tipo ${analysis.projectType} en sistemas de IA reutilizables.`,
      icon: baseSkill.icon,
      category: heuristics.domain === 'productividad' ? 'workflow' : baseSkill.category,
      content: recommendedPrompt.prompt,
      insertTarget: 'tarea',
      isExportable: true,
    },
  }
}

export function generateWorkflowFromSkill(
  idea: string,
  skillDraft = generateSkillFromPrompt(idea),
  blueprint?: StructuredProjectBlueprint
): NexusWorkflowDraft {
  const heuristics = buildHeuristics(idea)
  const analysis = analyzeIdea(idea)
  const subtype = blueprint?.subtype && blueprint.subtype !== 'generic' ? blueprint.subtype : ''
  const workflowName = subtype === 'artisan-catalog'
    ? 'Flujo de publicación y venta artesanal local'
    : subtype
      ? `Workflow ${subtype}`
      : `Workflow Nexus - ${analysis.projectType}`
  const steps: WorkflowStep[] = [
    {
      id: 'step_idea_analysis',
      order: 0,
      type: 'prompt',
      refId: 'nexus_idea_analysis',
      label: 'Analizar idea inicial',
    },
    {
      id: 'step_reusable_skill',
      order: 1,
      type: 'skill',
      refId: 'draft_skill_nexus',
      label: skillDraft.name,
      inputFrom: 'step_idea_analysis',
    },
    {
      id: 'step_agent_execution',
      order: 2,
      type: 'agent',
      refId: heuristics.baseAgent.id,
      label: heuristics.baseAgent.name,
      inputFrom: 'step_reusable_skill',
    },
    {
      id: 'step_final_system',
      order: 3,
      type: 'prompt',
      refId: 'nexus_final_system',
      label: 'Consolidar sistema final y resultado esperado',
      inputFrom: 'step_agent_execution',
    },
  ]

  return {
    name: workflowName,
    description: subtype
      ? `Flujo local especializado para ${subtype}.`
      : 'Flujo local para convertir la idea en un sistema de IA reutilizable.',
    steps,
    compatibleWorkflow: {
      name: workflowName,
      description: `Idea a sistema: ${idea.trim()}`,
      icon: 'N',
      steps,
    },
  }
}

export function generateAgentFromWorkflow(
  idea: string,
  workflowDraft = generateWorkflowFromSkill(idea),
  blueprint?: StructuredProjectBlueprint
): NexusAgentDraft {
  const heuristics = buildHeuristics(idea)
  const analysis = analyzeIdea(idea)
  const baseAgent = heuristics.baseAgent
  const autonomyLevel: AutonomyLevel = heuristics.complexity === 'alta' ? 'plan_confirm' : 'execute_declare'
  const domainLabel = blueprint?.subtype && blueprint.subtype !== 'generic'
    ? `${blueprint.category} / ${blueprint.subtype}`
    : analysis.projectType

  return {
    name: `Agente Nexus - ${domainLabel}`,
    description: `Agente sugerido para ejecutar ${workflowDraft.name}.`,
    role: baseAgent.role,
    systemPrompt: [
      baseAgent.role,
      `Tu objetivo es transformar esta idea en un sistema de IA reutilizable para ${domainLabel}: ${idea.trim()}`,
      blueprint?.subtypeReasoning ? `Subtipo detectado: ${blueprint.subtype}. ${blueprint.subtypeReasoning}` : '',
      'Entrega analisis, prompt, skill, workflow, agente, sistema final y resultado esperado.',
      'No llames a servicios externos. Declara supuestos y riesgos.',
    ].filter(Boolean).join('\n\n'),
    model: heuristics.targetModel,
    tools: baseAgent.tools,
    techniques: Array.from(new Set([...baseAgent.techniques, ...heuristics.techniques])),
    skillIds: baseAgent.skillIds,
    outputFormat: heuristics.outputType,
    autonomyLevel,
    compatibleAgent: {
      name: `Agente Nexus - ${domainLabel}`,
      description: `Orquesta sistemas de IA reutilizables para ${domainLabel}.`,
      icon: baseAgent.icon,
      role: baseAgent.role,
      systemPrompt: baseAgent.systemPrompt,
      model: heuristics.targetModel,
      tools: baseAgent.tools,
      techniques: Array.from(new Set([...baseAgent.techniques, ...heuristics.techniques])),
      skillIds: baseAgent.skillIds,
      outputFormat: heuristics.outputType,
      autonomyLevel,
    },
  }
}

export function generateFinalSystem(
  idea: string,
  analysis = analyzeIdea(idea),
  recommendedPrompt = generatePromptFromIdea(idea, analysis),
  skillDraft = generateSkillFromPrompt(idea, recommendedPrompt),
  workflowDraft = generateWorkflowFromSkill(idea, skillDraft),
  agentDraft = generateAgentFromWorkflow(idea, workflowDraft),
  blueprint?: StructuredProjectBlueprint
): NexusFinalSystem {
  const domainLabel = blueprint?.subtype && blueprint.subtype !== 'generic'
    ? `${blueprint.category} / ${blueprint.subtype}`
    : analysis.domain

  return {
    name: `Sistema Nexus - ${domainLabel}`,
    purpose: `Convertir la idea "${idea.trim()}" en un proceso reutilizable y ejecutable con IA para ${domainLabel}.`,
    reusableAssets: [
      recommendedPrompt.title,
      skillDraft.name,
      workflowDraft.name,
      agentDraft.name,
    ],
    operatingFlow: [
      'Capturar idea inicial',
      'Analizar categoria, subtipo, entradas y salidas',
      'Generar prompt recomendado',
      'Generar skill reutilizable desde el blueprint estructurado',
      'Encadenar skill y agente en un workflow',
      'Consolidar sistema final y resultado esperado',
    ],
    handoffInstructions: 'Revisar los drafts generados, ajustar contexto especifico y guardarlos como recursos reales cuando la Fase 3 conecte acciones de persistencia.',
    limitations: [
      'Version determinista y local: no consulta proveedores LLM ni valida datos externos.',
      'La calidad depende de la claridad de la idea inicial.',
      'Los drafts compatibles aun no se guardan automaticamente.',
    ],
    maintenanceNotes: [
      'Actualizar keywords de dominio cuando aparezcan nuevos casos reales.',
      'Ajustar plantillas y agentes base segun feedback de uso.',
      'En el futuro, esta capa podra conectarse a proveedores LLM sin cambiar el contrato NexusSystem.',
    ],
  }
}

export function generateExpectedResult(
  idea: string,
  analysis = analyzeIdea(idea),
  finalSystem = generateFinalSystem(idea, analysis)
): NexusExpectedResult {
  return {
    summary: `El usuario obtiene un sistema reutilizable para ${analysis.mainGoal}.`,
    deliverables: [
      'Analisis estructurado de la idea',
      'Prompt recomendado',
      'Draft de skill reutilizable',
      'Draft de workflow relacionado',
      'Draft de agente sugerido',
      finalSystem.name,
    ],
    successCriteria: [
      'El sistema explica claramente que problema resuelve',
      'El prompt puede copiarse y ejecutarse',
      'La skill, workflow y agente son compatibles con los tipos actuales',
      'Los riesgos y supuestos quedan declarados',
    ],
    exampleOutcome: `A partir de "${idea.trim()}", Nexus entrega una receta de IA reutilizable que puede guardarse y repetirse para casos similares.`,
    measurableImpact: [
      'Menos tiempo convirtiendo ideas en prompts completos',
      'Mayor consistencia entre prompts, skills, workflows y agentes',
      'Mejor trazabilidad de supuestos, entradas y resultados',
    ],
  }
}

export function buildNexusStages(completedAt: string): NexusSystemStage[] {
  return [
    ['idea', 'Idea', 'Idea original recibida'],
    ['analysis', 'Analisis', 'Lectura del dominio, complejidad, entradas, salidas y riesgos'],
    ['recommended_prompt', 'Prompt recomendado', 'Prompt principal generado desde la idea'],
    ['skill_draft', 'Skill reutilizable', 'Instruccion reusable derivada del prompt'],
    ['workflow_draft', 'Workflow relacionado', 'Secuencia de pasos para ejecutar el sistema'],
    ['agent_draft', 'Agente sugerido', 'Agente compatible con el flujo propuesto'],
    ['final_system', 'Sistema final', 'Consolidacion de recursos y flujo operativo'],
    ['expected_result', 'Resultado esperado', 'Entregables, criterios y ejemplo de salida'],
  ].map(([id, label, description], index) => ({
    id: id as NexusSystemStage['id'],
    label,
    description,
    status: 'completed',
    order: index,
    completedAt,
  }))
}

export function generateLocalNexusSystem(idea: string, classificationOverride?: AiClassification): NexusSystem {
  const originalIdea = idea.trim()
  if (!originalIdea) {
    throw new Error('La idea no puede estar vacia')
  }

  const createdAt = new Date().toISOString()
  const blueprint = generateProjectBlueprint(originalIdea)
  const structuredBlueprint = generateStructuredBlueprint(originalIdea, blueprint, classificationOverride)
  const promptBlueprint = generatePromptBlueprint(structuredBlueprint)
  const rawAnalysis = analysisFromBlueprint(blueprint)
  let analysisOverrides: Partial<NexusIdeaAnalysis> = {}
  if (classificationOverride) {
    const projectType = classificationOverride.subtype
      ? `${structuredBlueprint.category} / ${classificationOverride.subtype}`
      : structuredBlueprint.category
    const objective = classificationOverride.objective || rawAnalysis.objective
    const audience = classificationOverride.audience.join(', ') || rawAnalysis.audience
    analysisOverrides = {
      domain: projectType,
      projectType,
      objective,
      audience,
      summary: `Objetivo: ${objective}. Audiencia: ${audience}. Tipo: ${projectType}. Categoria: ${structuredBlueprint.category}.`,
    }
  }
  const analysis = {
    ...rawAnalysis,
    ...analysisOverrides,
    confidence: structuredBlueprint.confidence / 100,
    pendingQuestions: structuredBlueprint.pendingQuestions.map((question) => question.question),
  }
  const recommendedPrompt = generatePromptFromStructuredBlueprint(structuredBlueprint, promptBlueprint)
  if (structuredBlueprint.needsDiscovery) {
    const skillDraft: NexusSkillDraft = {
      name: 'Skill pendiente - Discovery Mode',
      description: 'Pendiente hasta aclarar requisitos minimos.',
      category: 'behavior',
      content: '',
      insertTarget: 'tarea',
      isExportable: false,
    }
    const workflowDraft: NexusWorkflowDraft = {
      name: 'Workflow pendiente - Discovery Mode',
      description: 'Pendiente hasta aclarar el flujo del proyecto.',
      steps: [],
    }
    const agentDraft: NexusAgentDraft = {
      name: 'Agente pendiente - Discovery Mode',
      description: 'Pendiente hasta contar con informacion suficiente.',
      role: 'Discovery assistant',
      systemPrompt: structuredBlueprint.pendingQuestions.map((question) => question.question).join('\n'),
      model: promptBlueprint.targetModel,
      tools: [],
      techniques: [],
      skillIds: [],
      outputFormat: 'Preguntas de descubrimiento',
      autonomyLevel: 'ask_first',
    }
    const finalSystem: NexusFinalSystem = {
      name: 'Discovery Mode',
      purpose: 'Aclarar la idea antes de generar un sistema fiable.',
      reusableAssets: [recommendedPrompt.title],
      operatingFlow: ['Revisar preguntas pendientes', 'Responder requisitos criticos', 'Regenerar blueprint'],
      handoffInstructions: 'Responder las preguntas de discovery antes de guardar artefactos.',
      limitations: ['No se generan skill, workflow ni agente finales con confianza baja.'],
      maintenanceNotes: ['Completar datos minimos y regenerar el sistema.'],
    }
    const expectedResult: NexusExpectedResult = {
      summary: 'Nexus necesita mas informacion para generar un sistema fiable.',
      deliverables: ['Preguntas de descubrimiento', 'Prompt compacto de aclaracion'],
      successCriteria: ['Resolver dudas criticas', 'Subir confianza del blueprint'],
      exampleOutcome: structuredBlueprint.pendingQuestions.map((question) => question.question).join(' '),
      measurableImpact: ['Menos requisitos inventados', 'Mejor precision del sistema generado'],
    }

    return {
      id: createId(originalIdea),
      title: createTitle(originalIdea, analysis.projectType),
      originalIdea,
      blueprint,
      structuredBlueprint,
      promptBlueprint,
      analysis,
      recommendedPrompt,
      skillDraft,
      workflowDraft,
      agentDraft,
      finalSystem,
      expectedResult,
      stages: buildNexusStages(createdAt).map((stage) => (
        ['skill_draft', 'workflow_draft', 'agent_draft', 'final_system'].includes(stage.id)
          ? { ...stage, status: 'blocked' }
          : stage
      )),
      createdAt,
      updatedAt: createdAt,
      version: NEXUS_SYSTEM_VERSION,
    }
  }
  const skillDraft = generateDomainSkill(structuredBlueprint)
  // TODO: generate workflow from structured blueprint
  const workflowDraft = generateWorkflowFromSkill(originalIdea, skillDraft, structuredBlueprint)
  // TODO: generate agent from structured blueprint
  const agentDraft = generateAgentFromWorkflow(originalIdea, workflowDraft, structuredBlueprint)
  const finalSystem = generateFinalSystem(
    originalIdea,
    analysis,
    recommendedPrompt,
    skillDraft,
    workflowDraft,
    agentDraft,
    structuredBlueprint
  )
  const expectedResult = generateExpectedResult(originalIdea, analysis, finalSystem)

  return {
    id: createId(originalIdea),
    title: createTitle(originalIdea, analysis.projectType),
    originalIdea,
    blueprint,
    structuredBlueprint,
    promptBlueprint,
    analysis,
    recommendedPrompt,
    skillDraft,
    workflowDraft,
    agentDraft,
    finalSystem,
    expectedResult,
    stages: buildNexusStages(createdAt),
    createdAt,
    updatedAt: createdAt,
    version: NEXUS_SYSTEM_VERSION,
  }
}

// ─── Hybrid mode exports ──────────────────────────────────────────────────────

export function isNexusApiArtifactsUsable(artifacts: NexusApiArtifacts): boolean {
  return (
    artifacts.recommendedPrompt.prompt.length > 100 &&
    artifacts.skillDraft.name.trim().length > 0 &&
    artifacts.skillDraft.content.length > 80 &&
    artifacts.workflowDraft.steps.length >= 2 &&
    artifacts.agentDraft.name.trim().length > 0 &&
    artifacts.finalSystem.purpose.trim().length > 0 &&
    artifacts.expectedResult.summary.trim().length > 0
  )
}

export function mergeWithApiArtifacts(
  local: NexusSystem,
  artifacts: NexusApiArtifacts
): NexusSystem {
  return {
    ...local,
    recommendedPrompt: artifacts.recommendedPrompt,
    // Preserve local compatible* matches — they're not in the API schema
    skillDraft: {
      ...artifacts.skillDraft,
      compatibleSkill: local.skillDraft.compatibleSkill,
      beginnerExplanation: local.skillDraft.beginnerExplanation,
    },
    workflowDraft: {
      ...artifacts.workflowDraft,
      steps: artifacts.workflowDraft.steps.length > 0
        ? artifacts.workflowDraft.steps
        : local.workflowDraft.steps,
      compatibleWorkflow: local.workflowDraft.compatibleWorkflow,
    },
    agentDraft: {
      ...artifacts.agentDraft,
      techniques: artifacts.agentDraft.techniques.length > 0
        ? artifacts.agentDraft.techniques
        : local.agentDraft.techniques,
      tools: artifacts.agentDraft.tools.length > 0
        ? artifacts.agentDraft.tools
        : local.agentDraft.tools,
      skillIds: artifacts.agentDraft.skillIds.length > 0
        ? artifacts.agentDraft.skillIds
        : local.agentDraft.skillIds,
      compatibleAgent: local.agentDraft.compatibleAgent,
    },
    finalSystem: artifacts.finalSystem,
    expectedResult: artifacts.expectedResult,
    updatedAt: new Date().toISOString(),
    version: `${NEXUS_SYSTEM_VERSION}-enriched`,
  }
}

export async function generateNexusSystem(idea: string): Promise<NexusSystem> {
  return generateLocalNexusSystem(idea)
}

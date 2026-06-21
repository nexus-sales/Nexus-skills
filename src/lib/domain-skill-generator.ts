import type { NexusSkillDraft } from '@/types/nexus'
import type { Skill } from '@/types/prompt'
import type { StructuredProjectBlueprint, StructuredProjectCategory } from '@/types/project-blueprint'

export interface DomainSkillInput {
  name: string
  description: string
}

export interface DomainSkillOutput {
  name: string
  description: string
}

export interface DomainSkillRule {
  name: string
  description: string
}

export interface DomainSkillDraft extends NexusSkillDraft {
  inputs: DomainSkillInput[]
  outputs: DomainSkillOutput[]
  rules: DomainSkillRule[]
  beginnerExplanation: string
}

interface DomainSkillDefinition {
  name: string
  description: string
  category: Skill['category']
  inputs: DomainSkillInput[]
  outputs: DomainSkillOutput[]
  rules: DomainSkillRule[]
  example: string
}

// ─── Archetypes — structural scaffolding and fallback ─────────────────────────

const SKILL_DEFINITIONS: Record<StructuredProjectCategory, DomainSkillDefinition> = {
  'booking-system': {
    name: 'Gestión de reservas',
    description: 'Skill para validar disponibilidad, crear citas y preparar confirmaciones en sistemas de reservas.',
    category: 'workflow',
    inputs: [
      { name: 'cliente', description: 'Persona que solicita la reserva.' },
      { name: 'servicio', description: 'Servicio que se quiere reservar.' },
      { name: 'fecha', description: 'Fecha y hora solicitadas.' },
      { name: 'profesional', description: 'Profesional o agenda asociada.' },
    ],
    outputs: [
      { name: 'cita creada', description: 'Reserva registrada con datos minimos.' },
      { name: 'confirmación', description: 'Mensaje o estado de confirmacion.' },
      { name: 'recordatorio', description: 'Accion preparada para avisar al cliente.' },
    ],
    rules: [
      { name: 'evitar solapes', description: 'No crear reservas si ya existe una cita en el mismo tramo.' },
      { name: 'validar disponibilidad', description: 'Comprobar horario, profesional y duracion.' },
      { name: 'confirmar canal', description: 'Definir si la confirmacion va por email, WhatsApp u otro canal.' },
    ],
    example: 'Cliente solicita corte el viernes a las 10:00 con Ana; valida disponibilidad y crea cita confirmada.',
  },
  marketplace: {
    name: 'Gestión de catálogo artesanal',
    description: 'Skill para publicar y mantener fichas de productos artesanales con fotos, materiales, precios y descuentos.',
    category: 'workflow',
    inputs: [
      { name: 'producto', description: 'Nombre y descripcion de la creacion.' },
      { name: 'fotos', description: 'Imagenes principales del producto.' },
      { name: 'materiales', description: 'Materiales usados en la pieza.' },
      { name: 'precio', description: 'Precio visible para el cliente.' },
      { name: 'descuento', description: 'Descuento activo o estacional si aplica.' },
    ],
    outputs: [
      { name: 'ficha publicada', description: 'Producto listo para mostrarse en catalogo.' },
      { name: 'catálogo actualizado', description: 'Listado sincronizado con la nueva ficha.' },
    ],
    rules: [
      { name: 'validar precio', description: 'No publicar fichas sin precio claro.' },
      { name: 'validar fotos', description: 'Exigir al menos una imagen util.' },
      { name: 'validar materiales', description: 'Incluir materiales cuando el producto sea artesanal.' },
      { name: 'validar idioma', description: 'Mantener contenido preparado para los idiomas definidos.' },
      { name: 'validar descuentos', description: 'Indicar si el descuento es manual, estacional o automatico.' },
    ],
    example: 'Nueva pulsera con fotos, cuero, precio y descuento de temporada; publica ficha y actualiza catalogo.',
  },
  'course-platform': {
    name: 'Gestión de curso online',
    description: 'Skill para estructurar cursos, modulos, lecciones y progreso de alumnos.',
    category: 'workflow',
    inputs: [
      { name: 'curso', description: 'Curso principal.' },
      { name: 'módulo', description: 'Bloque tematico del curso.' },
      { name: 'lección', description: 'Unidad de aprendizaje.' },
      { name: 'alumno', description: 'Usuario que consume el contenido.' },
    ],
    outputs: [
      { name: 'curso estructurado', description: 'Curso ordenado por modulos y lecciones.' },
      { name: 'progreso', description: 'Estado de avance del alumno.' },
      { name: 'evaluación', description: 'Actividad o criterio de comprobacion.' },
    ],
    rules: [
      { name: 'ordenar módulos', description: 'Mantener una secuencia pedagogica clara.' },
      { name: 'validar acceso', description: 'Comprobar permisos antes de mostrar lecciones.' },
      { name: 'controlar progreso', description: 'Actualizar avance al completar contenido.' },
    ],
    example: 'Curso de fotografia con modulo inicial, leccion de luz y evaluacion breve para medir progreso.',
  },
  'landing-page': {
    name: 'Captación de leads',
    description: 'Skill para convertir visitantes en leads mediante formularios, CTA y seguimiento.',
    category: 'workflow',
    inputs: [
      { name: 'visitante', description: 'Persona que llega a la pagina.' },
      { name: 'formulario', description: 'Datos solicitados para captar el lead.' },
      { name: 'servicio', description: 'Oferta o servicio promocionado.' },
      { name: 'CTA', description: 'Accion principal de conversion.' },
    ],
    outputs: [
      { name: 'lead registrado', description: 'Contacto guardado con datos minimos.' },
      { name: 'canal de seguimiento', description: 'Canal definido para responder al lead.' },
    ],
    rules: [
      { name: 'validar contacto', description: 'No aceptar leads sin dato de contacto util.' },
      { name: 'objetivo de conversión', description: 'Mantener una conversion principal clara.' },
      { name: 'fuente', description: 'Registrar origen o campana si existe.' },
    ],
    example: 'Visitante pide presupuesto de reformas; valida telefono/email y marca WhatsApp como seguimiento.',
  },
  'support-system': {
    name: 'Gestión de incidencias',
    description: 'Skill para crear, clasificar y dar seguimiento a tickets de soporte.',
    category: 'workflow',
    inputs: [
      { name: 'cliente', description: 'Persona o cuenta que reporta el problema.' },
      { name: 'incidencia', description: 'Descripcion del problema.' },
      { name: 'prioridad', description: 'Urgencia o impacto detectado.' },
      { name: 'responsable', description: 'Agente asignado.' },
    ],
    outputs: [
      { name: 'ticket creado', description: 'Incidencia registrada.' },
      { name: 'estado actualizado', description: 'Estado operativo del caso.' },
      { name: 'reporte', description: 'Resumen trazable para seguimiento.' },
    ],
    rules: [
      { name: 'prioridad', description: 'Clasificar por impacto y urgencia.' },
      { name: 'asignación', description: 'Asignar responsable claro.' },
      { name: 'trazabilidad', description: 'Registrar cambios y respuestas.' },
    ],
    example: 'Cliente reporta error critico; crea ticket, asigna prioridad alta y responsable.',
  },
  crm: {
    name: 'Gestión de oportunidades CRM',
    description: 'Skill para organizar leads, tareas comerciales y seguimiento.',
    category: 'workflow',
    inputs: [
      { name: 'lead', description: 'Contacto u oportunidad.' },
      { name: 'estado', description: 'Fase comercial actual.' },
      { name: 'responsable', description: 'Persona encargada del seguimiento.' },
    ],
    outputs: [
      { name: 'oportunidad actualizada', description: 'Lead con estado y proximo paso.' },
      { name: 'tarea de seguimiento', description: 'Accion siguiente definida.' },
    ],
    rules: [
      { name: 'siguiente accion', description: 'Cada lead debe tener un proximo paso.' },
      { name: 'propietario', description: 'Cada oportunidad debe tener responsable.' },
    ],
    example: 'Lead pide informacion; asigna responsable y crea tarea de llamada.',
  },
  'content-system': {
    name: 'Gestión de contenido',
    description: 'Skill para organizar publicaciones, categorias y flujo editorial.',
    category: 'workflow',
    inputs: [
      { name: 'contenido', description: 'Pieza editorial o recurso.' },
      { name: 'categoria', description: 'Clasificacion del contenido.' },
      { name: 'autor', description: 'Responsable de la pieza.' },
    ],
    outputs: [
      { name: 'contenido estructurado', description: 'Pieza lista para revisar o publicar.' },
      { name: 'flujo editorial', description: 'Estado y responsable definidos.' },
    ],
    rules: [
      { name: 'clasificacion', description: 'Asignar categoria antes de publicar.' },
      { name: 'revision', description: 'Definir estado editorial.' },
    ],
    example: 'Articulo nuevo con categoria y autor; queda listo para revision.',
  },
  custom: {
    name: 'Descubrimiento de producto',
    description: 'Skill para aclarar ideas incompletas sin inventar requisitos.',
    category: 'behavior',
    inputs: [
      { name: 'idea', description: 'Idea inicial del usuario.' },
      { name: 'respuestas', description: 'Aclaraciones disponibles.' },
      { name: 'restricciones', description: 'Limites conocidos.' },
    ],
    outputs: [
      { name: 'requisitos aclarados', description: 'Hechos confirmados por el usuario.' },
      { name: 'preguntas pendientes', description: 'Dudas necesarias para continuar.' },
    ],
    rules: [
      { name: 'no inventar', description: 'No convertir sugerencias en requisitos confirmados.' },
      { name: 'pedir aclaraciones', description: 'Preguntar cuando falte informacion critica.' },
    ],
    example: 'Idea ambigua de app; separa lo confirmado y pregunta por objetivo, usuarios y flujo principal.',
  },
}

// ─── Domain derivation helpers ────────────────────────────────────────────────

// Entities too generic to drive the skill name or explanation
const GENERIC_ENTITIES = new Set([
  'usuario', 'administrador', 'sistema', 'datos', 'informacion', 'aplicacion', 'categoria',
])

// Verb prefix by archetype category
const CATEGORY_VERB: Record<StructuredProjectCategory, string> = {
  'booking-system': 'Gestión de',
  marketplace: 'Catálogo de',
  'course-platform': 'Gestión de',
  'landing-page': 'Captación en',
  'support-system': 'Soporte de',
  crm: 'Gestión comercial de',
  'content-system': 'Catálogo de',
  custom: 'Gestión de',
}

function pluralizeEs(word: string): string {
  if (word.endsWith('s')) return word
  if (/[aeiouáéíóúü]$/.test(word)) return word + 's'
  return word + 'es'
}

function humanizeEntity(entity: string): string {
  return entity.split('-').join(' ')
}

// 'acceso-qr' → 'accesos QR', 'planta' → 'plantas'
function humanizePlural(entity: string): string {
  const parts = entity.split('-')
  if (parts.length === 1) return pluralizeEs(entity)
  return pluralizeEs(parts[0]) + ' ' + parts.slice(1).join(' ').toUpperCase()
}

// 'y' → 'e' before words starting with i/hi (Spanish conjunction rule)
function joinWithConnector(a: string, b: string): string {
  return /^[iíI]/.test(b) ? `${a} e ${b}` : `${a} y ${b}`
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Returns up to 2 non-generic entities from the blueprint
function topDomainEntities(blueprint: StructuredProjectBlueprint): string[] {
  return blueprint.entities.filter((e) => !GENERIC_ENTITIES.has(e)).slice(0, 2)
}

// ─── Derivation functions ─────────────────────────────────────────────────────

function deriveSkillName(
  blueprint: StructuredProjectBlueprint,
  fallback: DomainSkillDefinition,
): string {
  const top = topDomainEntities(blueprint)
  if (top.length === 0) return fallback.name

  const verb = CATEGORY_VERB[blueprint.category]
  const plurals = top.map(humanizePlural)
  const phrase = plurals.length === 2 ? joinWithConnector(plurals[0], plurals[1]) : plurals[0]
  return `${verb} ${phrase}`
}

function deriveSkillDescription(
  blueprint: StructuredProjectBlueprint,
  fallback: DomainSkillDefinition,
): string {
  const { objective } = blueprint
  const isGeneric =
    !objective ||
    objective.length < 20 ||
    /definir y construir|sin especificar/i.test(objective)
  if (isGeneric) return fallback.description
  const firstSentence = objective.split(/[.!?]/)[0].trim()
  return `Skill para ${firstSentence.charAt(0).toLowerCase() + firstSentence.slice(1)}.`
}

function deriveInputs(
  blueprint: StructuredProjectBlueprint,
  fallback: DomainSkillDefinition,
): DomainSkillInput[] {
  // Use all non-generic entities (up to 4 total)
  const domainEntities = blueprint.entities.filter((e) => !GENERIC_ENTITIES.has(e)).slice(0, 4)
  if (domainEntities.length === 0) return fallback.inputs

  return domainEntities.map((e) => ({
    name: humanizeEntity(e),
    description: `Instancia de ${humanizeEntity(e)} del sistema.`,
  }))
}

function deriveOutputs(
  blueprint: StructuredProjectBlueprint,
  fallback: DomainSkillDefinition,
): DomainSkillOutput[] {
  if (blueprint.mvpScope.length === 0) return fallback.outputs

  return blueprint.mvpScope.slice(0, 3).map((scope) => ({
    name: capitalize(humanizeEntity(scope)),
    description: `Resultado de procesar ${humanizeEntity(scope)} en el sistema.`,
  }))
}

function deriveRules(
  blueprint: StructuredProjectBlueprint,
  fallback: DomainSkillDefinition,
): DomainSkillRule[] {
  // Keep up to 2 structural rules from the archetype as baseline
  const archetypeRules = fallback.rules.slice(0, 2)

  // Append constraint-derived rules from the blueprint
  const constraintRules: DomainSkillRule[] = blueprint.constraints.slice(0, 2).map((c) => ({
    name: humanizeEntity(c),
    description: `Restricción confirmada: ${humanizeEntity(c)}.`,
  }))

  const combined = [...archetypeRules, ...constraintRules]
  return combined.length > 0 ? combined : fallback.rules
}

function deriveExample(
  blueprint: StructuredProjectBlueprint,
  fallback: DomainSkillDefinition,
): string {
  const domainEntities = blueprint.entities.filter((e) => !GENERIC_ENTITIES.has(e))
  if (domainEntities.length === 0) return fallback.example

  const e0Plural = humanizePlural(domainEntities[0])
  return `Registro de ${e0Plural}: el sistema organiza la información y la mantiene lista para usar.`
}

function buildBeginnerExplanation(
  blueprint: StructuredProjectBlueprint,
  skillName: string,
): string {
  const top = topDomainEntities(blueprint)
  const s1 = 'Una skill es una capacidad reutilizable de tu sistema de IA.'

  if (top.length === 0) {
    return [
      s1,
      `Esta es tu skill de ${skillName}: automatiza el proceso principal de tu sistema.`,
      'Úsala cada vez que este proceso necesite ejecutarse en tu proyecto.',
    ].join(' ')
  }

  const plurals = top.map(humanizePlural)
  const entitiesPhrase =
    plurals.length === 2 ? joinWithConnector(plurals[0], plurals[1]) : plurals[0]

  const s2 = `Esta se encarga de tus ${entitiesPhrase}: cada vez que registras o actualizas ${plurals[0]}, el sistema organiza la información y la deja lista para usar.`
  const s3 = `Úsala cada vez que necesites trabajar con tus ${entitiesPhrase} en este proyecto.`
  return `${s1} ${s2} ${s3}`
}

// ─── Content builder ──────────────────────────────────────────────────────────

function formatItems<T extends { name: string; description: string }>(items: T[]): string {
  return items.map((item) => `- ${item.name}: ${item.description}`).join('\n')
}

function formatOptionalList(title: string, items: string[]): string {
  if (items.length === 0) return ''
  return `\n${title}\n${items.map((item) => `- ${item}`).join('\n')}`
}

function marketplaceContext(blueprint: StructuredProjectBlueprint): string[] {
  if (blueprint.category !== 'marketplace') return []

  return [
    blueprint.confirmedRequirements.includes('catalogo-con-contacto-local') &&
      'Venta local: el catalogo debe facilitar contacto o compra local.',
    blueprint.monetization.includes('venta-local') && 'Monetizacion confirmada: venta-local.',
    blueprint.constraints.includes('checkout-online-pospuesto-a-fase-2') &&
      'Restriccion: checkout online pospuesto a fase 2.',
  ].filter((item): item is string => Boolean(item))
}

function buildContent(
  blueprint: StructuredProjectBlueprint,
  definition: DomainSkillDefinition,
): string {
  const domainLabel =
    blueprint.subtype && blueprint.subtype !== 'generic'
      ? `${blueprint.category} / ${blueprint.subtype}`
      : blueprint.category

  const top = topDomainEntities(blueprint)
  const topPluralPhrase =
    top.length > 0
      ? (() => {
          const plurals = top.map(humanizePlural)
          return plurals.length === 2
            ? joinWithConnector(plurals[0], plurals[1])
            : plurals[0]
        })()
      : null

  const whenToUse = topPluralPhrase
    ? `Usa esta skill cuando necesites gestionar ${topPluralPhrase} en el sistema.`
    : `Usa esta skill cuando trabajes con un proyecto de tipo ${domainLabel} y necesites convertir requisitos confirmados en acciones operativas.`

  return [
    `# ${definition.name}`,
    '',
    '## Propósito',
    definition.description,
    '',
    '## Cuándo usarla',
    whenToUse,
    '',
    '## Inputs esperados',
    formatItems(definition.inputs),
    '',
    '## Output esperado',
    formatItems(definition.outputs),
    '',
    '## Reglas de calidad',
    formatItems(definition.rules),
    formatOptionalList('## Requisitos confirmados del blueprint', blueprint.confirmedRequirements),
    formatOptionalList('## Integraciones confirmadas', blueprint.integrations),
    formatOptionalList('## Monetización confirmada', blueprint.monetization),
    formatOptionalList('## Restricciones', blueprint.constraints),
    formatOptionalList('## Contexto de dominio', marketplaceContext(blueprint)),
    formatOptionalList('## Señales de subtipo', blueprint.subtypeSignals ?? []),
    '',
    '## Restricciones',
    '- No inventes requisitos no confirmados.',
    '- Separa hechos confirmados, inferencias y sugerencias.',
    '- Si falta informacion critica, conviertela en pregunta pendiente.',
    '',
    '## Ejemplo breve',
    definition.example,
  ]
    .filter(Boolean)
    .join('\n')
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function generateDomainSkill(blueprint: StructuredProjectBlueprint): DomainSkillDraft {
  const archetype = SKILL_DEFINITIONS[blueprint.category]

  const name = deriveSkillName(blueprint, archetype)
  const description = deriveSkillDescription(blueprint, archetype)
  const inputs = deriveInputs(blueprint, archetype)
  const outputs = deriveOutputs(blueprint, archetype)
  const rules = deriveRules(blueprint, archetype)
  const example = deriveExample(blueprint, archetype)
  const beginnerExplanation = buildBeginnerExplanation(blueprint, name)

  const derived: DomainSkillDefinition = {
    name,
    description,
    category: archetype.category,
    inputs,
    outputs,
    rules,
    example,
  }
  const content = buildContent(blueprint, derived)

  return {
    name,
    description,
    category: archetype.category,
    inputs,
    outputs,
    rules,
    content,
    beginnerExplanation,
    insertTarget: 'tarea',
    isExportable: true,
    compatibleSkill: {
      name,
      description,
      icon: 'N',
      category: archetype.category,
      content,
      insertTarget: 'tarea',
      isExportable: true,
    },
  }
}

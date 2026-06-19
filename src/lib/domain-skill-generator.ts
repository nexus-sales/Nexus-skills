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
    blueprint.confirmedRequirements.includes('catalogo-con-contacto-local') && 'Venta local: el catalogo debe facilitar contacto o compra local.',
    blueprint.monetization.includes('venta-local') && 'Monetizacion confirmada: venta-local.',
    blueprint.constraints.includes('checkout-online-pospuesto-a-fase-2') && 'Restriccion: checkout online pospuesto a fase 2.',
  ].filter((item): item is string => Boolean(item))
}

function buildContent(blueprint: StructuredProjectBlueprint, definition: DomainSkillDefinition): string {
  const domainLabel = blueprint.subtype && blueprint.subtype !== 'generic'
    ? `${blueprint.category} / ${blueprint.subtype}`
    : blueprint.category

  return [
    `# ${definition.name}`,
    '',
    '## Propósito',
    definition.description,
    '',
    '## Cuándo usarla',
    `Usa esta skill cuando trabajes con un proyecto de tipo ${domainLabel} y necesites convertir requisitos confirmados en acciones operativas.`,
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
  ].filter(Boolean).join('\n')
}

function applySubtypeToDefinition(
  blueprint: StructuredProjectBlueprint,
  definition: DomainSkillDefinition
): DomainSkillDefinition {
  if (!blueprint.subtype || blueprint.subtype === 'generic') return definition

  if (blueprint.category === 'booking-system' && blueprint.subtype === 'salon-booking') {
    return {
      ...definition,
      name: 'Gestión de reservas para peluquería',
      description: 'Skill para gestionar reservas de peluqueria o salon, validando servicios, profesionales y disponibilidad.',
    }
  }

  if (blueprint.category === 'booking-system' && blueprint.subtype === 'veterinary-booking') {
    return {
      ...definition,
      name: 'Gestión de citas veterinarias',
      description: 'Skill para gestionar citas veterinarias con cliente, mascota, servicio, profesional y recordatorios.',
    }
  }

  if (blueprint.category === 'booking-system' && blueprint.subtype === 'restaurant-booking') {
    return {
      ...definition,
      name: 'Gestión de reservas de restaurante',
      description: 'Skill para gestionar reservas de mesas, horarios, comensales y confirmaciones.',
    }
  }

  if (blueprint.category === 'marketplace' && blueprint.subtype === 'ecommerce') {
    return {
      ...definition,
      name: 'Gestión ecommerce',
      description: 'Skill para publicar productos, validar precios, preparar checkout y mantener catalogo de ecommerce.',
    }
  }

  if (blueprint.category === 'marketplace' && blueprint.subtype === 'local-store') {
    return {
      ...definition,
      name: 'Gestión de tienda local',
      description: 'Skill para mantener catalogo, contacto local, precios y disponibilidad de una tienda local.',
    }
  }

  if (blueprint.category === 'marketplace' && blueprint.subtype === 'multivendor-marketplace') {
    return {
      ...definition,
      name: 'Gestión de marketplace multivendedor',
      description: 'Skill para coordinar catalogo, vendedores, fichas, precios y reglas de publicacion multivendor.',
    }
  }

  if (blueprint.category === 'course-platform' && blueprint.subtype === 'internal-training') {
    return {
      ...definition,
      name: 'Gestión de formación interna',
      description: 'Skill para estructurar formacion interna, alumnos empleados, progreso y acceso.',
    }
  }

  if (blueprint.category === 'landing-page' && blueprint.subtype === 'lead-generation') {
    return {
      ...definition,
      name: 'Captación de leads',
      description: 'Skill para convertir trafico en leads con formulario, CTA y canal de seguimiento.',
    }
  }

  return definition
}

export function generateDomainSkill(blueprint: StructuredProjectBlueprint): DomainSkillDraft {
  const definition = applySubtypeToDefinition(blueprint, SKILL_DEFINITIONS[blueprint.category])
  const content = buildContent(blueprint, definition)

  return {
    name: definition.name,
    description: definition.description,
    category: definition.category,
    inputs: definition.inputs,
    outputs: definition.outputs,
    rules: definition.rules,
    content,
    insertTarget: 'tarea',
    isExportable: true,
    compatibleSkill: {
      name: definition.name,
      description: definition.description,
      icon: 'N',
      category: definition.category,
      content,
      insertTarget: 'tarea',
      isExportable: true,
    },
  }
}

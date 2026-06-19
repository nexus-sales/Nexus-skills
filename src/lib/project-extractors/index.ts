export interface SpecializedProjectRequirements {
  functionalities: string[]
  entities: string[]
  roles: string[]
  pendingQuestions: string[]
  suggestedIntegrations: string[]
  risks: string[]
}

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function hasAny(idea: string, keywords: string[]): boolean {
  const text = normalize(idea)
  return keywords.some((keyword) => text.includes(normalize(keyword)))
}

function unique(items: Array<string | false | undefined>): string[] {
  return Array.from(new Set(items.filter((item): item is string => Boolean(item))))
}

export function extractLandingRequirements(idea: string): SpecializedProjectRequirements {
  const hasLeadSignal = hasAny(idea, ['lead', 'leads', 'contacto', 'presupuesto', 'formulario'])

  return {
    functionalities: unique([
      'Hero con propuesta de valor',
      'Formulario de captacion',
      'Seccion de beneficios o servicios',
      'Prueba social o testimonios',
      'Llamadas a la accion',
      hasLeadSignal && 'Gestion basica de leads entrantes',
    ]),
    entities: ['Lead', 'Servicio', 'Testimonio', 'Formulario', 'CTA'],
    roles: ['Visitante', 'Responsable comercial', 'Administrador'],
    pendingQuestions: unique([
      !hasLeadSignal && 'Que dato principal debe capturar el formulario?',
      'Cual es la conversion principal: llamada, WhatsApp, formulario o reserva?',
      'Que objeciones del cliente debe resolver la pagina?',
      'Necesitas medicion de conversiones o pixel de anuncios?',
    ]),
    suggestedIntegrations: unique([
      hasAny(idea, ['whatsapp', 'whatssapp', 'wasap']) && 'WhatsApp',
      'Email',
      'Analytics',
      hasLeadSignal && 'CRM',
    ]),
    risks: [
      'Mensaje demasiado generico para convertir trafico frio',
      'Falta de seguimiento si los leads no se envian a un canal operativo',
    ],
  }
}

export function extractMarketplaceRequirements(idea: string): SpecializedProjectRequirements {
  const hasDiscounts = hasAny(idea, ['descuento', 'descuentos', 'oferta', 'temporada'])
  const hasComments = hasAny(idea, ['comentario', 'comentarios', 'resena', 'valoracion'])
  const hasSocial = hasAny(idea, ['instagram', 'whatsapp', 'redes sociales', 'social media'])

  return {
    functionalities: unique([
      'Catalogo de creaciones o productos',
      'Ficha de producto con fotos, descripcion, materiales y precio',
      'Filtros o categorias',
      hasComments && 'Comentarios o valoraciones',
      hasDiscounts && 'Descuentos por temporada',
      'Panel para crear y editar productos',
    ]),
    entities: ['Producto', 'Categoria', 'Imagen', 'Material', 'Precio', 'Descuento', 'Comentario'],
    roles: ['Visitante', 'Cliente', 'Creador', 'Administrador'],
    pendingQuestions: unique([
      'La app tendra compra online o sera solo catalogo?',
      'Habra panel de administracion para subir y editar creaciones?',
      hasComments && 'Los comentarios los escribira el creador o tambien los visitantes?',
      hasDiscounts && 'Los descuentos por temporada se aplicaran automaticamente o manualmente?',
      hasAny(idea, ['instagram']) && 'Instagram sera solo un enlace externo o importara publicaciones y fotos?',
      hasAny(idea, ['whatsapp', 'whatssapp', 'wasap']) && 'WhatsApp se usara como contacto, boton de compra o soporte?',
      'Necesitas gestion de stock o unidades disponibles?',
    ]),
    suggestedIntegrations: unique([
      hasAny(idea, ['instagram']) && 'Instagram',
      hasAny(idea, ['whatsapp', 'whatssapp', 'wasap']) && 'WhatsApp',
      hasSocial && 'Redes sociales',
      'Email',
    ]),
    risks: [
      'No definir si es catalogo o compra online puede cambiar arquitectura, pagos y pedidos',
      'Las fotos, precios y descuentos requieren un flujo claro de administracion',
    ],
  }
}

export function extractBookingRequirements(idea: string): SpecializedProjectRequirements {
  void idea

  return {
    functionalities: [
      'Calendario de disponibilidad',
      'Reserva de citas',
      'Confirmacion de cita',
      'Gestion de servicios y duraciones',
      'Recordatorios al cliente',
    ],
    entities: ['Cita', 'Servicio', 'Cliente', 'Profesional', 'Horario', 'Disponibilidad'],
    roles: ['Cliente', 'Profesional', 'Administrador'],
    pendingQuestions: [
      'Las citas requieren pago previo, senal o solo confirmacion?',
      'Habra varios profesionales o una sola agenda?',
      'Las cancelaciones y cambios tendran limite de tiempo?',
      'Que canales enviaran confirmaciones y recordatorios?',
    ],
    suggestedIntegrations: ['Google Calendar', 'Email', 'WhatsApp'],
    risks: [
      'Conflictos de horario si no se define disponibilidad real',
      'Ausencias o cancelaciones si no hay recordatorios y reglas de cambio',
    ],
  }
}

export function extractHelpdeskRequirements(idea: string): SpecializedProjectRequirements {
  void idea

  return {
    functionalities: [
      'Creacion de tickets',
      'Clasificacion por prioridad y categoria',
      'Asignacion a responsables',
      'Estados de seguimiento',
      'Historial de respuestas',
    ],
    entities: ['Ticket', 'Cliente', 'Categoria', 'Prioridad', 'Respuesta', 'Agente'],
    roles: ['Cliente', 'Agente de soporte', 'Supervisor', 'Administrador'],
    pendingQuestions: [
      'Que canales crean incidencias: formulario, email, WhatsApp o portal privado?',
      'Como se calculara la prioridad de cada incidencia?',
      'Habra SLA o tiempos maximos de respuesta?',
      'Que incidencias deben escalarse automaticamente?',
    ],
    suggestedIntegrations: ['Email', 'WhatsApp', 'Base de conocimiento'],
    risks: [
      'Sobrecarga operativa si no se definen prioridades y responsables',
      'Perdida de contexto si las respuestas no quedan trazadas',
    ],
  }
}

export function extractCoursePlatformRequirements(idea: string): SpecializedProjectRequirements {
  void idea

  return {
    functionalities: [
      'Catalogo de cursos',
      'Lecciones por modulos',
      'Progreso del alumno',
      'Materiales descargables',
      'Evaluaciones o ejercicios',
    ],
    entities: ['Curso', 'Modulo', 'Leccion', 'Alumno', 'Instructor', 'Progreso', 'Evaluacion'],
    roles: ['Alumno', 'Instructor', 'Administrador'],
    pendingQuestions: [
      'Los cursos seran gratuitos, de pago unico o por suscripcion?',
      'Necesitas certificados al finalizar?',
      'Las clases seran video, texto, directo o mixtas?',
      'Habra comunidad, comentarios o soporte para alumnos?',
    ],
    suggestedIntegrations: ['Email', 'Pasarela de pago', 'Video hosting'],
    risks: [
      'El contenido puede volverse dificil de mantener si no se estructura por modulos',
      'La monetizacion cambia permisos, pagos y acceso a lecciones',
    ],
  }
}

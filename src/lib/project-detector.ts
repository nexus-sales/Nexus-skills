export type ProjectCategory =
  | 'landing-page'
  | 'marketplace'
  | 'ecommerce'
  | 'booking-system'
  | 'crm'
  | 'helpdesk'
  | 'internal-tool'
  | 'course-platform'
  | 'portfolio'
  | 'content-site'
  | 'mobile-app'
  | 'saas'
  | 'community'
  | 'unknown'

export interface ProjectTypeDetection {
  type: string
  confidence: number
  category: ProjectCategory
}

interface ProjectRule {
  category: Exclude<ProjectCategory, 'unknown'>
  type: string
  strong: string[]
  medium: string[]
  weak: string[]
}

const PROJECT_RULES: ProjectRule[] = [
  {
    category: 'booking-system',
    type: 'Sistema de reservas y citas',
    strong: ['citas', 'reservas', 'booking', 'agenda online', 'pedir hora'],
    medium: ['peluqueria', 'barberia', 'clinica', 'consulta', 'restaurante', 'salon', 'turnos'],
    weak: ['calendario', 'horario', 'disponibilidad'],
  },
  {
    category: 'landing-page',
    type: 'Landing page de captacion',
    strong: ['captar leads', 'captacion de leads', 'conseguir clientes', 'pagina de aterrizaje', 'landing page'],
    medium: ['reformas', 'servicios', 'presupuesto', 'contacto', 'conversion', 'lead'],
    weak: ['formulario', 'llamada a la accion', 'campana'],
  },
  {
    category: 'marketplace',
    type: 'Marketplace / catalogo comercial',
    strong: ['marketplace', 'manualidades', 'artesania', 'artesanal', 'creaciones', 'hecho a mano'],
    medium: ['vendedores', 'catalogo', 'productos', 'precio', 'comentarios', 'descuentos'],
    weak: ['fotos', 'materiales', 'valoraciones'],
  },
  {
    category: 'ecommerce',
    type: 'Tienda online',
    strong: ['tienda online', 'ecommerce', 'e-commerce', 'checkout', 'carrito'],
    medium: ['comprar', 'vender', 'producto', 'productos', 'pago', 'pedido'],
    weak: ['stock', 'inventario', 'envio'],
  },
  {
    category: 'crm',
    type: 'CRM / seguimiento comercial',
    strong: ['crm', 'seguimiento comercial', 'pipeline', 'clientes potenciales'],
    medium: ['leads', 'lead', 'prospectos', 'ventas', 'comercial'],
    weak: ['recordatorios', 'email comercial', 'propuesta'],
  },
  {
    category: 'helpdesk',
    type: 'Helpdesk / gestion de incidencias',
    strong: ['incidencias clientes', 'helpdesk', 'mesa de ayuda', 'tickets'],
    medium: ['incidencias', 'soporte', 'reclamaciones', 'atencion al cliente'],
    weak: ['faq', 'prioridad', 'escalado'],
  },
  {
    category: 'internal-tool',
    type: 'Herramienta interna',
    strong: ['herramienta interna', 'app interna', 'panel interno', 'backoffice'],
    medium: ['dashboard', 'panel', 'operaciones', 'procesos internos', 'gestion interna'],
    weak: ['metricas', 'reportes', 'roles'],
  },
  {
    category: 'course-platform',
    type: 'Plataforma de cursos online',
    strong: ['cursos online', 'plataforma de cursos', 'elearning', 'e-learning'],
    medium: ['curso', 'formacion', 'alumnos', 'clases', 'lecciones'],
    weak: ['evaluaciones', 'certificados', 'modulos'],
  },
  {
    category: 'portfolio',
    type: 'Portfolio profesional',
    strong: ['portfolio', 'portafolio', 'marca personal'],
    medium: ['trabajos', 'proyectos', 'cv', 'curriculum', 'servicios profesionales'],
    weak: ['galeria', 'testimonios', 'contacto'],
  },
  {
    category: 'content-site',
    type: 'Sitio de contenidos',
    strong: ['blog', 'revista', 'portal de contenido', 'noticias'],
    medium: ['articulos', 'publicaciones', 'contenido', 'categorias'],
    weak: ['newsletter', 'seo', 'editorial'],
  },
  {
    category: 'mobile-app',
    type: 'Aplicacion movil',
    strong: ['app movil', 'aplicacion movil', 'ios', 'android'],
    medium: ['notificaciones push', 'telefono', 'tablet'],
    weak: ['responsive', 'offline'],
  },
  {
    category: 'saas',
    type: 'Producto SaaS',
    strong: ['saas', 'software como servicio', 'suscripcion mensual'],
    medium: ['multiusuario', 'planes', 'suscripcion', 'tenant', 'usuarios'],
    weak: ['dashboard', 'billing', 'onboarding'],
  },
  {
    category: 'community',
    type: 'Comunidad online',
    strong: ['comunidad', 'foro', 'red social', 'members area'],
    medium: ['miembros', 'usuarios', 'publicar', 'grupos', 'comentarios'],
    weak: ['moderacion', 'perfiles', 'mensajes'],
  },
]

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function countMatches(text: string, keywords: string[]): number {
  return keywords.filter((keyword) => text.includes(normalize(keyword))).length
}

function resolveSpecificType(category: ProjectCategory, idea: string, fallback: string): string {
  const text = normalize(idea)

  if (category === 'marketplace' && /(manualidad|manualidades|artesania|artesanal|hecho a mano)/i.test(text)) {
    return 'Catalogo web artesanal / marketplace artesanal'
  }

  if (category === 'booking-system' && /(peluqueria|barberia|salon)/i.test(text)) {
    return 'Sistema de citas para peluqueria'
  }

  if (category === 'landing-page' && /(reforma|reformas)/i.test(text)) {
    return 'Landing page de captacion para reformas'
  }

  return fallback
}

function confidenceFromScore(score: number): number {
  if (score <= 0) return 0
  return Math.min(0.98, Number((score / (score + 4)).toFixed(2)))
}

export function detectProjectType(idea: string): ProjectTypeDetection {
  const cleanIdea = idea.trim()
  if (!cleanIdea) {
    return {
      type: 'Proyecto no identificado',
      confidence: 0,
      category: 'unknown',
    }
  }

  const text = normalize(cleanIdea)
  const scoredRules = PROJECT_RULES.map((rule) => {
    const strongScore = countMatches(text, rule.strong) * 4
    const mediumScore = countMatches(text, rule.medium) * 2
    const weakScore = countMatches(text, rule.weak)

    return {
      rule,
      score: strongScore + mediumScore + weakScore,
    }
  }).sort((a, b) => b.score - a.score)

  const best = scoredRules[0]
  if (!best || best.score === 0) {
    return {
      type: 'Proyecto no identificado',
      confidence: 0.25,
      category: 'unknown',
    }
  }

  return {
    type: resolveSpecificType(best.rule.category, cleanIdea, best.rule.type),
    confidence: confidenceFromScore(best.score),
    category: best.rule.category,
  }
}

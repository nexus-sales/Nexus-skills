import type { StructuredProjectCategory } from '@/types/project-blueprint'

export interface DomainKnowledgeRules {
  criticalQuestions: string[]
  recommendedQuestions: string[]
  optionalQuestions: string[]
  risks: string[]
  nonFunctionalRequirements: string[]
  successMetrics: string[]
  mvpDefaults: string[]
  futureDefaults: string[]
}

const EMPTY_RULES: DomainKnowledgeRules = {
  criticalQuestions: [],
  recommendedQuestions: [],
  optionalQuestions: [],
  risks: [],
  nonFunctionalRequirements: [],
  successMetrics: [],
  mvpDefaults: [],
  futureDefaults: [],
}

export function getDomainKnowledgeRules(
  category: StructuredProjectCategory,
  subtype?: string
): DomainKnowledgeRules {
  if (category === 'marketplace' && subtype === 'artisan-catalog') {
    return {
      criticalQuestions: [],
      recommendedQuestions: [
        'Necesitas stock simple o inventario ilimitado?',
        'Los comentarios requeriran autenticacion o moderacion manual?',
      ],
      optionalQuestions: [
        'Quieres importacion automatica desde Instagram en una fase futura?',
      ],
      risks: [
        'Gestion de imagenes y optimizacion visual del catalogo',
        'Moderacion de comentarios y contenido generado por usuarios',
        'Dependencia de Instagram API si se automatiza la importacion',
      ],
      nonFunctionalRequirements: [
        'mobile-first',
        'SEO productos',
        'imagenes optimizadas',
        'i18n',
        'accesibilidad basica',
      ],
      successMetrics: [
        'clics WhatsApp',
        'visitas ficha producto',
        'contactos generados',
      ],
      mvpDefaults: [
        'catalogo navegable',
        'ficha de producto',
        'panel admin basico',
      ],
      futureDefaults: [
        'importacion Instagram automatica',
        'stock avanzado',
      ],
    }
  }

  if (category === 'booking-system' && subtype === 'salon-booking') {
    return {
      criticalQuestions: [
        'Habra una agenda unica o multiples profesionales?',
      ],
      recommendedQuestions: [
        'Cual sera el tiempo limite para cancelar o mover citas?',
        'Los recordatorios saldran por WhatsApp, email o ambos?',
      ],
      optionalQuestions: [
        'Necesitas pagos anticipados o senal para confirmar la cita?',
      ],
      risks: [
        'Solapes de agenda si no se define disponibilidad real',
        'Ausencias si los recordatorios no estan claros',
      ],
      nonFunctionalRequirements: [
        'mobile-first',
        'flujo de reserva rapido',
        'accesibilidad basica',
      ],
      successMetrics: [
        'citas creadas',
        'recordatorios enviados',
        'cancelaciones reducidas',
      ],
      mvpDefaults: [
        'agenda',
        'reserva de cita',
        'confirmacion',
      ],
      futureDefaults: [
        'pagos anticipados',
        'sincronizacion avanzada de calendarios',
      ],
    }
  }

  if (category === 'course-platform') {
    return {
      criticalQuestions: [
        'Los cursos seran gratuitos, de pago unico o por suscripcion?',
      ],
      recommendedQuestions: [
        'Necesitas certificados al finalizar?',
        'Habra soporte o tutoria para alumnos?',
      ],
      optionalQuestions: [
        'Quieres comunidad o comentarios entre alumnos?',
      ],
      risks: [
        'Acceso inconsistente si no se define monetizacion',
        'Mantenimiento alto si no se estructura bien el contenido',
      ],
      nonFunctionalRequirements: [
        'control de progreso fiable',
        'rendimiento de contenidos multimedia',
        'accesibilidad basica',
      ],
      successMetrics: [
        'cursos publicados',
        'avance medio por alumno',
        'finalizacion de cursos',
      ],
      mvpDefaults: [
        'catalogo de cursos',
        'modulos y lecciones',
        'progreso del alumno',
      ],
      futureDefaults: [
        'comunidad',
        'certificaciones avanzadas',
      ],
    }
  }

  return EMPTY_RULES
}

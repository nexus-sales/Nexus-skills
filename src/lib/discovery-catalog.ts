import type { StructuredProjectCategory } from '@/types/project-blueprint'

export const DISCOVERY_CATALOG: Record<StructuredProjectCategory, string[]> = {
  'booking-system': [
    'Quien reservara las citas?',
    'Habra varios profesionales o una sola agenda?',
    'Necesitas pagos, senales o solo confirmacion?',
    'Que recordatorios debe enviar el sistema?',
  ],
  'course-platform': [
    'Los cursos seran gratuitos, de pago unico o suscripcion?',
    'Las clases seran video, texto, directo o mixtas?',
    'Necesitas progreso, evaluaciones o certificados?',
    'Quien podra crear y editar cursos?',
  ],
  'landing-page': [
    'Que conversion principal buscas: formulario, llamada, WhatsApp o reserva?',
    'Que servicio u oferta quieres destacar?',
    'Que datos debe capturar el lead?',
    'Necesitas medir conversiones?',
  ],
  marketplace: [
    'Sera solo catalogo o tendra compra online?',
    'Quien subira y editara productos?',
    'Necesitas stock o unidades disponibles?',
    'Habra comentarios, valoraciones o favoritos?',
  ],
  crm: [
    'Que etapas tiene el pipeline?',
    'Quien gestiona cada lead?',
    'Que recordatorios o tareas necesita el equipo?',
    'Necesitas integraciones con email o calendario?',
  ],
  'support-system': [
    'Por que canal entran las incidencias?',
    'Habra prioridades o SLA?',
    'Quien responde y quien supervisa?',
    'Necesitas base de conocimiento?',
  ],
  'content-system': [
    'Que tipo de contenido publicaras?',
    'Quien crea, revisa y publica?',
    'Necesitas categorias, etiquetas o buscador?',
    'Necesitas newsletter o analitica?',
  ],
  custom: [
    'Sera para clientes o para personal interno?',
    'Gestionara citas?',
    'Gestionara historiales o fichas?',
    'Gestionara recordatorios, pagos o notificaciones?',
    'Sera web, movil o ambas?',
  ],
}

import { TEMPLATES } from '@/constants/templates'
import type { PromptTemplate } from '@/types/prompt'

export interface MatchResult {
  id: string
  template: PromptTemplate
  icon: string
  displayName: string
  confidence: number
  reason: string
}

const TEMPLATE_ICONS: Record<string, string> = {
  audit:        '🔍',
  fix:          '🐛',
  componente:   '⚛️',
  refactor:     '♻️',
  conversion:   '🔄',
  sysprompt:    '🤖',
  doc:          '📄',
  propuesta:    '💼',
  email:        '✉️',
  linkedin:     '🔵',
  nis2:         '🛡️',
  sprint:       '📋',
  analisis:     '🔬',
  app_existente:'🏗️',
}

const TEMPLATE_NAMES: Record<string, string> = {
  audit:        'Auditoría de seguridad',
  fix:          'Fix de bug',
  componente:   'Componente React',
  refactor:     'Refactorización',
  conversion:   'Migración HTML → Next',
  sysprompt:    'System Prompt',
  doc:          'Informe / Documento',
  propuesta:    'Propuesta comercial',
  email:        'Email comercial',
  linkedin:     'Post LinkedIn',
  nis2:         'Consultor NIS2',
  sprint:       'Planificación de sprint',
  analisis:     'Análisis de requisitos',
  app_existente:'App existente',
}

const TEMPLATE_KEYWORDS: Record<string, string[]> = {
  audit:        ['auditoria', 'auditoría', 'seguridad', 'vulnerabilidad', 'revisar código', 'xss', 'sqli', 'pentest', 'hackeo'],
  fix:          ['bug', 'error', 'fallo', 'fix', 'arreglar', 'roto', 'no funciona', 'problema en', 'crashea'],
  componente:   ['componente', 'component', 'botón', 'modal', 'card', 'formulario react', 'ui react', 'interfaz react'],
  refactor:     ['refactor', 'limpiar', 'mejorar código', 'optimizar', 'deuda técnica', 'clean code', 'simplificar código'],
  conversion:   ['migrar', 'migración', 'convertir', 'html a', 'legacy', 'next.js', 'vite', 'pasar de html', 'pasar a react'],
  sysprompt:    ['system prompt', 'instrucciones del sistema', 'prompt de sistema', 'crear agente', 'configurar agente'],
  doc:          ['informe', 'documento', 'reporte', 'word', 'pdf', 'documentar', 'documentación técnica'],
  propuesta:    ['propuesta', 'presupuesto', 'oferta comercial', 'propuesta de venta', 'cliente potencial'],
  email:        ['email', 'correo', 'newsletter', 'captación', 'seguimiento comercial', 'email de ventas'],
  linkedin:     ['linkedin', 'post linkedin', 'publicación linkedin', 'personal branding', 'contenido linkedin'],
  nis2:         ['nis2', 'cumplimiento', 'normativa', 'seguridad empresa', 'gdpr', 'rgpd', 'ciberseguridad empresa'],
  sprint:       ['sprint', 'backlog', 'roadmap', 'planificación', 'tareas pendientes', 'priorizar tareas'],
  analisis:     ['análisis', 'requisitos', 'feature', 'funcionalidad nueva', 'historias de usuario', 'user stories'],
  app_existente:['app existente', 'mejorar app', 'añadir a la app', 'extender la aplicacion', 'app ya creada'],
}

export function matchTemplate(userInput: string): MatchResult | null {
  // Normalise: lowercase + strip accents for comparison
  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  const inputNorm = normalize(userInput)
  const inputLower = userInput.toLowerCase()

  let bestMatch: MatchResult | null = null
  let bestScore = 0

  for (const [key, keywords] of Object.entries(TEMPLATE_KEYWORDS)) {
    const matches = keywords.filter(
      kw => inputLower.includes(kw) || inputNorm.includes(normalize(kw))
    )
    if (matches.length === 0) continue

    const score = matches.length / keywords.length
    if (score > bestScore && score > 0.1) {
      bestScore = score
      const template = TEMPLATES[key]
      if (template) {
        bestMatch = {
          id: key,
          template,
          icon: TEMPLATE_ICONS[key] ?? '📋',
          displayName: TEMPLATE_NAMES[key] ?? key,
          confidence: score,
          reason: `Detectado: ${matches.slice(0, 2).join(', ')}`,
        }
      }
    }
  }

  return bestMatch
}

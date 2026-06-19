import { generatePrompt } from '@/lib/prompt-generator'
import type { PromptFormState, TargetModel } from '@/types/prompt'

export type ExportFormat =
  | 'plain'
  | 'claude_code'
  | 'api_system'
  | 'gpt_markdown'
  | 'gemini'

export function exportPrompt(
  state: PromptFormState,
  format: ExportFormat,
  model: TargetModel = 'universal'
): string {
  const base = generatePrompt(state, model)

  switch (format) {
    case 'plain':
      return base

    case 'claude_code':
      return [
        `# CLAUDE.md — ${state.proyecto || 'Proyecto'}`,
        state.rol ? `## Rol\n${state.rol}` : '',
        state.tarea ? `## Tarea\n${state.tarea}` : '',
        state.restriccion ? `## Restricciones\n- ${state.restriccion}` : '',
        state.criterios ? `## Criterios de éxito\n- ${state.criterios}` : '',
        state.stack ? `## Stack\n${state.stack}` : '',
      ].filter(Boolean).join('\n\n')

    case 'api_system': {
      const systemPart = state.rol || 'Eres un asistente útil y preciso.'
      // Build user part without the role sentence
      const userPart = state.tarea
        ? generatePrompt({ ...state, rol: '' }, model).trim()
        : base.replace(state.rol ?? '', '').trim()
      return JSON.stringify({ system: systemPart, user: userPart }, null, 2)
    }

    case 'gpt_markdown':
      return base
        .replace(/<contexto>/g, '## Contexto')
        .replace(/<\/contexto>/g, '')
        .replace(/<formato_de_salida>/g, '## Formato de salida')
        .replace(/<\/formato_de_salida>/g, '')
        .replace(/<restricciones>/g, '## Restricciones')
        .replace(/<\/restricciones>/g, '')
        .replace(/<control_experto>/g, '## Control experto')
        .replace(/<\/control_experto>/g, '')
        .replace(/<verificacion_antialucinacion>/g, '## Verificación')
        .replace(/<\/verificacion_antialucinacion>/g, '')
        .replace(/<blueprint_app>/g, '## Blueprint app')
        .replace(/<\/blueprint_app>/g, '')
        .replace(/<modo_diablo>/g, '## Revisión crítica')
        .replace(/<\/modo_diablo>/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()

    case 'gemini':
      return base
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()

    default:
      return base
  }
}

export const EXPORT_OPTIONS: {
  format: ExportFormat
  label: string
  description: string
  icon: string
}[] = [
  {
    format: 'plain',
    label: 'Copiar tal cual',
    description: 'Texto completo — Claude, GPT y DeepSeek',
    icon: '📋',
  },
  {
    format: 'claude_code',
    label: 'CLAUDE.md',
    description: 'Descarga como archivo para Claude Code',
    icon: '🛠️',
  },
  {
    format: 'api_system',
    label: 'API JSON',
    description: 'System + user separados para la API',
    icon: '⚙️',
  },
  {
    format: 'gpt_markdown',
    label: 'GPT / Markdown',
    description: 'Sin XML — optimizado para ChatGPT',
    icon: '🧠',
  },
  {
    format: 'gemini',
    label: 'Gemini',
    description: 'Texto plano para Google Gemini',
    icon: '♊',
  },
]

import type { PromptFormState } from '@/types/prompt'

export function getStrategyHints(state: PromptFormState): string[] {
  const hints: string[] = []
  const task = state.tarea.toLowerCase()
  const isAppTask = /(app|aplicacion|componente|codigo|next|react|frontend|backend|api|base de datos|supabase)/i.test(task)

  if (!state.rol) hints.push('Añade un rol experto — aumenta calidad un 20%')
  if (!state.tarea) hints.push('Define la tarea concreta antes de generar')
  if (isAppTask && !state.stack) hints.push('Falta el stack técnico — la IA puede inventar dependencias')
  if (isAppTask && !state.appScreens) hints.push('Define pantallas y flujos para evitar implementar sobre supuestos')
  if (isAppTask && !state.appData) hints.push('Especifica las entidades de datos para el blueprint')
  if (isAppTask && !state.restriccion) hints.push('Añade restricciones para delimitar el alcance del agente')
  if (!state.criterios && !state.appAcceptance) hints.push('Sin criterios de aceptación la IA no sabe cuándo terminar')
  if (!state.evidenceMode) hints.push('Activa Modo Evidencia para prevenir datos inventados')
  if (!state.neg && !state.crit) hints.push('Activa Restricciones + Auto-Crítica para reducir errores')
  if (state.matType && !state.material) hints.push('Has indicado material pero está vacío — adjúntalo')

  return hints.slice(0, 5)
}

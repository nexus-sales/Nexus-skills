import type { PromptFormState, QualityScore } from '@/types/prompt'

export function scorePrompt(state: PromptFormState): QualityScore {
  let role = 0
  let task = 0
  let context = 0
  let format = 0
  let techniques = 0
  let criteria = 0

  if (state.rol) role = 20
  if (state.tarea) task = 25

  if (state.proyecto || state.stack) context += 10
  if (state.destino) context += 10

  if (state.outputType) format += 10
  if (state.tono || state.ext) format += 5

  if (state.criterios) criteria += 8
  if (state.autonomia || state.fuentes) criteria += 7

  const activeTechniques = [
    state.cot, state.sc, state.xml, state.neg,
    state.ej, state.pre, state.int, state.crit, state.devil,
  ].filter(Boolean).length
  techniques = Math.min(activeTechniques * 4, 20)

  if (state.evidenceMode) criteria += 6
  if (state.missingInfoPolicy) criteria += 4
  if (state.verificationDepth) criteria += 4
  if (state.appScreens) context += 5
  if (state.appData) context += 5
  if (state.appAcceptance) criteria += 5

  // Penalización — aplicada antes del clamp para no filtrar en el breakdown
  if (state.matType === 'codigo' && !state.xml && !state.cot) techniques -= 15
  const clampedTechniques = Math.max(0, techniques)

  const total = Math.max(0, Math.min(100,
    role + task + context + format + clampedTechniques + criteria
  ))

  const tips: string[] = []
  if (!state.rol) tips.push('Añade un rol experto para mejorar la precisión')
  if (!state.tarea) tips.push('Define una tarea concreta')
  if (!state.criterios) tips.push('Añade criterios de éxito medibles')
  if (!state.neg) tips.push('Activa Restricciones para reducir relleno')
  if (!state.crit) tips.push('Activa Auto-Crítica para mayor fiabilidad')
  if (!state.evidenceMode) tips.push('Activa Modo Evidencia para prevenir alucinaciones')

  return {
    total,
    breakdown: { role, task, context, format, techniques: clampedTechniques, criteria },
    tips: tips.slice(0, 3),
  }
}

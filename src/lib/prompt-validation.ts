import type {
  PromptFormState,
  PromptValidationReport,
  ValidationCase,
  ValidationCriterion,
  ValidationCriterionResult,
} from '@/types/prompt'

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function findMatches(text: string, keywords: string[]): string[] {
  const normalized = normalizeText(text)
  return keywords.filter((keyword) => normalized.includes(normalizeText(keyword)))
}

function scoreCriteria(prompt: string, criteria: ValidationCriterion[]): ValidationCriterionResult[] {
  return criteria.map((criterion) => {
    const evidence = findMatches(prompt, criterion.keywords)
    return {
      id: criterion.id,
      label: criterion.label,
      description: criterion.description,
      weight: criterion.weight,
      matched: evidence.length > 0,
      evidence,
    }
  })
}

function totalScore(results: ValidationCriterionResult[]): number {
  const possible = results.reduce((sum, result) => sum + result.weight, 0)
  const achieved = results.reduce((sum, result) => sum + (result.matched ? result.weight : 0), 0)
  if (possible === 0) return 0
  return Math.round((achieved / possible) * 100)
}

function buildEvaluatorPrompt(prompt: string, validationCase: ValidationCase): string {
  const criteria = validationCase.criteria
    .map((criterion) => `- ${criterion.label} (${criterion.weight} pts): ${criterion.description}`)
    .join('\n')

  return [
    'Actua como evaluador estricto de calidad de prompts.',
    'Evalua la RESPUESTA_REAL generada por un modelo usando el PROMPT_CANDIDATO y el CASO_DE_PRUEBA.',
    'No evalues si el prompt suena profesional; evalua si la respuesta cumple criterios observables.',
    '',
    '<caso_de_prueba>',
    validationCase.scenario,
    '</caso_de_prueba>',
    '',
    '<prompt_candidato>',
    prompt,
    '</prompt_candidato>',
    '',
    '<rubrica>',
    criteria,
    '</rubrica>',
    '',
    '<senales_esperadas>',
    validationCase.expectedSignals.map((signal) => `- ${signal}`).join('\n'),
    '</senales_esperadas>',
    '',
    '<fallos_a_penalizar>',
    validationCase.failureSignals.map((signal) => `- ${signal}`).join('\n'),
    '</fallos_a_penalizar>',
    '',
    '<respuesta_real>',
    '[Pega aqui la respuesta real del modelo al ejecutar el prompt]',
    '</respuesta_real>',
    '',
    'Devuelve JSON valido con esta forma exacta:',
    '{"score":0,"passed":false,"criteria":[{"label":"","score":0,"evidence":"","issue":""}],"hallucinations":[],"missing":[],"verdict":""}',
  ].join('\n')
}

export function evaluatePromptAgainstCase(
  prompt: string,
  state: PromptFormState,
  validationCase: ValidationCase
): PromptValidationReport {
  const criteria = scoreCriteria(prompt, validationCase.criteria)
  const score = totalScore(criteria)
  const baselineScore = totalScore(scoreCriteria(validationCase.baselinePrompt, validationCase.criteria))
  const level: PromptValidationReport['level'] =
    score >= 80 ? 'fuerte' : score >= 55 ? 'aceptable' : 'debil'

  const strengths = criteria
    .filter((criterion) => criterion.matched)
    .map((criterion) => criterion.label)

  const gaps = criteria
    .filter((criterion) => !criterion.matched)
    .map((criterion) => criterion.label)

  const contextualGaps = [
    !state.material?.trim() && 'Falta material real para probar contra el caso',
    !state.criterios?.trim() && !state.appAcceptance?.trim() && 'Faltan criterios propios de aceptacion',
    !state.evidenceMode && 'Modo evidencia desactivado',
  ].filter((gap): gap is string => Boolean(gap))

  return {
    score,
    level,
    baselineScore,
    criteria,
    strengths,
    gaps: [...gaps, ...contextualGaps],
    evaluatorPrompt: buildEvaluatorPrompt(prompt, validationCase),
  }
}

export function findBestValidationCase(
  state: PromptFormState,
  cases: ValidationCase[]
): ValidationCase {
  const haystack = normalizeText([
    state.tarea,
    state.rol,
    state.outputType,
    state.matType,
    state.appGoal,
    state.promptPhase,
  ].filter(Boolean).join(' '))

  const scored = cases.map((validationCase) => {
    const templateHits = validationCase.templateIds.filter((id) => haystack.includes(normalizeText(id))).length
    const criterionHits = validationCase.criteria.reduce(
      (sum, criterion) => sum + findMatches(haystack, criterion.keywords).length,
      0
    )
    return { validationCase, score: templateHits * 4 + criterionHits }
  })

  return scored.sort((a, b) => b.score - a.score)[0]?.validationCase ?? cases[0]
}

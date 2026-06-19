'use client'
import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { IterationFailReason, PromptIteration, PromptFormState } from '@/types/prompt'

const FAIL_ADJUSTMENTS: Record<IterationFailReason, Partial<PromptFormState>> = {
  too_generic:     { criterios: 'sé específico y concreto, evita respuestas genéricas o de manual', neg: true },
  wrong_format:    { xml: true },
  missing_context: { int: true },
  wrong_tone:      {},
  too_long:        { ext: 'respuesta concisa, máximo 150 palabras, sin relleno', neg: true },
  too_short:       { ext: 'respuesta detallada y completa, sin omitir ningún punto relevante' },
  other:           { crit: true },
}

export function useIteration(sessionId: string) {
  const [iterations, setIterations] = useLocalStorage<PromptIteration[]>(
    `iterations_${sessionId}`,
    []
  )

  const addIteration = useCallback((prompt: string, score: number) => {
    setIterations(prev => [
      ...prev,
      {
        id: `iter_${Date.now()}`,
        version: prev.length + 1,
        prompt,
        score,
        createdAt: new Date().toISOString(),
      },
    ])
  }, [setIterations])

  const markFailed = useCallback((
    iterationId: string,
    reason: IterationFailReason,
    note?: string,
  ): Partial<PromptFormState> => {
    setIterations(prev =>
      prev.map(it => it.id === iterationId ? { ...it, failReason: reason, note } : it)
    )
    return FAIL_ADJUSTMENTS[reason]
  }, [setIterations])

  const clearIterations = useCallback(() => setIterations([]), [setIterations])

  const latestIteration = iterations[iterations.length - 1]

  return { iterations, addIteration, markFailed, clearIterations, latestIteration }
}

'use client'
import { useState, useCallback } from 'react'
import type { AppMode } from '@/types/prompt'

export function useAppMode(initial: AppMode = 'quick') {
  const [mode, setMode] = useState<AppMode>(initial)

  const goQuick  = useCallback(() => setMode('quick'),  [])
  const goGuided = useCallback(() => setMode('guided'), [])
  const goExpert = useCallback(() => setMode('expert'), [])

  return { mode, setMode, goQuick, goGuided, goExpert }
}

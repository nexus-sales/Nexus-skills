'use client'
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface TestResult {
  result: string
  inputTokens: number
  outputTokens: number
  model: string
  durationMs: number
}

type TestStatus = 'idle' | 'loading' | 'success' | 'error'

interface TestState {
  status: TestStatus
  data: TestResult | null
  error: string | null
}

export function useTestPrompt() {
  const [state, setState] = useState<TestState>({
    status: 'idle',
    data: null,
    error: null,
  })

  const test = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return

    setState({ status: 'loading', data: null, error: null })
    const start = Date.now()

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/test-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ prompt }),
      })

      const json = await res.json() as { error?: string; result?: string; inputTokens?: number; outputTokens?: number; model?: string }

      if (!res.ok) {
        setState({ status: 'error', data: null, error: (json.error as string) ?? 'Error desconocido' })
        return
      }

      setState({
        status: 'success',
        data: {
          result: json.result ?? '',
          inputTokens: json.inputTokens ?? 0,
          outputTokens: json.outputTokens ?? 0,
          model: json.model ?? 'claude',
          durationMs: Date.now() - start,
        },
        error: null,
      })
    } catch {
      setState({ status: 'error', data: null, error: 'Error de red. Comprueba tu conexión.' })
    }
  }, [])

  const reset = useCallback(() => {
    setState({ status: 'idle', data: null, error: null })
  }, [])

  return { ...state, test, reset }
}

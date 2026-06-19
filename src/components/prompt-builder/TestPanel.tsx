'use client'
import { useState } from 'react'
import { Play, Copy, RotateCcw, Zap, Clock, Hash, Lock } from 'lucide-react'
import { useTestPrompt } from '@/hooks/useTestPrompt'
import { useAuth } from '@/hooks/useAuth'

interface TestPanelProps {
  prompt: string
}

export function TestPanel({ prompt }: TestPanelProps) {
  const { status, data, error, test, reset } = useTestPrompt()
  const { user, loading } = useAuth()
  const [copied, setCopied] = useState(false)

  if (!prompt.trim()) return null
  if (loading) return null

  if (!user) {
    return (
      <div className="mt-4 rounded-2xl border border-accent-purple/20 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-accent-purple/20 bg-accent-purple/5">
          <Zap className="w-3.5 h-3.5 text-accent-purple" aria-hidden="true" />
          <span className="font-mono text-[10px] text-accent-purple uppercase tracking-[0.15em]">test en vivo</span>
        </div>
        <div className="px-4 py-5 flex flex-col items-center gap-2 text-center">
          <Lock className="w-4 h-4 text-muted" aria-hidden="true" />
          <p className="text-[11px] text-muted">Inicia sesión para probar el prompt directamente con la API de Claude.</p>
          <a
            href="/login"
            className="text-xs text-accent-blue hover:underline mt-1"
            aria-label="Ir a la página de inicio de sesión"
          >
            Iniciar sesión →
          </a>
        </div>
      </div>
    )
  }

  const handleCopyResult = async () => {
    if (!data?.result) return
    await navigator.clipboard.writeText(data.result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-4 rounded-2xl border border-accent-purple/20 bg-accent-purple/3 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-accent-purple/20 bg-accent-purple/5">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-accent-purple" aria-hidden="true" />
          <span className="font-mono text-[10px] text-accent-purple uppercase tracking-[0.15em]">test en vivo</span>
        </div>
        <span className="font-mono text-[10px] text-muted">Claude API</span>
      </div>

      {/* idle */}
      {status === 'idle' && (
        <div className="px-4 py-4">
          <p className="text-[11px] text-muted mb-3">
            Prueba el prompt directamente contra la API de Claude sin salir de la app.
          </p>
          <button
            type="button"
            onClick={() => test(prompt)}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-accent-purple/30 bg-accent-purple/10 text-accent-purple text-xs font-bold px-4 py-2.5 hover:bg-accent-purple/15 active:scale-[0.98] transition-all"
            aria-label="Enviar prompt a Claude y ver el resultado"
          >
            <Play className="w-3.5 h-3.5" aria-hidden="true" />
            Probar con Claude ahora
          </button>
        </div>
      )}

      {/* loading */}
      {status === 'loading' && (
        <div
          className="px-4 py-6 flex flex-col items-center gap-3"
          aria-live="polite"
          aria-label="Esperando respuesta de Claude"
        >
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full bg-accent-purple animate-bounce ${
                  i === 0 ? 'delay-0' : i === 1 ? 'delay-150' : 'delay-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted">Claude está procesando el prompt...</span>
        </div>
      )}

      {/* error */}
      {status === 'error' && (
        <div className="px-4 py-4" role="alert">
          <p className="text-sm text-red-400 mb-3">⚠️ {error}</p>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface2 text-text text-xs font-bold px-3 py-2 hover:border-accent-blue/40 transition-colors"
            aria-label="Reintentar la llamada a la API"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Reintentar
          </button>
        </div>
      )}

      {/* success */}
      {status === 'success' && data && (
        <div className="px-4 py-4">
          {/* Metrics */}
          <div className="flex gap-4 mb-3 font-mono text-[10px] text-muted">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {(data.durationMs / 1000).toFixed(1)}s
            </span>
            <span className="flex items-center gap-1">
              <Hash className="w-3 h-3" aria-hidden="true" />
              {data.inputTokens} → {data.outputTokens} tokens
            </span>
            <span className="text-accent-purple truncate">{data.model}</span>
          </div>

          {/* Result */}
          <div
            className="bg-surface3 border border-border rounded-xl p-4 text-[11px] text-text leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto mb-3"
            role="region"
            aria-label="Respuesta de Claude"
          >
            {data.result}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopyResult}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-accent to-accent-blue text-black text-xs font-bold px-3 py-2 active:scale-[0.98] transition-all"
              aria-label="Copiar respuesta de Claude al portapapeles"
            >
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              {copied ? '✓ Copiado' : 'Copiar resultado'}
            </button>
            <button
              type="button"
              onClick={reset}
              className="p-2 rounded-xl border border-border bg-surface2 text-muted hover:border-accent-blue/40 transition-colors"
              aria-label="Probar de nuevo"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

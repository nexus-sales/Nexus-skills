'use client'
import { useState } from 'react'
import { CheckCircle, XCircle, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import type { PromptIteration, IterationFailReason } from '@/types/prompt'

const FAIL_OPTIONS: { value: IterationFailReason; label: string; emoji: string }[] = [
  { value: 'too_generic',     label: 'Respuesta demasiado genérica',    emoji: '🌫️' },
  { value: 'wrong_format',    label: 'Formato incorrecto',               emoji: '📐' },
  { value: 'missing_context', label: 'Faltó contexto o información',     emoji: '🔍' },
  { value: 'wrong_tone',      label: 'Tono incorrecto',                  emoji: '🎭' },
  { value: 'too_long',        label: 'Respuesta demasiado larga',        emoji: '📜' },
  { value: 'too_short',       label: 'Respuesta demasiado corta',        emoji: '✂️' },
  { value: 'other',           label: 'Otro motivo',                      emoji: '❓' },
]

interface IterationPanelProps {
  iterations: PromptIteration[]
  hasPrompt: boolean
  onMarkWorked: () => void
  onMarkFailed: (reason: IterationFailReason, note?: string) => void
  onClearAll: () => void
}

export function IterationPanel({
  iterations,
  hasPrompt,
  onMarkWorked,
  onMarkFailed,
  onClearAll,
}: IterationPanelProps) {
  const [showHistory, setShowHistory] = useState(false)
  const [selectedReason, setSelectedReason] = useState<IterationFailReason | null>(null)
  const [note, setNote] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)

  if (!hasPrompt && iterations.length === 0) return null

  const currentVersion = iterations.length

  const handleMarkFailed = () => {
    if (!selectedReason) return
    onMarkFailed(selectedReason, note)
    setShowFeedback(false)
    setSelectedReason(null)
    setNote('')
  }

  return (
    <div className="mt-4 rounded-2xl border border-border bg-surface overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted uppercase tracking-[0.15em]">iteración</span>
          {currentVersion > 0 && (
            <span className="font-mono text-[10px] bg-surface2 border border-border text-label px-2 py-0.5 rounded-full">
              v{currentVersion}
            </span>
          )}
        </div>
        {iterations.length > 1 && (
          <button
            type="button"
            onClick={() => setShowHistory(h => !h)}
            className="flex items-center gap-1 font-mono text-[10px] text-muted hover:text-label transition-colors"
            aria-label={showHistory ? 'Ocultar historial de versiones' : 'Ver historial de versiones'}
          >
            {showHistory
              ? <ChevronUp className="w-3 h-3" aria-hidden="true" />
              : <ChevronDown className="w-3 h-3" aria-hidden="true" />}
            {iterations.length - 1} anterior{iterations.length > 2 ? 'es' : ''}
          </button>
        )}
      </div>

      {/* Version history */}
      {showHistory && (
        <div className="border-b border-border divide-y divide-border">
          {[...iterations].reverse().slice(1).map(it => (
            <div key={it.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-[10px] text-muted shrink-0">v{it.version}</span>
                <span className="text-[11px] text-muted truncate">
                  {it.score}/100
                  {it.failReason && ` · ${FAIL_OPTIONS.find(f => f.value === it.failReason)?.emoji} ${FAIL_OPTIONS.find(f => f.value === it.failReason)?.label}`}
                </span>
              </div>
              {it.failReason
                ? <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" aria-label="No funcionó" />
                : <CheckCircle className="w-3.5 h-3.5 text-accent shrink-0" aria-label="Funcionó" />}
            </div>
          ))}
        </div>
      )}

      {/* Main feedback area */}
      {!showFeedback ? (
        <div className="px-4 py-4">
          {iterations.length === 0 ? (
            <p className="text-[11px] text-muted">Copia el prompt para iniciar el seguimiento de iteraciones.</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-text mb-3">¿El prompt funcionó como esperabas?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onMarkWorked}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface2 text-text text-xs font-bold px-3 py-2 hover:border-accent/40 transition-colors"
                  aria-label="El prompt funcionó correctamente"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                  Sí, funcionó
                </button>
                <button
                  type="button"
                  onClick={() => setShowFeedback(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface2 text-text text-xs font-bold px-3 py-2 hover:border-red-400/40 transition-colors"
                  aria-label="El prompt no funcionó, quiero mejorarlo"
                >
                  <XCircle className="w-3.5 h-3.5 text-red-400" aria-hidden="true" />
                  No del todo
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Feedback form */
        <div className="px-4 py-4">
          <p className="text-sm font-semibold text-text mb-3">¿Qué falló?</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {FAIL_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedReason(opt.value)}
                className={`text-left px-3 py-2.5 rounded-xl border text-[11px] transition-all ${
                  selectedReason === opt.value
                    ? 'border-accent-blue bg-accent-blue/10 text-text'
                    : 'border-border bg-surface2 text-label hover:border-border/80'
                }`}
                aria-label={`${opt.label}${selectedReason === opt.value ? ' (seleccionado)' : ''}`}
              >
                <span className="mr-1.5">{opt.emoji}</span>{opt.label}
              </button>
            ))}
          </div>

          {selectedReason && (
            <div className="mb-4">
              <label htmlFor="iteration-note" className="block text-[10px] text-muted uppercase tracking-[0.04em] mb-1.5">
                Nota opcional
              </label>
              <input
                id="iteration-note"
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Añade contexto sobre qué esperabas ver..."
                className="w-full bg-surface2 border border-border rounded-lg text-text text-xs px-3 py-2 outline-none focus:border-accent-blue transition-colors"
              />
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleMarkFailed}
              disabled={!selectedReason}
              className="flex-1 rounded-xl bg-gradient-to-r from-accent to-accent-blue text-black text-xs font-bold px-3 py-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
              aria-label="Aplicar ajuste automático al prompt"
            >
              Ajustar automáticamente
            </button>
            <button
              type="button"
              onClick={() => { setShowFeedback(false); setSelectedReason(null); setNote('') }}
              className="px-3 py-2 text-xs text-muted hover:text-label transition-colors"
              aria-label="Cancelar feedback"
            >
              Cancelar
            </button>
          </div>

          {selectedReason && (
            <p className="mt-3 text-[10px] text-muted leading-relaxed">
              💡 Se ajustarán automáticamente los campos relevantes del builder.
            </p>
          )}
        </div>
      )}

      {/* Clear all */}
      {iterations.length > 0 && (
        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={onClearAll}
            className="flex items-center gap-1 text-[10px] text-muted hover:text-label transition-colors"
            aria-label="Limpiar historial de iteraciones"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            Empezar de cero
          </button>
        </div>
      )}
    </div>
  )
}

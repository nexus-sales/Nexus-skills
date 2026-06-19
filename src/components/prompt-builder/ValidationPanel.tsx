'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, ClipboardCheck, Copy, Target, XCircle } from 'lucide-react'
import { VALIDATION_CASES } from '@/constants/validation-cases'
import { evaluatePromptAgainstCase, findBestValidationCase } from '@/lib/prompt-validation'
import type { PromptFormState } from '@/types/prompt'

interface ValidationPanelProps {
  prompt: string
  state: PromptFormState
}

const LEVEL_LABEL: Record<'fuerte' | 'aceptable' | 'debil', string> = {
  fuerte: 'Fuerte',
  aceptable: 'Aceptable',
  debil: 'Debil',
}

export function ValidationPanel({ prompt, state }: ValidationPanelProps) {
  const suggestedCase = useMemo(
    () => findBestValidationCase(state, VALIDATION_CASES),
    [state]
  )
  const [caseId, setCaseId] = useState(suggestedCase.id)
  const [copied, setCopied] = useState(false)

  const validationCase = VALIDATION_CASES.find((item) => item.id === caseId) ?? suggestedCase
  const report = useMemo(
    () => evaluatePromptAgainstCase(prompt, state, validationCase),
    [prompt, state, validationCase]
  )

  if (!prompt.trim()) return null

  const improvement = report.score - report.baselineScore

  const handleCopyEvaluator = async () => {
    await navigator.clipboard.writeText(report.evaluatorPrompt)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-accent-blue/20 bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-accent-blue" aria-hidden="true" />
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent-blue">
            validacion objetiva
          </span>
        </div>
        <span className={`rounded-md border px-2 py-1 font-mono text-[10px] uppercase ${
          report.level === 'fuerte' ? 'border-accent/30 text-accent' :
          report.level === 'aceptable' ? 'border-yellow-400/30 text-yellow-300' :
          'border-red-400/30 text-red-300'
        }`}>
          {LEVEL_LABEL[report.level]}
        </span>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div>
          <label htmlFor="validation-case" className="mb-1.5 block text-[10px] uppercase tracking-wide text-muted">
            Caso benchmark
          </label>
          <select
            id="validation-case"
            value={caseId}
            onChange={(event) => setCaseId(event.target.value)}
            className="w-full rounded-lg border border-border bg-surface2 px-3 py-2 text-[12px] text-text outline-none transition-colors focus:border-accent-blue"
            aria-label="Seleccionar caso de validacion"
          >
            {VALIDATION_CASES.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">{validationCase.description}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Metric label="Prompt" value={`${report.score}%`} tone="blue" />
          <Metric label="Baseline" value={`${report.baselineScore}%`} tone="muted" />
          <Metric
            label="Mejora"
            value={`${improvement >= 0 ? '+' : ''}${improvement}`}
            tone={improvement > 0 ? 'green' : 'red'}
          />
        </div>

        <div className="rounded-xl border border-border bg-surface2/60 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-label">Rubrica cubierta</p>
          </div>
          <div className="space-y-2">
            {report.criteria.map((criterion) => (
              <div key={criterion.id} className="flex items-start gap-2">
                {criterion.matched
                  ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-label="Criterio cubierto" />
                  : <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" aria-label="Criterio pendiente" />}
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-text">{criterion.label} <span className="font-mono text-[10px] text-muted">({criterion.weight})</span></p>
                  <p className="text-[10px] leading-relaxed text-muted">{criterion.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {report.gaps.length > 0 && (
          <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-yellow-300">Huecos antes de confiar</p>
            <ul className="space-y-1.5">
              {report.gaps.slice(0, 4).map((gap) => (
                <li key={gap} className="text-[11px] leading-relaxed text-label">- {gap}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={handleCopyEvaluator}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-accent-blue/30 bg-accent-blue/10 px-3 text-xs font-bold text-accent-blue transition-colors hover:border-accent-blue"
          aria-label="Copiar prompt evaluador para validar la respuesta real"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          {copied ? 'Evaluador copiado' : 'Copiar evaluador'}
        </button>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'blue' | 'green' | 'red' | 'muted'
}) {
  const toneClass = {
    blue: 'text-accent-blue',
    green: 'text-accent',
    red: 'text-red-300',
    muted: 'text-muted',
  }[tone]

  return (
    <div className="rounded-xl border border-border bg-surface2 p-3 text-center">
      <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className={`font-mono text-sm font-bold ${toneClass}`}>{value}</p>
    </div>
  )
}

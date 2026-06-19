'use client'
import { useState, useRef, useEffect } from 'react'
import { ArrowRight, Sparkles, X } from 'lucide-react'
import { matchTemplate } from '@/lib/template-matcher'
import type { MatchResult } from '@/lib/template-matcher'
import type { PromptFormState } from '@/types/prompt'

interface Step {
  id: number
  question: string
  placeholder: string
  field: keyof Pick<PromptFormState, 'tarea' | 'destino' | 'restriccion' | 'stack'>
  hint: string
  optional?: boolean
}

const STEPS: Step[] = [
  {
    id: 1,
    question: '¿Qué quieres conseguir?',
    placeholder: 'Ej: revisar el código de mi app, escribir un email a un cliente, crear un system prompt para un agente...',
    field: 'tarea',
    hint: 'Descríbelo como se lo explicarías a un compañero. Sin tecnicismos.',
  },
  {
    id: 2,
    question: '¿Quién va a leer el resultado?',
    placeholder: 'Ej: yo mismo (developer), mi cliente (no técnico), mi equipo de ventas...',
    field: 'destino',
    hint: 'Esto define el tono y nivel de detalle del prompt.',
  },
  {
    id: 3,
    question: '¿Hay algo que el modelo NO debe hacer o asumir?',
    placeholder: 'Ej: no cambies lo que ya funciona, no uses librerías externas, no inventes datos...',
    field: 'restriccion',
    hint: 'Si no tienes restricciones, escribe "ninguna" y continuamos.',
  },
  {
    id: 4,
    question: '¿Qué stack o herramientas usas?',
    placeholder: 'Ej: React, Next.js, Supabase... o "no aplica"',
    field: 'stack',
    hint: 'Opcional. Si es una tarea de código, ayuda a afinar el prompt considerablemente.',
    optional: true,
  },
]

interface ElicitationFlowProps {
  onComplete: (patch: Partial<PromptFormState>) => void
  onSkip: () => void
}

export function ElicitationFlow({ onComplete, onSkip }: ElicitationFlowProps) {
  const progressRef = useRef<HTMLDivElement>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Partial<PromptFormState>>({})

  useEffect(() => {
    progressRef.current?.style.setProperty(
      '--elicit-progress',
      `${((currentStep + 1) / STEPS.length) * 100}%`
    )
  }, [currentStep])
  const [input, setInput] = useState('')
  const [templateSuggestion, setTemplateSuggestion] = useState<MatchResult | null>(null)

  const step = STEPS[currentStep]
  const isLast = currentStep === STEPS.length - 1

  const finish = (finalAnswers: Partial<PromptFormState>) => {
    onComplete({ ...finalAnswers, ...inferFieldsFromAnswers(finalAnswers) })
  }

  const handleNext = () => {
    const val = input.trim()
    if (!val && !step.optional) return

    const newAnswers: Partial<PromptFormState> = {
      ...answers,
      ...(val ? { [step.field]: val } : {}),
    }
    setAnswers(newAnswers)
    setInput('')

    // After first question, look for a template match
    if (currentStep === 0 && val) {
      const match = matchTemplate(val)
      if (match) {
        setTemplateSuggestion(match)
        return // pause to show suggestion
      }
    }

    if (isLast) {
      finish(newAnswers)
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const continueAfterSuggestion = () => {
    setTemplateSuggestion(null)
    if (isLast) {
      finish(answers)
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  // ── Template suggestion screen ─────────────────────────────────────────────
  if (templateSuggestion) {
    return (
      <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5 mb-4">
        <p className="text-xs text-muted mb-3">💡 Tenemos una plantilla para esto:</p>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl" aria-hidden="true">{templateSuggestion.icon}</span>
          <div>
            <p className="text-sm font-bold text-text">{templateSuggestion.displayName}</p>
            <p className="text-xs text-muted mt-0.5">{templateSuggestion.reason}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onComplete(templateSuggestion.template)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-accent to-accent-blue text-black text-xs font-bold px-4 py-2.5 active:scale-[0.98] transition-all"
            aria-label={`Usar plantilla ${templateSuggestion.displayName}`}
          >
            Usar esta plantilla
          </button>
          <button
            type="button"
            onClick={continueAfterSuggestion}
            className="flex-1 inline-flex items-center justify-center rounded-xl border border-border bg-surface2 text-text text-xs font-bold px-4 py-2.5 hover:border-accent-blue/40 transition-colors"
            aria-label="Continuar con el asistente sin usar la plantilla"
          >
            Continuar sin ella
          </button>
        </div>
      </div>
    )
  }

  // ── Conversational steps ───────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-border bg-surface/70 p-5 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" aria-hidden="true" />
          <span className="text-sm font-bold text-text">Asistente de Prompt</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-muted">{currentStep + 1} / {STEPS.length}</span>
          <button
            type="button"
            onClick={onSkip}
            className="flex items-center gap-1 text-xs text-muted hover:text-label transition-colors"
            aria-label="Saltar el asistente y rellenar manualmente"
          >
            <X className="w-3 h-3" aria-hidden="true" />
            Modo manual
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-1 bg-border rounded-full mb-5"
        role="progressbar"
        aria-label={`Paso ${currentStep + 1} de ${STEPS.length}`}
      >
        <div
          ref={progressRef}
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-blue transition-all duration-500 [width:var(--elicit-progress)]"
        />
      </div>

      {/* Previous answers summary */}
      {currentStep > 0 && (
        <div className="mb-4 space-y-1.5">
          {STEPS.slice(0, currentStep).map(s => {
            const val = answers[s.field] as string | undefined
            if (!val) return null
            return (
              <div key={s.id} className="flex items-start gap-2 text-xs text-muted">
                <span className="text-accent mt-0.5 shrink-0">✓</span>
                <span className="italic truncate">{val}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Active question */}
      <div className="mb-4">
        <h3 className="text-base font-bold text-text mb-1">{step.question}</h3>
        <p className="text-xs text-muted mb-3">{step.hint}</p>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleNext()
            }
          }}
          placeholder={step.placeholder}
          rows={3}
          className="w-full bg-surface2 border border-border rounded-xl text-text text-sm p-3 outline-none resize-none focus:border-accent-blue transition-colors"
          aria-label={step.question}
          autoFocus
        />
        <p className="text-[10px] text-muted mt-1.5">
          Enter para continuar · Shift+Enter para nueva línea
          {step.optional && ' · Campo opcional — pulsa continuar para omitir'}
        </p>
      </div>

      <button
        type="button"
        onClick={handleNext}
        disabled={!input.trim() && !step.optional}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-accent to-accent-blue text-black text-sm font-bold px-5 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
        aria-label={isLast ? 'Generar prompt con estas respuestas' : 'Siguiente pregunta'}
      >
        {isLast ? (
          <>Generar prompt <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /></>
        ) : (
          <>Siguiente <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" /></>
        )}
      </button>
    </div>
  )
}

// ── Inference logic ────────────────────────────────────────────────────────────

function inferFieldsFromAnswers(answers: Partial<PromptFormState>): Partial<PromptFormState> {
  const tarea = (answers.tarea ?? '').toLowerCase()
  const destino = (answers.destino ?? '').toLowerCase()

  let rol = ''
  const techniques: Partial<PromptFormState> = { neg: true }
  let outputType = 'respuesta directa y concisa sin introducción ni relleno'
  let tono = 'profesional y directo, sin florituras ni relleno'

  if (/\b(código|code|bug|fix|componente|refactor|hook|api|typescript|react|next\.?js|supabase)\b/i.test(tarea)) {
    rol = 'Eres un senior developer especialista en React, TypeScript y arquitectura de aplicaciones web'
    techniques.cot = true
    techniques.xml = true
    outputType = 'código listo para copiar, sin explicaciones adicionales'
    tono = 'técnico y preciso, asumiendo que el lector tiene conocimiento del área'
  } else if (/\b(email|correo|propuesta|comercial|venta)\b/i.test(tarea)) {
    rol = 'Eres un copywriter B2B especialista en comunicación comercial para PYME'
    techniques.pre = true
    outputType = 'respuesta directa y concisa sin introducción ni relleno'
    tono = 'comercial y persuasivo, orientado a la venta y al beneficio del cliente'
  } else if (/\b(informe|documento|análisis|auditoría|report)\b/i.test(tarea)) {
    rol = 'Eres un consultor senior especialista en análisis técnico y redacción de informes profesionales'
    techniques.cot = true
    techniques.xml = true
    outputType = 'informe estructurado con secciones y subsecciones numeradas'
    tono = 'profesional y directo, sin florituras ni relleno'
  } else if (/\b(prompt|agente|system\s*prompt|inteligencia\s+artificial|llm)\b/i.test(tarea)) {
    rol = 'Eres un arquitecto de sistemas de IA especialista en diseño de prompts y agentes de producción'
    techniques.sc = true
    techniques.ej = true
    outputType = 'código listo para copiar, sin explicaciones adicionales'
    tono = 'técnico y preciso, asumiendo que el lector tiene conocimiento del área'
  } else {
    rol = 'Eres un experto senior en el dominio de la tarea solicitada'
    techniques.cot = true
  }

  if (/\b(cliente|no\s+técnico|pyme|directivo|jefe)\b/i.test(destino)) {
    tono = 'profesional y directo, sin florituras ni relleno'
  } else if (/\b(developer|técnico|equipo)\b/i.test(destino) || /yo\s+mismo/i.test(destino)) {
    tono = 'técnico y preciso, asumiendo que el lector tiene conocimiento del área'
  }

  return { rol, outputType, tono, ...techniques }
}

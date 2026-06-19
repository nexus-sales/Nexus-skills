'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Loader2, Sparkles } from 'lucide-react'

interface IdeaInputProps {
  idea: string
  setIdea: Dispatch<SetStateAction<string>>
  generateSystem: () => void
  isGenerating: boolean
}

const EXAMPLES = [
  'Automatizar seguimiento comercial',
  'Crear documentación técnica de un proyecto',
  'Diseñar un asistente de soporte al cliente',
  'Crear campañas de marketing para redes sociales',
]

export function IdeaInput({ idea, setIdea, generateSystem, isGenerating }: IdeaInputProps) {
  return (
    <section className="mx-auto w-full max-w-3xl rounded-[8px] border border-border/70 bg-surface p-4 shadow-sm sm:p-6">
      <label htmlFor="nexus-idea" className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-muted">
        Idea inicial
      </label>
      <textarea
        id="nexus-idea"
        value={idea}
        onChange={(event) => setIdea(event.target.value)}
        placeholder="Ejemplo: quiero automatizar el seguimiento de clientes potenciales"
        rows={5}
        className="min-h-[180px] w-full resize-y rounded-[8px] border border-border bg-surface2 px-4 py-3 text-[15px] leading-relaxed text-text outline-none transition-colors placeholder:text-muted/60 focus:border-accent-blue sm:min-h-[160px]"
        aria-label="Idea inicial para generar un sistema Nexus"
      />

      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">Ejemplos</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setIdea(example)}
                className="rounded-[8px] border border-border bg-bg px-3 py-2 text-left text-xs text-label transition-colors hover:border-accent-blue/40 hover:text-text"
                aria-label={`Usar ejemplo ${example}`}
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full shrink-0 sm:w-auto">
          <button
            type="button"
            onClick={generateSystem}
            disabled={isGenerating}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-accent-blue px-6 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            aria-label="Crear sistema Nexus"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            )}
            Crear sistema
          </button>
          <p className="mt-2 text-center text-xs leading-relaxed text-muted sm:max-w-[220px] sm:text-left">
            No necesitas saber escribir prompts. Empieza con una idea.
          </p>
        </div>
      </div>
    </section>
  )
}

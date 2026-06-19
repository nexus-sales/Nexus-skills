import type { TargetModel } from '@/types/prompt'

interface ModelAdvice {
  label: string
  tips: string[]
  avoid: string[]
  badge: string
}

const ADVICE: Record<TargetModel, ModelAdvice> = {
  universal: {
    label: 'Universal',
    badge: '🤖',
    tips: [
      'Usa etiquetas XML para separar secciones claramente',
      'Define rol y tarea en las primeras líneas',
      'Especifica el formato de salida exacto',
    ],
    avoid: [
      'Prompts demasiado largos sin estructura',
      'Instrucciones ambiguas o contradictorias',
    ],
  },
  claude: {
    label: 'Claude (Anthropic)',
    badge: '🎭',
    tips: [
      'Usa <role>, <task>, <context> como etiquetas XML — Claude las respeta bien',
      'Pide razonamiento explícito antes de la respuesta final',
      'Claude sigue restricciones negativas ("no hagas X") con precisión',
      'El bloque <thinking> internal mejora la calidad sin añadir verborrea',
    ],
    avoid: [
      'Sobrecargar con instrucciones redundantes',
      'Pedir que "finja" ser otro modelo',
    ],
  },
  gemini: {
    label: 'Gemini (Google)',
    badge: '♊',
    tips: [
      'Gemini responde bien a formatos Markdown estructurados',
      'Usa ejemplos concretos (few-shot) para guiar el formato',
      'Especifica longitud deseada — Gemini tiende a ser verboso',
      'Funciona bien con prompts en inglés para tareas técnicas',
    ],
    avoid: [
      'Instrucciones muy largas sin separación clara',
      'Asumir que sigue restricciones implícitas',
    ],
  },
  gpt4: {
    label: 'GPT-4 (OpenAI)',
    badge: '🧠',
    tips: [
      'GPT-4 responde mejor a instrucciones en el system prompt',
      'Usa "You are..." al inicio para establecer el rol',
      'Los ejemplos few-shot mejoran significativamente la consistencia',
      'Especifica temperatura deseada en el contexto si la calidad varía',
    ],
    avoid: [
      'Dejar el system prompt vacío para tareas complejas',
      'Pedir múltiples tareas incompatibles en un solo prompt',
    ],
  },
  deepseek: {
    label: 'DeepSeek (Reasoning)',
    badge: '🐋',
    tips: [
      'DeepSeek-R1 brilla en razonamiento matemático y código',
      'Activa CoT explícitamente: pide "piensa paso a paso antes de responder"',
      'Ideal para debugging, algoritmos y análisis lógico',
      'El contexto técnico detallado mejora mucho los resultados',
    ],
    avoid: [
      'Usarlo para tareas creativas o de tono — no es su fuerte',
      'Prompts cortos sin contexto para problemas complejos',
    ],
  },
}

interface ModelAdviceGridProps {
  model: TargetModel
}

export function ModelAdviceGrid({ model }: ModelAdviceGridProps) {
  const advice = ADVICE[model]

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg" aria-hidden="true">{advice.badge}</span>
        <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text">
          Consejos para {advice.label}
        </h2>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-accent mb-1.5">Funciona bien</p>
          <ul className="space-y-1">
            {advice.tips.map(tip => (
              <li key={tip} className="flex items-start gap-1.5 text-[11px] text-label leading-relaxed">
                <span className="text-accent mt-0.5 shrink-0" aria-hidden="true">▸</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-1.5">Evitar</p>
          <ul className="space-y-1">
            {advice.avoid.map(item => (
              <li key={item} className="flex items-start gap-1.5 text-[11px] text-muted leading-relaxed">
                <span className="text-red-400 mt-0.5 shrink-0" aria-hidden="true">✕</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

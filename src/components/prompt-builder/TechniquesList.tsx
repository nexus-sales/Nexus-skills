import { useState } from 'react'
import {
  Brain, CheckCircle2, FileText, HelpCircle,
  MessageCircleQuestion, Shield, Skull, Sparkles, X, Zap,
  type LucideIcon,
} from 'lucide-react'
import type { PromptTemplate } from '@/types/prompt'

interface TechBtnProps {
  onClick: () => void
  className: string
  Icon: LucideIcon
  label: string
  hint: string
}

function TechniqueButtonOn({ onClick, className, Icon, label, hint }: TechBtnProps) {
  return (
    <button type="button" onClick={onClick} className={className} aria-pressed="true" aria-label={`${label}: ${hint}`}>
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span>
        <span className="block text-[11px] font-bold uppercase tracking-wider">{label}</span>
        <span className="block text-[10px] text-muted opacity-80">{hint}</span>
      </span>
    </button>
  )
}

function TechniqueButtonOff({ onClick, className, Icon, label, hint }: TechBtnProps) {
  return (
    <button type="button" onClick={onClick} className={className} aria-pressed="false" aria-label={`${label}: ${hint}`}>
      <Icon className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
      <span>
        <span className="block text-[11px] font-bold uppercase tracking-wider">{label}</span>
        <span className="block text-[10px] text-muted opacity-80">{hint}</span>
      </span>
    </button>
  )
}

type TechKey = 'devil' | 'cot' | 'crit' | 'xml' | 'sc' | 'neg' | 'ej' | 'pre' | 'int'

interface TechniquesListProps {
  state: Pick<PromptTemplate, TechKey>
  onToggle: (key: TechKey, value: boolean) => void
}

const TECHNIQUES: {
  key: TechKey
  label: string
  hint: string
  icon: LucideIcon
  tone: 'red' | 'blue' | 'purple' | 'green'
  help: string
}[] = [
  { key: 'devil', label: 'Modo Diablo',       hint: 'Revision hostil y esceptica',      icon: Skull,                tone: 'red',    help: 'Usalo para auditorias y propuestas donde quieras detectar riesgos, supuestos debiles y contraejemplos.' },
  { key: 'cot',   label: 'Razonamiento CoT',  hint: 'Analisis interno paso a paso',     icon: Brain,                tone: 'blue',   help: 'Usalo en bugs dificiles, arquitectura y analisis complejos.' },
  { key: 'crit',  label: 'Auto-Critica',      hint: 'Validacion final del output',      icon: Shield,               tone: 'purple', help: 'Obliga al modelo a revisar su borrador antes de entregar.' },
  { key: 'xml',   label: 'Etiquetas XML',     hint: 'Salida estructurada y limpia',     icon: FileText,             tone: 'green',  help: 'Usalo para bloques claros y reutilizables.' },
  { key: 'sc',    label: 'Solo Respuesta',    hint: 'Oculta proceso y razonamiento',    icon: CheckCircle2,         tone: 'blue',   help: 'Ideal para entregables a cliente, mantiene el analisis fuera de la respuesta.' },
  { key: 'neg',   label: 'Restricciones',     hint: 'Evita relleno y cambios fuera de scope', icon: Shield,         tone: 'purple', help: 'Define que no debe hacer el modelo.' },
  { key: 'ej',    label: 'Ejemplo Formato',   hint: 'Incluye patron imitable',          icon: Sparkles,             tone: 'green',  help: 'El modelo imitara la estructura exacta del ejemplo.' },
  { key: 'pre',   label: 'Sin Preambulo',     hint: 'Empieza directo con la respuesta', icon: Zap,                  tone: 'blue',   help: 'Corta frases de relleno desde la primera linea.' },
  { key: 'int',   label: 'Preguntar Primero', hint: 'Hasta 3 preguntas si falta contexto', icon: MessageCircleQuestion, tone: 'purple', help: 'Fuerza al modelo a pedir contexto si faltan datos criticos.' },
]

export function TechniquesList({ state, onToggle }: TechniquesListProps) {
  const [openHelp, setOpenHelp] = useState<TechKey | null>(null)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {TECHNIQUES.map(({ key, label, hint, icon: Icon, tone, help }) => {
        const isActive = Boolean(state[key])
        const activeClass =
          tone === 'red'    ? 'border-red-500/50 bg-red-500/10 text-red-100' :
          tone === 'purple' ? 'border-accent-purple/50 bg-accent-purple/10 text-accent-purple' :
          tone === 'green'  ? 'border-accent/50 bg-accent/10 text-accent' :
                              'border-accent-blue/50 bg-accent-blue/10 text-accent-blue'
        const btnBase = 'flex min-h-[86px] w-full items-center gap-3 rounded-xl border p-3 pr-11 text-left transition-all'
        const toggle = () => onToggle(key, !state[key])

        return (
          <div key={key} className="relative">
            {isActive
              ? <TechniqueButtonOn onClick={toggle} className={`${btnBase} ${activeClass}`} Icon={Icon} label={label} hint={hint} />
              : <TechniqueButtonOff onClick={toggle} className={`${btnBase} border-border bg-surface hover:border-accent-blue/30`} Icon={Icon} label={label} hint={hint} />
            }
            <button
              type="button"
              onClick={() => setOpenHelp(openHelp === key ? null : key)}
              aria-label={`Ayuda de tecnica ${label}`}
              className={`absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-lg border text-muted transition-colors ${openHelp === key ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-border bg-surface2 hover:border-accent-blue/40 hover:text-accent-blue'}`}
            >
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            {openHelp === key && (
              <div className="absolute left-0 right-0 top-2 z-30 rounded-xl border border-accent-blue/30 bg-surface3 p-3 pr-9 shadow-2xl">
                <button
                  type="button"
                  onClick={() => setOpenHelp(null)}
                  aria-label="Cerrar ayuda"
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-surface2"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <p className="mb-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-accent-blue">{label}</p>
                <p className="text-[11px] leading-relaxed text-label">{help}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

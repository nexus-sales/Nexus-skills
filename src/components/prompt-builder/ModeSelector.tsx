'use client'
import { Zap, MessageCircle, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AppMode } from '@/types/prompt'

interface ModeSelectorProps {
  mode: AppMode
  onMode: (m: AppMode) => void
}

const MODES = [
  {
    id: 'quick' as AppMode,
    Icon: Zap,
    label: 'Rápido',
    desc: 'Elige plantilla → rellena solo lo necesario',
  },
  {
    id: 'guided' as AppMode,
    Icon: MessageCircle,
    label: 'Asistente',
    desc: '3 preguntas → prompt automático',
  },
  {
    id: 'expert' as AppMode,
    Icon: Settings2,
    label: 'Experto',
    desc: 'Todos los campos — control total',
  },
] as const

export function ModeSelector({ mode, onMode }: ModeSelectorProps) {
  return (
    <div
      className="flex gap-2 p-1 bg-surface rounded-xl border border-border mb-4"
      role="tablist"
      aria-label="Modo de construcción del prompt"
    >
      {MODES.map(({ id, Icon, label, desc }) => (
        <button
          key={id}
          role="tab"
          aria-selected={mode === id}
          aria-label={`Modo ${label}: ${desc}`}
          onClick={() => onMode(id)}
          className={cn(
            'flex-1 flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg text-xs font-medium transition-all',
            mode === id
              ? 'bg-surface2 text-text shadow-sm'
              : 'text-muted hover:text-label'
          )}
        >
          <span className={cn(
            'flex items-center gap-1.5 font-bold',
            mode === id ? 'text-accent' : 'text-muted'
          )}>
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            {label}
          </span>
          <span className="text-[10px] text-center leading-tight text-muted hidden sm:block">
            {desc}
          </span>
        </button>
      ))}
    </div>
  )
}

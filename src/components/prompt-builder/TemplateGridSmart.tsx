'use client'
import {
  ShieldAlert, Bug, Code2, RefreshCcw, Bot, FileText,
  Briefcase, Mail, Link as LinkIcon, Lock, Calendar,
  BarChart3, Rocket, Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PromptTemplate } from '@/types/prompt'

const ICON_MAP: Record<string, LucideIcon> = {
  audit: ShieldAlert, fix: Bug, componente: Code2, refactor: RefreshCcw,
  sysprompt: Bot, doc: FileText, propuesta: Briefcase, email: Mail,
  linkedin: LinkIcon, nis2: Lock, sprint: Calendar, analisis: BarChart3,
  conversion: Rocket, app_existente: Wrench,
}

const TEMPLATE_LABELS: Record<string, string> = {
  audit: 'Auditar', fix: 'Fix Bug', componente: 'Componente', refactor: 'Refactor',
  conversion: 'HTML→Next', sysprompt: 'SysPrompt', doc: 'Documento',
  propuesta: 'Propuesta', email: 'Email', linkedin: 'LinkedIn',
  nis2: 'NIS2', sprint: 'Sprint', analisis: 'Análisis', app_existente: 'App creada',
}

interface TemplateGridSmartProps {
  templates: Record<string, PromptTemplate>
  activeId: string | null
  onSelect: (id: string) => void
}

export function TemplateGridSmart({ templates, activeId, onSelect }: TemplateGridSmartProps) {
  return (
    <div
      className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 mb-4"
      role="listbox"
      aria-label="Seleccionar plantilla de prompt"
    >
      {Object.entries(templates).map(([id, tpl]) => {
        const Icon = ICON_MAP[id] ?? Code2
        const label = TEMPLATE_LABELS[id] ?? tpl.name?.slice(0, 12) ?? id.slice(0, 10)
        const isActive = activeId === id
        const requiredCount = tpl.visibleFields?.filter(f => f.status === 'required').length ?? 0
        const isCustom = id.startsWith('custom-')

        return (
          <button
            key={id}
            role="option"
            aria-selected={isActive}
            onClick={() => onSelect(id)}
            className={cn(
              'flex flex-col items-center text-center p-2.5 rounded-xl border transition-all',
              isActive
                ? 'border-accent-blue bg-accent-blue/10 shadow-sm'
                : 'border-border bg-surface hover:border-accent-blue/40 hover:bg-accent-blue/5'
            )}
            aria-label={`Plantilla ${label}${tpl.quickSummary ? ': ' + tpl.quickSummary : ''}`}
          >
            <Icon
              className={cn('w-5 h-5 mb-1', isActive ? 'text-accent-blue' : 'text-muted')}
              aria-hidden="true"
            />
            <span className={cn(
              'text-[10px] font-bold uppercase tracking-tight leading-tight mb-1',
              isActive ? 'text-text' : 'text-muted'
            )}>
              {label}
            </span>
            <span className={cn(
              'text-[9px] px-1.5 py-0.5 rounded-full border leading-none',
              requiredCount === 0
                ? 'bg-accent/5 border-accent/20 text-accent'
                : requiredCount === 1
                ? 'bg-accent-blue/5 border-accent-blue/20 text-accent-blue'
                : 'bg-surface2 border-border text-muted'
            )}>
              {requiredCount === 0 ? 'pega y listo' : requiredCount === 1 ? '1 campo' : `${requiredCount} campos`}
            </span>
            {isCustom && (
              <span className="mt-0.5 font-mono text-[8px] text-accent/60 uppercase">custom</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

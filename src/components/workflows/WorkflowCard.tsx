import Link from 'next/link'
import { Pencil, Trash2, Play } from 'lucide-react'
import type { Workflow } from '@/types/prompt'

interface WorkflowCardProps {
  workflow: Workflow
  onEdit: () => void
  onDelete: () => void
}

const STEP_TYPE_COLORS: Record<string, string> = {
  skill:  'bg-accent-purple/10 text-accent-purple border-accent-purple/30',
  agent:  'bg-accent-blue/10 text-accent-blue border-accent-blue/30',
  prompt: 'bg-accent/10 text-accent border-accent/30',
}

export function WorkflowCard({ workflow, onEdit, onDelete }: WorkflowCardProps) {
  return (
    <article
      className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-accent/30 transition-colors"
      aria-label={`Workflow: ${workflow.name}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-2xl shrink-0" aria-hidden="true">{workflow.icon}</span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-text">{workflow.name}</h3>
            <p className="text-xs text-muted mt-0.5 line-clamp-2">{workflow.description}</p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface2 border border-border text-muted shrink-0">
          {workflow.steps.length} paso{workflow.steps.length !== 1 ? 's' : ''}
        </span>
      </div>

      {workflow.steps.length > 0 && (
        <ol className="flex flex-wrap gap-1.5" aria-label="Pasos del workflow">
          {workflow.steps.slice(0, 5).map((step, i) => (
            <li
              key={step.id}
              className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${STEP_TYPE_COLORS[step.type] ?? 'bg-surface2 text-muted border-border'}`}
            >
              <span className="font-mono">{i + 1}.</span>
              <span>{step.label}</span>
            </li>
          ))}
          {workflow.steps.length > 5 && (
            <li className="text-[10px] text-muted px-2 py-0.5">+{workflow.steps.length - 5} más</li>
          )}
        </ol>
      )}

      <div className="flex gap-1.5 mt-auto pt-2 border-t border-border">
        <Link
          href={`/workflows/${workflow.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold bg-gradient-to-r from-accent to-accent-blue text-black px-3 py-1.5 rounded-lg"
          aria-label={`Ejecutar workflow ${workflow.name}`}
        >
          <Play className="w-3.5 h-3.5" aria-hidden="true" />
          Ejecutar
        </Link>
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 rounded-lg border border-border text-muted hover:border-accent-blue/40 hover:text-accent-blue transition-colors"
          aria-label={`Editar workflow ${workflow.name}`}
        >
          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded-lg border border-border text-muted hover:border-red-400/40 hover:text-red-400 transition-colors"
          aria-label={`Eliminar workflow ${workflow.name}`}
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}

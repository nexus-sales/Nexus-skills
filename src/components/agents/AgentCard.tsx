import Link from 'next/link'
import { Play, Trash2, Pencil } from 'lucide-react'
import type { Agent } from '@/types/prompt'

interface AgentCardProps {
  agent: Agent
  onEdit?: () => void
  onDelete?: () => void
}

export function AgentCard({ agent, onEdit, onDelete }: AgentCardProps) {
  return (
    <article
      className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-accent/30 transition-colors"
      aria-label={`Agente: ${agent.name}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl shrink-0" aria-hidden="true">{agent.icon}</span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-text">{agent.name}</h3>
            <p className="text-xs text-muted mt-0.5 line-clamp-2">{agent.description}</p>
          </div>
        </div>
        {!agent.isCustom && (
          <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent">
            NEXUS
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {agent.techniques.map(t => (
          <span
            key={t}
            className="text-[10px] px-2 py-0.5 rounded-full bg-surface2 border border-border text-muted"
          >
            {t}
          </span>
        ))}
        {agent.skillIds?.length > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-accent-purple">
            {agent.skillIds.length} skill{agent.skillIds.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex gap-2 mt-auto pt-2 border-t border-border">
        <Link
          href={`/agentes/${agent.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-accent to-accent-blue text-black text-xs font-bold px-3 py-2 rounded-lg"
          aria-label={`Ejecutar agente ${agent.name}`}
        >
          <Play className="w-3.5 h-3.5" aria-hidden="true" />
          Ejecutar
        </Link>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="p-2 rounded-lg border border-border text-muted hover:border-accent-blue/50 hover:text-accent-blue transition-colors"
            aria-label={`Editar agente ${agent.name}`}
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="p-2 rounded-lg border border-border text-muted hover:border-red-400/50 hover:text-red-400 transition-colors"
            aria-label={`Eliminar agente ${agent.name}`}
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </article>
  )
}

import { Download, Pencil, Trash2 } from 'lucide-react'
import type { Skill } from '@/types/prompt'
import { SKILL_CATEGORY_LABELS, SKILL_CATEGORY_COLORS } from '@/constants/skills'
import { cn } from '@/lib/utils'

const INSERT_TARGET_LABELS: Record<string, string> = {
  tarea:       '→ Tarea',
  restriccion: '→ Restricciones',
  autonomia:   '→ Autonomía',
  system:      '→ System prompt',
}

interface SkillCardProps {
  skill: Skill
  onEdit?: () => void
  onDelete?: () => void
  onExport?: () => void
  /** Si se pasa, aparece botón "Insertar" en lugar de editar/borrar */
  onInsert?: (skill: Skill) => void
  isInserted?: boolean
}

export function SkillCard({ skill, onEdit, onDelete, onExport, onInsert, isInserted }: SkillCardProps) {
  return (
    <article
      className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3 hover:border-accent/30 transition-colors"
      aria-label={`Skill: ${skill.name}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl shrink-0" aria-hidden="true">{skill.icon}</span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-text leading-tight">{skill.name}</h3>
            <p className="text-xs text-muted mt-0.5 line-clamp-2">{skill.description}</p>
          </div>
        </div>
        {skill.isPredefined && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded shrink-0 bg-accent/10 border border-accent/20 text-accent">
            NEXUS
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', SKILL_CATEGORY_COLORS[skill.category])}>
          {SKILL_CATEGORY_LABELS[skill.category] ?? skill.category}
        </span>
        <span className="text-[10px] text-muted bg-surface2 border border-border px-2 py-0.5 rounded-full">
          {INSERT_TARGET_LABELS[skill.insertTarget] ?? skill.insertTarget}
        </span>
      </div>

      <p className="text-[11px] text-muted font-mono bg-surface2 border border-border rounded-lg px-3 py-2 line-clamp-3 whitespace-pre-wrap">
        {skill.content}
      </p>

      <div className="flex gap-1.5 mt-auto pt-1 border-t border-border">
        {onInsert && (
          <button
            onClick={() => onInsert(skill)}
            disabled={isInserted}
            className={cn(
              'flex-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors',
              isInserted
                ? 'bg-accent/10 text-accent border border-accent/30 cursor-default'
                : 'bg-gradient-to-r from-accent to-accent-blue text-black'
            )}
            aria-label={isInserted ? `Skill ${skill.name} ya insertada` : `Insertar skill ${skill.name}`}
          >
            {isInserted ? '✓ Insertada' : '⚡ Insertar'}
          </button>
        )}

        {skill.isExportable && onExport && (
          <button
            onClick={onExport}
            className="p-1.5 rounded-lg border border-border text-muted hover:border-accent-blue/40 hover:text-accent-blue transition-colors"
            aria-label={`Exportar skill ${skill.name} como .instructions.md`}
            title="Exportar como .instructions.md (VS Code)"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}

        {onEdit && (
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg border border-border text-muted hover:border-accent/40 hover:text-accent transition-colors"
            aria-label={`Editar skill ${skill.name}`}
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}

        {onDelete && (
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg border border-border text-muted hover:border-red-400/40 hover:text-red-400 transition-colors"
            aria-label={`Eliminar skill ${skill.name}`}
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </article>
  )
}

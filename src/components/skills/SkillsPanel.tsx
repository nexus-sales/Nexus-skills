'use client'
import { useState } from 'react'
import { useSkills } from '@/hooks/useSkills'
import { SkillCard } from '@/components/skills/SkillCard'
import { SKILL_CATEGORY_LABELS } from '@/constants/skills'
import type { Skill, SkillCategory, SkillInsertTarget } from '@/types/prompt'
import { cn } from '@/lib/utils'
import { Zap } from 'lucide-react'

const ALL = 'all'

interface SkillsPanelProps {
  /** Insertar el contenido de la skill en el campo correspondiente del builder */
  onInsert: (target: SkillInsertTarget, content: string, skillId: string) => void
  /** IDs de skills ya insertadas (para feedback visual) */
  insertedIds?: string[]
}

export function SkillsPanel({ onInsert, insertedIds = [] }: SkillsPanelProps) {
  const { allSkills, exportAsInstructions } = useSkills()
  const [open, setOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<SkillCategory | typeof ALL>(ALL)

  const categories = [ALL, ...Object.keys(SKILL_CATEGORY_LABELS)] as (SkillCategory | typeof ALL)[]

  const filtered = activeCategory === ALL
    ? allSkills
    : allSkills.filter(s => s.category === activeCategory)

  return (
    <div className="rounded-2xl border border-border bg-surface/70">
      {open ? (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
          aria-expanded="true"
          aria-controls="skills-panel-content"
        >
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-purple">
            <Zap className="w-4 h-4" aria-hidden="true" />
            Skills — bloques de instrucción reutilizables
          </span>
          <span className="text-muted text-xs">▲</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
          aria-expanded="false"
          aria-controls="skills-panel-content"
        >
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-purple">
            <Zap className="w-4 h-4" aria-hidden="true" />
            Skills — bloques de instrucción reutilizables
          </span>
          <span className="text-muted text-xs">▼</span>
        </button>
      )}

      {open && (
        <div id="skills-panel-content" className="border-t border-border px-4 pb-4 pt-3">
          {/* Filtro de categorías */}
          <div className="flex flex-wrap gap-1.5 mb-4" role="group" aria-label="Filtrar skills por categoría">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'text-[10px] px-2.5 py-1 rounded-full border transition-colors',
                  activeCategory === cat
                    ? 'bg-accent-purple/10 border-accent-purple/30 text-accent-purple'
                    : 'bg-surface2 border-border text-muted hover:border-accent-purple/30 hover:text-text'
                )}

              >
                {cat === ALL ? 'Todas' : SKILL_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(skill => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onInsert={(s: Skill) => onInsert(s.insertTarget, s.content, s.id)}
                isInserted={insertedIds.includes(skill.id)}
                onExport={skill.isExportable ? () => exportAsInstructions(skill) : undefined}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-muted text-xs text-center py-4">No hay skills en esta categoría.</p>
          )}

          <p className="text-muted text-[10px] mt-3 text-center">
            Gestiona todas las skills en <a href="/skills" className="text-accent-blue hover:underline">la sección Skills</a>
          </p>
        </div>
      )}
    </div>
  )
}

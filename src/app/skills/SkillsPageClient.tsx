'use client'
import { useState } from 'react'
import { useSkills } from '@/hooks/useSkills'
import { SkillCard } from '@/components/skills/SkillCard'
import { SkillForm } from '@/components/skills/SkillForm'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { SubPageNav } from '@/components/layout/SubPageNav'
import { SKILL_CATEGORY_LABELS } from '@/constants/skills'
import type { Skill, SkillCategory } from '@/types/prompt'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const ALL = 'all'

export function SkillsPageClient() {
  const { allSkills, create, update, remove, exportAsInstructions } = useSkills()
  const [showForm, setShowForm] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [activeCategory, setActiveCategory] = useState<SkillCategory | typeof ALL>(ALL)

  const categories = [ALL, ...Object.keys(SKILL_CATEGORY_LABELS)] as (SkillCategory | typeof ALL)[]

  const filtered = activeCategory === ALL
    ? allSkills
    : allSkills.filter(s => s.category === activeCategory)

  function handleSave(data: Omit<Skill, 'id' | 'createdAt' | 'updatedAt' | 'isPredefined'>) {
    if (editingSkill) {
      update(editingSkill.id, data)
    } else {
      create(data)
    }
    setShowForm(false)
    setEditingSkill(null)
  }

  function handleEdit(skill: Skill) {
    setEditingSkill(skill)
    setShowForm(true)
  }

  function handleCancel() {
    setShowForm(false)
    setEditingSkill(null)
  }

  return (
    <AuthGuard>
      <SubPageNav />
      <main className="max-w-[780px] mx-auto px-5 py-6 pb-20">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Skills IA</h1>
            <p className="text-sm text-muted mt-1">
              Bloques de instrucción reutilizables — inserta en el builder, asigna a agentes o exporta para VS Code
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setEditingSkill(null); setShowForm(true) }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-accent to-accent-blue text-black text-xs font-bold px-3 py-2 rounded-xl"
            aria-label="Crear nueva skill"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Nueva skill
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Filtrar por categoría">
          {categories.map(cat => {
            const isActive = activeCategory === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full border transition-colors',
                  isActive
                    ? 'bg-accent/10 border-accent/30 text-accent'
                    : 'bg-surface2 border-border text-muted hover:border-accent/30 hover:text-text'
                )}
              >
                {cat === ALL ? 'Todas' : SKILL_CATEGORY_LABELS[cat]}
              </button>
            )
          })}
        </div>

        {showForm && (
          <SkillForm
            initial={editingSkill ?? undefined}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}

        {filtered.length === 0 ? (
          <p className="text-muted text-sm text-center py-10">
            No hay skills en esta categoría.{' '}
            <button
              type="button"
              onClick={() => { setEditingSkill(null); setShowForm(true) }}
              className="text-accent hover:underline"
            >
              Crea la primera
            </button>
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(skill => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onEdit={skill.isPredefined ? undefined : () => handleEdit(skill)}
                onDelete={skill.isPredefined ? undefined : () => remove(skill.id)}
                onExport={() => exportAsInstructions(skill)}
              />
            ))}
          </div>
        )}
      </main>
    </AuthGuard>
  )
}

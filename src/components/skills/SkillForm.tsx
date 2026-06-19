'use client'
import { useState, useId } from 'react'
import type { Skill, SkillCategory, SkillInsertTarget } from '@/types/prompt'
import { SKILL_CATEGORY_LABELS } from '@/constants/skills'
import { X } from 'lucide-react'

interface SkillFormProps {
  initial?: Partial<Skill>
  onSave: (data: Omit<Skill, 'id' | 'createdAt' | 'updatedAt' | 'isPredefined'>) => void
  onCancel: () => void
}

const TARGETS: { value: SkillInsertTarget; label: string }[] = [
  { value: 'tarea',       label: 'Tarea — se añade al campo Tarea' },
  { value: 'restriccion', label: 'Restricciones — se añade al campo Restricciones' },
  { value: 'autonomia',   label: 'Autonomía — se añade al campo Autonomía' },
  { value: 'system',      label: 'System prompt — para agentes' },
]

export function SkillForm({ initial, onSave, onCancel }: SkillFormProps) {
  const nameId    = useId()
  const descId    = useId()
  const iconId    = useId()
  const catId     = useId()
  const targetId  = useId()
  const contentId = useId()

  const [form, setForm] = useState({
    name:          initial?.name          ?? '',
    description:   initial?.description   ?? '',
    icon:          initial?.icon          ?? '⚡',
    category:      (initial?.category     ?? 'custom') as SkillCategory,
    insertTarget:  (initial?.insertTarget ?? 'tarea')  as SkillInsertTarget,
    content:       initial?.content       ?? '',
    isExportable:  initial?.isExportable  ?? true,
  })

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.content.trim()) return
    onSave(form)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface border border-border rounded-2xl p-5 mb-6"
      aria-label={initial?.id ? 'Editar skill' : 'Crear nueva skill'}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-text">
          {initial?.id ? 'Editar skill' : 'Nueva skill'}
        </h2>
        <button type="button" onClick={onCancel} className="text-muted hover:text-text" aria-label="Cancelar">
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Icono */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor={iconId} className="text-[11px] text-muted uppercase tracking-wide">Icono</label>
          <input
            id={iconId}
            type="text"
            maxLength={2}
            value={form.icon}
            onChange={e => set('icon', e.target.value)}
            className="bg-surface2 border border-border rounded-lg text-text text-sm px-3 py-2 outline-none focus:border-accent"
          />
        </div>

        {/* Nombre */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor={nameId} className="text-[11px] text-muted uppercase tracking-wide">Nombre *</label>
          <input
            id={nameId}
            type="text"
            required
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Ej: Razonamiento paso a paso"
            className="bg-surface2 border border-border rounded-lg text-text text-sm px-3 py-2 outline-none focus:border-accent"
          />
        </div>

        {/* Descripción */}
        <div className="col-span-2 flex flex-col gap-1.5">
          <label htmlFor={descId} className="text-[11px] text-muted uppercase tracking-wide">Descripción</label>
          <input
            id={descId}
            type="text"
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Qué hace esta skill"
            className="bg-surface2 border border-border rounded-lg text-text text-sm px-3 py-2 outline-none focus:border-accent"
          />
        </div>

        {/* Categoría */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor={catId} className="text-[11px] text-muted uppercase tracking-wide">Categoría</label>
          <select
            id={catId}
            value={form.category}
            onChange={e => set('category', e.target.value as SkillCategory)}
            className="bg-surface2 border border-border rounded-lg text-text text-sm px-3 py-2 outline-none focus:border-accent appearance-none"
            aria-label="Categoría de la skill"
          >
            {Object.entries(SKILL_CATEGORY_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {/* Target */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor={targetId} className="text-[11px] text-muted uppercase tracking-wide">Insertar en</label>
          <select
            id={targetId}
            value={form.insertTarget}
            onChange={e => set('insertTarget', e.target.value as SkillInsertTarget)}
            className="bg-surface2 border border-border rounded-lg text-text text-sm px-3 py-2 outline-none focus:border-accent appearance-none"
            aria-label="Campo destino de la skill"
          >
            {TARGETS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Contenido */}
        <div className="col-span-2 flex flex-col gap-1.5">
          <label htmlFor={contentId} className="text-[11px] text-muted uppercase tracking-wide">
            Instrucción *
          </label>
          <textarea
            id={contentId}
            required
            rows={5}
            value={form.content}
            onChange={e => set('content', e.target.value)}
            placeholder="El texto de instrucción que se añadirá al prompt..."
            className="bg-surface2 border border-border rounded-lg text-text text-sm px-3 py-2 outline-none resize-y focus:border-accent font-mono"
            aria-label="Texto de instrucción de la skill"
          />
        </div>

        {/* Exportable */}
        <div className="col-span-2 flex items-center gap-2">
          <input
            id="skill-exportable"
            type="checkbox"
            checked={form.isExportable}
            onChange={e => set('isExportable', e.target.checked)}
            className="rounded"
          />
          <label htmlFor="skill-exportable" className="text-xs text-muted">
            Permitir exportar como <code className="text-accent-blue">.instructions.md</code> (VS Code Copilot)
          </label>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
        <button
          type="submit"
          className="flex-1 bg-gradient-to-r from-accent to-accent-blue text-black text-sm font-bold px-4 py-2.5 rounded-xl"
        >
          {initial?.id ? 'Guardar cambios' : 'Crear skill'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-border text-muted text-sm hover:border-accent/30 hover:text-text transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

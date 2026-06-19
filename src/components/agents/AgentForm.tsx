'use client'

import { useState } from 'react'
import { useSkills } from '@/hooks/useSkills'
import type { Agent, TechniqueId, AutonomyLevel } from '@/types/prompt'
import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentFormProps {
  id?: string
  initial?: Agent
  onSave: (agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt' | 'isCustom'>) => void
  onCancel: () => void
}

const TECHNIQUE_OPTIONS: { value: TechniqueId; label: string }[] = [
  { value: 'cot', label: 'Razonamiento CoT' },
  { value: 'sc', label: 'Solo Respuesta' },
  { value: 'xml', label: 'Etiquetas XML' },
  { value: 'neg', label: 'Restricciones' },
  { value: 'ej', label: 'Ejemplo Formato' },
  { value: 'pre', label: 'Sin Preámbulo' },
  { value: 'int', label: 'Preguntar Primero' },
  { value: 'crit', label: 'Auto-Crítica' },
  { value: 'devil', label: 'Modo Diablo' },
]

const AUTONOMY_OPTIONS: { value: AutonomyLevel; label: string }[] = [
  { value: 'ask_first', label: 'Preguntar antes' },
  { value: 'plan_confirm', label: 'Plan y confirmación' },
  { value: 'execute_declare', label: 'Ejecutar y declarar' },
  { value: 'full_auto', label: 'Automático total' },
]

export function AgentForm({ id, initial, onSave, onCancel }: AgentFormProps) {
  const { allSkills } = useSkills()
  const isEditing = !!initial

  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '🤖')
  const [role, setRole] = useState(initial?.role ?? '')
  const [outputFormat, setOutputFormat] = useState(initial?.outputFormat ?? '')
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>(initial?.autonomyLevel ?? 'execute_declare')
  const [techniques, setTechniques] = useState<TechniqueId[]>(initial?.techniques ?? [])
  const [skillIds, setSkillIds] = useState<string[]>(initial?.skillIds ?? [])

  const toggleTechnique = (t: TechniqueId) =>
    setTechniques(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const toggleSkill = (skillId: string) =>
    setSkillIds(prev => prev.includes(skillId) ? prev.filter(x => x !== skillId) : [...prev, skillId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !role.trim()) return
    onSave({
      name: name.trim(),
      description: description.trim(),
      icon,
      role: role.trim(),
      systemPrompt: '',
      model: 'claude',
      tools: [],
      techniques,
      skillIds,
      outputFormat: outputFormat.trim(),
      autonomyLevel,
    })
  }

  return (
    <form
      id={id}
      onSubmit={handleSubmit}
      className="bg-surface border border-border rounded-2xl p-5 mb-6"
      aria-label={isEditing ? 'Editar agente' : 'Formulario de nuevo agente'}
    >
      <h2 className="text-sm font-bold text-text mb-4">
        {isEditing ? `Editar: ${initial.name}` : 'Nuevo agente personalizado'}
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Icono + Nombre */}
        <div className="sm:col-span-2 flex gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="agent-icon" className="text-[11px] text-muted uppercase tracking-[0.04em]">Icono</label>
            <input
              id="agent-icon"
              type="text"
              value={icon}
              onChange={e => setIcon(e.target.value)}
              className="w-14 bg-surface2 border border-border rounded-lg text-center text-xl px-2 py-2 outline-none focus:border-accent-blue"
              aria-label="Icono del agente"
              maxLength={2}
            />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <label htmlFor="agent-name" className="text-[11px] text-muted uppercase tracking-[0.04em]">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              id="agent-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="bg-surface2 border border-border rounded-lg text-text text-[13px] px-3 py-2 outline-none focus:border-accent-blue"
              placeholder="Ej: Revisor de código"
              aria-label="Nombre del agente"
            />
          </div>
        </div>

        {/* Descripción */}
        <div className="sm:col-span-2 flex flex-col gap-1">
          <label htmlFor="agent-description" className="text-[11px] text-muted uppercase tracking-[0.04em]">Descripción</label>
          <input
            id="agent-description"
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="bg-surface2 border border-border rounded-lg text-text text-[13px] px-3 py-2 outline-none focus:border-accent-blue"
            placeholder="Qué hace este agente..."
            aria-label="Descripción del agente"
          />
        </div>

        {/* Rol / System prompt */}
        <div className="sm:col-span-2 flex flex-col gap-1">
          <label htmlFor="agent-role" className="text-[11px] text-muted uppercase tracking-[0.04em]">
            Rol / System prompt <span className="text-red-400">*</span>
          </label>
          <textarea
            id="agent-role"
            rows={3}
            value={role}
            onChange={e => setRole(e.target.value)}
            required
            className="bg-surface2 border border-border rounded-lg text-text text-[13px] px-3 py-2 outline-none resize-none focus:border-accent-blue"
            placeholder="Eres un experto en..."
            aria-label="Rol del agente"
          />
        </div>

        {/* Formato salida */}
        <div className="flex flex-col gap-1">
          <label htmlFor="agent-output" className="text-[11px] text-muted uppercase tracking-[0.04em]">Formato de salida</label>
          <input
            id="agent-output"
            type="text"
            value={outputFormat}
            onChange={e => setOutputFormat(e.target.value)}
            className="bg-surface2 border border-border rounded-lg text-text text-[13px] px-3 py-2 outline-none focus:border-accent-blue"
            placeholder="Informe estructurado, código..."
            aria-label="Formato de salida del agente"
          />
        </div>

        {/* Autonomía */}
        <div className="flex flex-col gap-1">
          <label htmlFor="agent-autonomy" className="text-[11px] text-muted uppercase tracking-[0.04em]">Nivel de autonomía</label>
          <select
            id="agent-autonomy"
            value={autonomyLevel}
            onChange={e => setAutonomyLevel(e.target.value as AutonomyLevel)}
            className="bg-surface2 border border-border rounded-lg text-text text-[13px] px-3 py-2 outline-none focus:border-accent-blue"
            aria-label="Nivel de autonomía del agente"
          >
            {AUTONOMY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Técnicas */}
        <div className="sm:col-span-2">
          <p className="text-[11px] text-muted uppercase tracking-[0.04em] mb-2">Técnicas activas</p>
          <div className="flex flex-wrap gap-2">
            {TECHNIQUE_OPTIONS.map(opt => {
              const active = techniques.includes(opt.value)
              const techClass = cn(
                'text-[11px] px-3 py-1.5 rounded-full border transition-colors',
                active
                  ? 'border-accent-blue bg-accent-blue/10 text-accent-blue'
                  : 'border-border text-muted hover:border-border/60'
              )
              return active ? (
                <button key={opt.value} type="button" onClick={() => toggleTechnique(opt.value)}
                  className={techClass} aria-pressed="true" aria-label={`Técnica ${opt.label}`}>
                  {opt.label}
                </button>
              ) : (
                <button key={opt.value} type="button" onClick={() => toggleTechnique(opt.value)}
                  className={techClass} aria-pressed="false" aria-label={`Técnica ${opt.label}`}>
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Skills asignadas */}
        {allSkills.length > 0 && (
          <div className="sm:col-span-2">
            <p className="text-[11px] text-muted uppercase tracking-[0.04em] mb-2 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-accent-purple" aria-hidden="true" />
              Skills asignadas
              {skillIds.length > 0 && (
                <span className="text-accent-purple font-bold">({skillIds.length})</span>
              )}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {allSkills.map(skill => {
                const active = skillIds.includes(skill.id)
                const skillClass = cn(
                  'flex items-center gap-2 text-left text-xs px-3 py-2 rounded-lg border transition-colors',
                  active
                    ? 'border-accent-purple/40 bg-accent-purple/10 text-accent-purple'
                    : 'border-border bg-surface2 text-muted hover:border-accent-purple/30 hover:text-text'
                )
                return active ? (
                  <button key={skill.id} type="button" onClick={() => toggleSkill(skill.id)}
                    className={skillClass} aria-pressed="true" aria-label={`Skill ${skill.name}: ${skill.description}`}>
                    <span aria-hidden="true">{skill.icon}</span>
                    <span className="flex-1 min-w-0 truncate">{skill.name}</span>
                  </button>
                ) : (
                  <button key={skill.id} type="button" onClick={() => toggleSkill(skill.id)}
                    className={skillClass} aria-pressed="false" aria-label={`Skill ${skill.name}: ${skill.description}`}>
                    <span aria-hidden="true">{skill.icon}</span>
                    <span className="flex-1 min-w-0 truncate">{skill.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-5 pt-4 border-t border-border">
        <button
          type="submit"
          className="flex-1 bg-gradient-to-r from-accent to-accent-blue text-black text-sm font-bold px-4 py-2.5 rounded-xl"
          aria-label={isEditing ? 'Guardar cambios del agente' : 'Guardar agente'}
        >
          {isEditing ? 'Guardar cambios' : 'Guardar agente'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-border text-muted text-sm hover:border-border/60 hover:text-text transition-colors"
          aria-label="Cancelar"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

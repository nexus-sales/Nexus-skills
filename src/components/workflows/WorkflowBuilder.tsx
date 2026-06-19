'use client'
import { useState, useId, useRef } from 'react'
import { useSkills } from '@/hooks/useSkills'
import { useAgents } from '@/hooks/useAgents'
import type { Workflow, WorkflowStep } from '@/types/prompt'
import { X, Plus, ArrowDown, Trash2, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkflowBuilderProps {
  initial?: Partial<Workflow>
  onSave: (data: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'isPredefined'>) => void
  onCancel: () => void
}

type StepType = 'skill' | 'agent' | 'prompt'

const STEP_TYPE_LABELS: Record<StepType, string> = {
  skill: 'Skill',
  agent: 'Agente',
  prompt: 'Prompt libre',
}

const STEP_COLORS: Record<StepType, string> = {
  skill:  'border-accent-purple/40 bg-accent-purple/10 text-accent-purple',
  agent:  'border-accent-blue/40 bg-accent-blue/10 text-accent-blue',
  prompt: 'border-accent/40 bg-accent/10 text-accent',
}

export function WorkflowBuilder({ initial, onSave, onCancel }: WorkflowBuilderProps) {
  const nameId = useId()
  const descId = useId()
  const iconId = useId()
  const { allSkills } = useSkills()
  const { allAgents } = useAgents()

  const [name,        setName]        = useState(initial?.name        ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [icon,        setIcon]        = useState(initial?.icon        ?? '🔗')
  const [steps,       setSteps]       = useState<WorkflowStep[]>(initial?.steps ?? [])

  const [addingType,  setAddingType]  = useState<StepType | null>(null)
  const stepIdRef = useRef(0)

  function addStep(type: StepType, refId: string, label: string) {
    stepIdRef.current += 1
    const step: WorkflowStep = {
      id: `step_${stepIdRef.current}`,
      order: steps.length,
      type,
      refId,
      label,
    }
    setSteps(prev => [...prev, step])
    setAddingType(null)
  }

  function removeStep(id: string) {
    setSteps(prev => prev.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i })))
  }

  function moveStep(idx: number, dir: -1 | 1) {
    setSteps(prev => {
      const next = [...prev]
      const target = idx + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next.map((s, i) => ({ ...s, order: i }))
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name, description, icon, steps })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface border border-border rounded-2xl p-5 mb-6"
      aria-label={initial?.id ? 'Editar workflow' : 'Crear nuevo workflow'}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-text">
          {initial?.id ? 'Editar workflow' : 'Nuevo workflow'}
        </h2>
        <button type="button" onClick={onCancel} className="text-muted hover:text-text" aria-label="Cancelar">
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-[64px_1fr_1fr] gap-3 mb-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={iconId} className="text-[11px] text-muted uppercase tracking-wide">Icono</label>
          <input id={iconId} type="text" maxLength={2} value={icon} onChange={e => setIcon(e.target.value)}
            className="bg-surface2 border border-border rounded-lg text-text text-center text-lg px-2 py-2 outline-none focus:border-accent" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={nameId} className="text-[11px] text-muted uppercase tracking-wide">Nombre *</label>
          <input id={nameId} type="text" required value={name} onChange={e => setName(e.target.value)}
            placeholder="Ej: Auditoría completa de código"
            className="bg-surface2 border border-border rounded-lg text-text text-sm px-3 py-2 outline-none focus:border-accent" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={descId} className="text-[11px] text-muted uppercase tracking-wide">Descripción</label>
          <input id={descId} type="text" value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Para qué sirve este workflow"
            className="bg-surface2 border border-border rounded-lg text-text text-sm px-3 py-2 outline-none focus:border-accent" />
        </div>
      </div>

      {/* Steps list */}
      <div className="mb-4">
        <p className="text-[11px] text-muted uppercase tracking-wider mb-3">Pasos del workflow</p>

        {steps.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-border rounded-xl text-muted text-xs">
            Añade el primer paso usando los botones de abajo
          </div>
        ) : (
          <ol className="space-y-2" aria-label="Pasos del workflow">
            {steps.map((step, idx) => (
              <li key={step.id} className={cn('flex items-center gap-2 rounded-xl border px-3 py-2.5', STEP_COLORS[step.type])}>
                <GripVertical className="w-3.5 h-3.5 shrink-0 opacity-40" aria-hidden="true" />
                <span className="font-mono text-[10px] opacity-60 shrink-0">{idx + 1}.</span>
                <span className="text-[10px] font-bold uppercase tracking-wide shrink-0">
                  {STEP_TYPE_LABELS[step.type]}
                </span>
                <span className="text-xs flex-1 min-w-0 truncate">{step.label}</span>
                <div className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => moveStep(idx, -1)} disabled={idx === 0}
                    className="p-1 rounded hover:bg-black/20 disabled:opacity-30 transition-opacity"
                    aria-label={`Subir paso ${idx + 1}`}>▲</button>
                  <button type="button" onClick={() => moveStep(idx, 1)} disabled={idx === steps.length - 1}
                    className="p-1 rounded hover:bg-black/20 disabled:opacity-30 transition-opacity"
                    aria-label={`Bajar paso ${idx + 1}`}>▼</button>
                  <button type="button" onClick={() => removeStep(step.id)}
                    className="p-1 rounded hover:bg-red-500/20 text-current transition-colors"
                    aria-label={`Eliminar paso ${step.label}`}>
                    <Trash2 className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}

        {steps.length > 0 && (
          <div className="flex justify-center my-2" aria-hidden="true">
            <ArrowDown className="w-4 h-4 text-muted" />
          </div>
        )}
      </div>

      {/* Add step controls */}
      <div className="border border-dashed border-border rounded-xl p-3">
        <p className="text-[10px] text-muted uppercase tracking-wider mb-2">Añadir paso</p>
        {addingType === null ? (
          <div className="flex gap-2 flex-wrap">
            {(['skill', 'agent', 'prompt'] as StepType[]).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setAddingType(type)}
                className={cn('flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border', STEP_COLORS[type])}
              >
                <Plus className="w-3 h-3" aria-hidden="true" />
                {STEP_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn('text-xs font-bold px-2 py-0.5 rounded border', STEP_COLORS[addingType])}>
                {STEP_TYPE_LABELS[addingType]}
              </span>
              <button type="button" onClick={() => setAddingType(null)} className="text-muted text-xs hover:text-text" aria-label="Cancelar añadir paso">
                Cancelar
              </button>
            </div>

            {addingType === 'skill' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                {allSkills.map(skill => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => addStep('skill', skill.id, `${skill.icon} ${skill.name}`)}
                    className="text-left text-xs px-3 py-2 rounded-lg border border-border bg-surface2 hover:border-accent-purple/40 hover:text-text transition-colors text-muted"
                    aria-label={`Añadir skill ${skill.name}`}
                  >
                    {skill.icon} {skill.name}
                  </button>
                ))}
              </div>
            )}

            {addingType === 'agent' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                {allAgents.map(agent => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => addStep('agent', agent.id, `${agent.icon} ${agent.name}`)}
                    className="text-left text-xs px-3 py-2 rounded-lg border border-border bg-surface2 hover:border-accent-blue/40 hover:text-text transition-colors text-muted"
                    aria-label={`Añadir agente ${agent.name}`}
                  >
                    {agent.icon} {agent.name}
                  </button>
                ))}
              </div>
            )}

            {addingType === 'prompt' && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Describe este paso de prompt libre..."
                  className="flex-1 bg-surface2 border border-border rounded-lg text-text text-sm px-3 py-2 outline-none focus:border-accent"
                  aria-label="Descripción del prompt libre"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const label = (e.target as HTMLInputElement).value.trim()
                      if (label) addStep('prompt', `prompt_${Date.now()}`, label)
                    }
                  }}
                />
                <span className="text-[10px] text-muted self-center">↵ Enter para añadir</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
        <button
          type="submit"
          disabled={!name.trim()}
          className="flex-1 bg-gradient-to-r from-accent to-accent-blue text-black text-sm font-bold px-4 py-2.5 rounded-xl disabled:opacity-40"
        >
          {initial?.id ? 'Guardar cambios' : 'Crear workflow'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-border text-muted text-sm hover:border-accent/30 hover:text-text transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}

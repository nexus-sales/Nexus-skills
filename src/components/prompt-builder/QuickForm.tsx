'use client'
import { useState, useId } from 'react'
import { ChevronDown, Lock, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input, TextArea } from '@/components/forms/InputBlock'
import type { PromptTemplate, PromptFormState, FieldConfig, FieldId } from '@/types/prompt'

interface QuickFormProps {
  templateId: string | null
  template: PromptTemplate | null
  state: PromptFormState
  onUpdate: (patch: Partial<PromptTemplate>) => void
  onExpert: () => void
}

export function QuickForm({ template, state, onUpdate, onExpert }: QuickFormProps) {
  if (!template || !template.visibleFields) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-2xl">
        <p className="text-sm text-muted mb-1">Elige una plantilla arriba para empezar</p>
        <p className="text-xs text-muted/60 mb-4">o usa el Asistente si no sabes cuál elegir</p>
        <button
          onClick={onExpert}
          className="text-xs text-accent-blue hover:underline"
          aria-label="Rellenar todos los campos manualmente en modo experto"
        >
          Rellenar manualmente (modo experto) →
        </button>
      </div>
    )
  }

  const required = template.visibleFields.filter(f => f.status === 'required')
  const prefilled = template.visibleFields.filter(f => f.status === 'prefilled').filter(f => {
    const val = getFieldValue(state, f.id)
    return val.length > 0
  })
  const advanced = template.visibleFields.filter(f => f.status === 'advanced')

  return (
    <div className="space-y-3">
      {required.map(field => (
        <FieldInput
          key={field.id}
          field={field}
          value={getFieldValue(state, field.id)}
          onChange={val => onUpdate(setFieldValue(field.id, val))}
          required
        />
      ))}

      {prefilled.length > 0 && (
        <PrefilledSummary fields={prefilled} state={state} summary={template.quickSummary} />
      )}

      {advanced.length > 0 && (
        <AdvancedFields fields={advanced} state={state} onUpdate={onUpdate} />
      )}

      <button
        onClick={onExpert}
        className="flex items-center gap-1.5 text-xs text-muted/50 hover:text-muted transition-colors pt-1"
        aria-label="Abrir modo experto para controlar todos los campos"
      >
        <Lock className="w-3 h-3" aria-hidden="true" />
        Ver todos los campos (modo experto)
        <ArrowRight className="w-3 h-3" aria-hidden="true" />
      </button>
    </div>
  )
}

function PrefilledSummary({
  fields,
  state,
  summary,
}: {
  fields: FieldConfig[]
  state: PromptFormState
  summary?: string
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <Lock className="w-3 h-3 text-accent" aria-hidden="true" />
        <span className="text-[10px] font-mono text-muted uppercase tracking-[0.1em]">
          Preconfigurado por la plantilla
        </span>
      </div>
      {summary && (
        <p className="text-xs text-muted leading-relaxed mb-2">{summary}</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {fields.map(f => {
          const val = getFieldValue(state, f.id)
          return (
            <span
              key={f.id}
              className="text-[10px] px-2 py-0.5 rounded-full bg-surface2 border border-border text-muted"
            >
              {f.label ?? f.id}: {val.substring(0, 40)}{val.length > 40 ? '…' : ''}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function AdvancedFields({
  fields,
  state,
  onUpdate,
}: {
  fields: FieldConfig[]
  state: PromptFormState
  onUpdate: (patch: Partial<PromptTemplate>) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs text-muted hover:text-label transition-colors bg-surface"
        aria-expanded={open}
        aria-label="Mostrar u ocultar opciones avanzadas opcionales"
      >
        <span>Opciones avanzadas (opcional)</span>
        <ChevronDown
          className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 space-y-3 border-t border-border bg-surface">
          {fields.map(field => (
            <FieldInput
              key={field.id}
              field={field}
              value={getFieldValue(state, field.id)}
              onChange={val => onUpdate(setFieldValue(field.id, val))}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FieldInput({
  field,
  value,
  onChange,
  required = false,
}: {
  field: FieldConfig
  value: string
  onChange: (val: string) => void
  required?: boolean
}) {
  const id = useId()
  const isLong = (
    field.id === 'material' || field.id === 'tarea' || field.id === 'criterios' ||
    field.id === 'restriccion' || field.id === 'autonomia' || field.id === 'fuentes'
  )

  return (
    <div className="flex flex-col gap-1.5 bg-surface border border-border rounded-xl p-4">
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-[11px] text-label uppercase tracking-wide"
      >
        {field.label ?? field.id}
        {required && <span className="text-red-400" aria-label="campo obligatorio">*</span>}
      </label>
      {isLong ? (
        <TextArea
          id={id}
          rows={field.id === 'material' ? 7 : 3}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
          aria-required={required}
        />
      ) : (
        <Input
          id={id}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
          aria-required={required}
        />
      )}
    </div>
  )
}

function getFieldValue(state: PromptFormState, id: FieldId): string {
  if (id === 'techniques') return ''
  const val = state[id as keyof PromptFormState]
  if (typeof val === 'string') return val
  if (typeof val === 'boolean') return ''
  return String(val ?? '')
}

function setFieldValue(id: FieldId, val: string): Partial<PromptTemplate> {
  return { [id]: val } as Partial<PromptTemplate>
}

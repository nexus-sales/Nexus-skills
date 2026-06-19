'use client'
import { useState } from 'react'
import { useWorkflows } from '@/hooks/useWorkflows'
import { WorkflowCard } from '@/components/workflows/WorkflowCard'
import { WorkflowBuilder } from '@/components/workflows/WorkflowBuilder'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { SubPageNav } from '@/components/layout/SubPageNav'
import type { Workflow } from '@/types/prompt'
import { Plus } from 'lucide-react'

export function WorkflowsPageClient() {
  const { allWorkflows, create, update, remove } = useWorkflows()
  const [editing, setEditing] = useState<Workflow | null | 'new'>(null)

  function handleSave(data: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'isPredefined'>) {
    if (editing && editing !== 'new') {
      update(editing.id, data)
    } else {
      create(data)
    }
    setEditing(null)
  }

  return (
    <AuthGuard>
      <SubPageNav />
      <main className="max-w-[900px] mx-auto px-5 py-6 pb-20">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Workflows</h1>
            <p className="text-sm text-muted mt-1">
              Encadena skills y agentes en flujos de trabajo reutilizables
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="flex items-center gap-1.5 bg-gradient-to-r from-accent to-accent-blue text-black text-xs font-bold px-3 py-2 rounded-xl"
            aria-label="Crear nuevo workflow"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Nuevo workflow
          </button>
        </div>

        {editing !== null && (
          <WorkflowBuilder
            initial={editing !== 'new' ? editing : undefined}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}

        {allWorkflows.length === 0 && editing === null ? (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl">
            <p className="text-4xl mb-3">🔗</p>
            <p className="text-muted text-sm">No hay workflows todavía.</p>
            <button
              type="button"
              onClick={() => setEditing('new')}
              className="mt-4 text-accent-blue text-sm hover:underline"
            >
              Crea el primero
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {allWorkflows.map(wf => (
              <WorkflowCard
                key={wf.id}
                workflow={wf}
                onEdit={() => setEditing(wf)}
                onDelete={() => remove(wf.id)}
              />
            ))}
          </div>
        )}
      </main>
    </AuthGuard>
  )
}

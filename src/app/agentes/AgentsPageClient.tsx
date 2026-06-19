'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAgents } from '@/hooks/useAgents'
import { AgentCard } from '@/components/agents/AgentCard'
import { AgentForm } from '@/components/agents/AgentForm'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { SubPageNav } from '@/components/layout/SubPageNav'
import type { Agent } from '@/types/prompt'

type FormState = 'closed' | 'new' | Agent

export function AgentsPageClient() {
  const { allAgents, create, update, remove } = useAgents()
  const [formState, setFormState] = useState<FormState>('closed')

  const isOpen = formState !== 'closed'
  const editingAgent = formState !== 'closed' && formState !== 'new' ? formState : undefined

  function handleSave(data: Omit<Agent, 'id' | 'createdAt' | 'updatedAt' | 'isCustom'>) {
    if (editingAgent) {
      update(editingAgent.id, data)
    } else {
      create(data)
    }
    setFormState('closed')
  }

  return (
    <AuthGuard>
      <SubPageNav />
      <main className="max-w-[780px] mx-auto px-5 py-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Agentes IA</h1>
            <p className="text-sm text-muted mt-1">
              Agentes configurados para sistemas de IA reutilizables
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormState(isOpen ? 'closed' : 'new')}
            className="flex items-center gap-1.5 bg-gradient-to-r from-accent to-accent-blue text-black text-xs font-bold px-3 py-2 rounded-xl"
            aria-label={isOpen ? 'Cerrar formulario de agente' : 'Crear nuevo agente personalizado'}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            {isOpen ? 'Cancelar' : 'Nuevo agente'}
          </button>
        </div>

        {isOpen && (
          <AgentForm
            id="agent-form"
            initial={editingAgent}
            onSave={handleSave}
            onCancel={() => setFormState('closed')}
          />
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {allAgents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={agent.isCustom ? () => setFormState(agent) : undefined}
              onDelete={agent.isCustom ? () => remove(agent.id) : undefined}
            />
          ))}
        </div>
      </main>
    </AuthGuard>
  )
}

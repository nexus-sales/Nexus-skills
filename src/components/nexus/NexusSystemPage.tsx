'use client'

import { useCallback } from 'react'
import { AlertCircle } from 'lucide-react'
import { useAgents } from '@/hooks/useAgents'
import { useNexusSystem } from '@/hooks/useNexusSystem'
import { useSkills } from '@/hooks/useSkills'
import { useWorkflows } from '@/hooks/useWorkflows'
import { GenerationStatusBadge } from '@/components/nexus/GenerationStatusBadge'
import { IdeaInput } from '@/components/nexus/IdeaInput'
import { SystemArtifactPanel } from '@/components/nexus/SystemArtifactPanel'
import { SystemStageList } from '@/components/nexus/SystemStageList'

export function NexusSystemPage() {
  const {
    idea,
    system,
    isGenerating,
    generationState,
    error,
    setIdea,
    generateSystem,
    updateSystemField,
    exportAsMarkdown,
  } = useNexusSystem()
  const { create: createSkill } = useSkills()
  const { create: createWorkflow } = useWorkflows()
  const { create: createAgent } = useAgents()

  const saveAsSkill = useCallback(() => {
    if (!system) return
    const draft = system.skillDraft
    createSkill({
      name: draft.name.trim() || `Skill Nexus - ${system.title}`,
      description: draft.description.trim() || 'Skill generada desde Nexus',
      icon: draft.compatibleSkill?.icon ?? 'N',
      category: draft.category,
      content: draft.content.trim() || system.recommendedPrompt.prompt,
      insertTarget: draft.insertTarget,
      isExportable: draft.isExportable,
    })
  }, [createSkill, system])

  const saveAsWorkflow = useCallback(() => {
    if (!system) return
    const draft = system.workflowDraft
    createWorkflow({
      name: draft.name.trim() || `Workflow Nexus - ${system.title}`,
      description: draft.description.trim() || 'Workflow generado desde Nexus',
      icon: draft.compatibleWorkflow?.icon ?? 'N',
      steps: draft.steps.map((step, index) => ({ ...step, order: index })),
    })
  }, [createWorkflow, system])

  const saveAsAgent = useCallback(() => {
    if (!system) return
    const draft = system.agentDraft
    createAgent({
      name: draft.name.trim() || `Agente Nexus - ${system.title}`,
      description: draft.description.trim() || 'Agente generado desde Nexus',
      icon: draft.compatibleAgent?.icon ?? 'N',
      role: draft.role.trim() || 'Eres un agente Nexus especializado en convertir ideas en sistemas de IA reutilizables.',
      systemPrompt: draft.systemPrompt.trim(),
      model: draft.model,
      tools: draft.tools,
      techniques: draft.techniques,
      skillIds: draft.skillIds,
      outputFormat: draft.outputFormat.trim() || 'Sistema de IA reutilizable con artefactos estructurados',
      autonomyLevel: draft.autonomyLevel,
    })
  }, [createAgent, system])

  return (
    <main className="min-h-screen bg-bg px-4 py-10 text-text sm:px-6 lg:px-8">
      <section className="mx-auto mb-8 max-w-4xl text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent-blue">Nexus</p>
        <h1 className="text-3xl font-black tracking-tight text-text sm:text-5xl">
          De una idea a un sistema de IA reutilizable
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted">
          Describe lo que quieres crear y Nexus generará el prompt, la skill, el workflow, el agente y el sistema base.
        </p>
      </section>

      <div className="space-y-8">
        <IdeaInput
          idea={idea}
          setIdea={setIdea}
          generateSystem={generateSystem}
          isGenerating={isGenerating}
        />

        {generationState !== 'idle' && (
          <div className="mx-auto flex max-w-3xl flex-col gap-2">
            <div className="flex items-center gap-3">
              <GenerationStatusBadge state={generationState} />
            </div>
            {generationState === 'fallback_local' && (
              <p className="text-sm text-amber-400/80">
                Nexus ha generado una versión local. Puedes seguir trabajando.
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mx-auto flex max-w-3xl items-start gap-3 rounded-[8px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}

        {system && <SystemStageList system={system} />}

        {system && (
          <SystemArtifactPanel
            system={system}
            updateSystemField={updateSystemField}
            exportAsMarkdown={exportAsMarkdown}
            onSaveSkill={saveAsSkill}
            onSaveWorkflow={saveAsWorkflow}
            onSaveAgent={saveAsAgent}
          />
        )}
      </div>
    </main>
  )
}

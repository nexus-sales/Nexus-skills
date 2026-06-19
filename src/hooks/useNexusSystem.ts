'use client'

import { useCallback, useState } from 'react'
import {
  generateLocalNexusSystem,
  isNexusApiArtifactsUsable,
  mergeWithApiArtifacts,
} from '@/lib/nexus-system-generator'
import { prepareBlueprintForApi } from '@/lib/prepare-blueprint-for-api'
import type { AiClassification } from '@/types/ai-classification'
import type {
  NexusAgentDraft,
  NexusExpectedResult,
  NexusFinalSystem,
  NexusIdeaAnalysis,
  NexusRecommendedPrompt,
  NexusSkillDraft,
  NexusStageStatus,
  NexusSystem,
  NexusSystemStage,
  NexusWorkflowDraft,
} from '@/types/nexus'
import type { NexusApiArtifacts } from '@/types/nexus-api'
import type { PendingQuestion, RequirementSeverity } from '@/types/project-blueprint'

const NEXUS_CLIENT_TIMEOUT_MS = 30_000

export type NexusGenerationState =
  | 'idle'
  | 'blueprint_ready'
  | 'classifying'
  | 'enriching'
  | 'completed'
  | 'fallback_local'
  | 'error'

type NexusEditableField =
  | 'analysis'
  | 'recommendedPrompt'
  | 'skillDraft'
  | 'workflowDraft'
  | 'agentDraft'
  | 'finalSystem'
  | 'expectedResult'

type NexusEditableValue = {
  analysis: NexusIdeaAnalysis
  recommendedPrompt: NexusRecommendedPrompt
  skillDraft: NexusSkillDraft
  workflowDraft: NexusWorkflowDraft
  agentDraft: NexusAgentDraft
  finalSystem: NexusFinalSystem
  expectedResult: NexusExpectedResult
}

function formatList(items: string[]): string {
  if (items.length === 0) return '- Sin datos'
  return items.map((item) => `- ${item}`).join('\n')
}

function normalizePendingQuestion(question: PendingQuestion | string): PendingQuestion {
  if (typeof question !== 'string') return question
  return {
    question,
    severity: 'important',
    reason: 'Migrated from legacy format',
  }
}

function formatPendingQuestions(
  questions: Array<PendingQuestion | string>,
  severity: RequirementSeverity
): string {
  const items = questions
    .map(normalizePendingQuestion)
    .filter((question) => question.severity === severity)

  if (items.length === 0) return '- Sin datos'
  return items.map((item) => `- ${item.question}\n  Motivo: ${item.reason}`).join('\n')
}

function formatStages(stages: NexusSystemStage[]): string {
  return [...stages]
    .sort((a, b) => a.order - b.order)
    .map((stage) => `${stage.order + 1}. ${stage.label} - ${stage.status}`)
    .join('\n')
}

function systemToMarkdown(system: NexusSystem): string {
  return `# ${system.title}

## Idea original

${system.originalIdea}

${system.blueprint ? `## Project Blueprint

**Tipo:** ${system.blueprint.projectType}

**Categoria:** ${system.blueprint.category}

**Confianza:** ${Math.round(system.blueprint.confidence * 100)}%

**Objetivo:** ${system.blueprint.objective}

**Audiencia:** ${system.blueprint.audience}

**Confirmado**

${formatList([
  ...(system.blueprint.confirmedFeatures ?? []),
  ...(system.blueprint.confirmedIntegrations ?? []).map((item) => `Integracion: ${item}`),
  ...(system.blueprint.confirmedVisualDesign ?? []).map((item) => `Diseno: ${item}`),
  ...(system.blueprint.confirmedMonetization ?? []).map((item) => `Monetizacion: ${item}`),
])}

**Inferido**

${formatList([
  ...(system.blueprint.inferredFeatures ?? []),
  ...(system.blueprint.inferredMonetization ?? []).map((item) => `Monetizacion: ${item}`),
  ...system.blueprint.entities.map((item) => `Entidad: ${item}`),
  ...system.blueprint.roles.map((item) => `Rol: ${item}`),
])}

**Sugerido**

${formatList([
  ...(system.blueprint.suggestedIntegrations ?? []).map((item) => `Integracion: ${item}`),
  ...(system.blueprint.suggestedVisualDesign ?? []).map((item) => `Diseno: ${item}`),
  ...(system.blueprint.suggestedMonetization ?? []).map((item) => `Monetizacion: ${item}`),
])}

**Funcionalidades**

${formatList(system.blueprint.features)}

**Entidades**

${formatList(system.blueprint.entities)}

**Roles**

${formatList(system.blueprint.roles)}

**Integraciones**

${formatList(system.blueprint.integrations)}

**Idiomas**

${formatList(system.blueprint.languages)}

**Riesgos**

${formatList(system.blueprint.risks)}

**Preguntas pendientes**

${formatList(system.blueprint.questions)}
` : ''}

${system.structuredBlueprint ? `## Información crítica

${formatPendingQuestions(system.structuredBlueprint.pendingQuestions, 'critical')}

## Información recomendable

${formatPendingQuestions(system.structuredBlueprint.pendingQuestions, 'important')}

## Información opcional

${formatPendingQuestions(system.structuredBlueprint.pendingQuestions, 'optional')}
` : ''}

## Analisis

**Resumen:** ${system.analysis.summary}

**Tipo:** ${system.analysis.projectType}

**Objetivo:** ${system.analysis.objective}

**Audiencia:** ${system.analysis.audience}

**Prioridad:** ${system.analysis.priority}

**Funcionalidades**

${formatList(system.analysis.features)}

**Diseño visual**

${formatList(system.analysis.visualDesign)}

**Idiomas**

${formatList(system.analysis.languages)}

**Contenido**

${formatList(system.analysis.content)}

**Monetización**

${formatList(system.analysis.monetization)}

**Integraciones**

${formatList(system.analysis.integrations)}

**Restricciones**

${formatList(system.analysis.restrictions)}

**Casos de uso**

${formatList(system.analysis.useCases)}

**Entradas necesarias**

${formatList(system.analysis.requiredInputs)}

**Salidas esperadas**

${formatList(system.analysis.expectedOutputs)}

**Riesgos**

${formatList(system.analysis.risks)}

**Supuestos**

${formatList(system.analysis.assumptions)}

**Confianza:** ${Math.round(system.analysis.confidence * 100)}%

## Prompt recomendado

**Titulo:** ${system.recommendedPrompt.title}

**Modelo objetivo:** ${system.recommendedPrompt.targetModel}

**Razon:** ${system.recommendedPrompt.rationale}

\`\`\`text
${system.recommendedPrompt.prompt}
\`\`\`

**Senales de calidad**

${formatList(system.recommendedPrompt.qualitySignals)}

## Skill reutilizable

**Nombre:** ${system.skillDraft.name}

**Descripcion:** ${system.skillDraft.description}

**Categoria:** ${system.skillDraft.category}

**Destino:** ${system.skillDraft.insertTarget}

\`\`\`text
${system.skillDraft.content}
\`\`\`

## Workflow relacionado

**Nombre:** ${system.workflowDraft.name}

**Descripcion:** ${system.workflowDraft.description}

**Pasos**

${system.workflowDraft.steps.map((step) => `${step.order + 1}. [${step.type}] ${step.label}`).join('\n')}

## Agente sugerido

**Nombre:** ${system.agentDraft.name}

**Descripcion:** ${system.agentDraft.description}

**Modelo:** ${system.agentDraft.model}

**Autonomia:** ${system.agentDraft.autonomyLevel}

**Tecnicas:** ${system.agentDraft.techniques.join(', ') || 'Sin tecnicas'}

**Formato de salida:** ${system.agentDraft.outputFormat}

**System prompt**

\`\`\`text
${system.agentDraft.systemPrompt}
\`\`\`

## Sistema final

**Nombre:** ${system.finalSystem.name}

**Proposito:** ${system.finalSystem.purpose}

**Recursos reutilizables**

${formatList(system.finalSystem.reusableAssets)}

**Flujo operativo**

${formatList(system.finalSystem.operatingFlow)}

**Instrucciones de traspaso:** ${system.finalSystem.handoffInstructions}

**Limitaciones**

${formatList(system.finalSystem.limitations)}

**Mantenimiento**

${formatList(system.finalSystem.maintenanceNotes)}

## Resultado esperado

**Resumen:** ${system.expectedResult.summary}

**Entregables**

${formatList(system.expectedResult.deliverables)}

**Criterios de exito**

${formatList(system.expectedResult.successCriteria)}

**Ejemplo de resultado:** ${system.expectedResult.exampleOutcome}

**Impacto medible**

${formatList(system.expectedResult.measurableImpact)}

## Etapas

${formatStages(system.stages)}
`
}

export function useNexusSystem() {
  const [idea, setIdea] = useState('')
  const [system, setSystem] = useState<NexusSystem | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationState, setGenerationState] = useState<NexusGenerationState>('idle')
  const [error, setError] = useState<string | null>(null)

  const generateSystem = useCallback(async () => {
    const cleanIdea = idea.trim()
    if (!cleanIdea) {
      setError('La idea no puede estar vacia')
      return
    }

    setIsGenerating(true)
    setError(null)

    // ── Fase 1: generación local instantánea ──────────────────────────────────
    let localSystem: NexusSystem
    try {
      localSystem = generateLocalNexusSystem(cleanIdea)
      setSystem(localSystem)
      setGenerationState('blueprint_ready')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo generar el sistema Nexus'
      setError(message)
      setGenerationState('error')
      setIsGenerating(false)
      return
    }

    // ── Fase 1.5: clasificación con IA si el dominio no fue reconocido ─────────
    const needsAiClassification =
      localSystem.structuredBlueprint?.category === 'custom' ||
      (localSystem.structuredBlueprint?.confidence ?? 0) < 40

    if (needsAiClassification) {
      setGenerationState('classifying')

      const classifyController = new AbortController()
      const classifyTimeoutId = setTimeout(() => classifyController.abort(), NEXUS_CLIENT_TIMEOUT_MS)
      let classification: AiClassification | null = null

      try {
        const classifyResponse = await fetch('/api/nexus/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idea: cleanIdea }),
          signal: classifyController.signal,
        })
        if (classifyResponse.ok) {
          const classifyJson: unknown = await classifyResponse.json()
          if (
            typeof classifyJson === 'object' &&
            classifyJson !== null &&
            'classification' in classifyJson
          ) {
            classification = (classifyJson as { classification: AiClassification }).classification
          }
        }
      } catch {
        // Network error or timeout — continue with local custom system
      } finally {
        clearTimeout(classifyTimeoutId)
      }

      if (classification) {
        const reclassified = generateLocalNexusSystem(cleanIdea, classification)
        localSystem = reclassified
        setSystem(reclassified)
      }
    }

    // ── Fase 2: enriquecimiento con Claude ────────────────────────────────────
    if (!localSystem.structuredBlueprint) {
      setGenerationState('completed')
      setIsGenerating(false)
      return
    }

    setGenerationState('enriching')

    const preparedBlueprint = prepareBlueprintForApi(localSystem.structuredBlueprint)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), NEXUS_CLIENT_TIMEOUT_MS)

    try {
      const response = await fetch('/api/nexus/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprint: preparedBlueprint }),
        signal: controller.signal,
      })

      if (response.ok) {
        const json: unknown = await response.json()
        if (
          typeof json === 'object' &&
          json !== null &&
          'artifacts' in json
        ) {
          const artifacts = (json as { artifacts: NexusApiArtifacts }).artifacts
          if (isNexusApiArtifactsUsable(artifacts)) {
            setSystem(mergeWithApiArtifacts(localSystem, artifacts))
            setGenerationState('completed')
          } else {
            setGenerationState('fallback_local')
          }
        } else {
          setGenerationState('fallback_local')
        }
      } else {
        setGenerationState('fallback_local')
      }
    } catch {
      setGenerationState('fallback_local')
    } finally {
      clearTimeout(timeoutId)
    }

    setIsGenerating(false)
  }, [idea])

  const resetSystem = useCallback(() => {
    setIdea('')
    setSystem(null)
    setError(null)
    setIsGenerating(false)
  }, [])

  const updateSystemField = useCallback(
    <Field extends NexusEditableField>(field: Field, value: NexusEditableValue[Field]) => {
      setSystem((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          [field]: value,
          updatedAt: new Date().toISOString(),
        }
      })
    },
    []
  )

  const updateStageStatus = useCallback((stageId: NexusSystemStage['id'], status: NexusStageStatus) => {
    setSystem((prev) => {
      if (!prev) return prev
      const updatedAt = new Date().toISOString()
      return {
        ...prev,
        stages: prev.stages.map((stage) => (
          stage.id === stageId
            ? {
                ...stage,
                status,
                completedAt: status === 'completed' ? updatedAt : stage.completedAt,
              }
            : stage
        )),
        updatedAt,
      }
    })
  }, [])

  const exportAsMarkdown = useCallback(() => {
    if (!system) return ''
    return systemToMarkdown(system)
  }, [system])

  return {
    idea,
    system,
    isGenerating,
    generationState,
    error,
    setIdea,
    generateSystem,
    resetSystem,
    updateSystemField,
    updateStageStatus,
    exportAsMarkdown,
  }
}

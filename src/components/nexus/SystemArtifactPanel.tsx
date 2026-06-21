'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Bot, Check, Copy, FileText, GitBranch, Save } from 'lucide-react'
import { humanizeBlueprintLabel } from '@/lib/structured-blueprint-generator'
import type {
  NexusAgentDraft,
  NexusExpectedResult,
  NexusFinalSystem,
  NexusIdeaAnalysis,
  NexusRecommendedPrompt,
  NexusSkillDraft,
  NexusSystem,
  NexusWorkflowDraft,
} from '@/types/nexus'
import type { PendingQuestion, RequirementSeverity, StructuredProjectBlueprint } from '@/types/project-blueprint'

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

interface SystemArtifactPanelProps {
  system: NexusSystem
  updateSystemField: <Field extends NexusEditableField>(field: Field, value: NexusEditableValue[Field]) => void
  exportAsMarkdown: () => string
  onSaveSkill: () => void
  onSaveWorkflow: () => void
  onSaveAgent: () => void
}

interface ArtifactCardProps {
  title: string
  eyebrow: string
  children: ReactNode
}

function ArtifactCard({ title, eyebrow, children }: ArtifactCardProps) {
  return (
    <article className="rounded-[8px] border border-border/70 bg-surface p-4">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-accent-blue">{eyebrow}</p>
      <h3 className="mb-4 text-base font-black text-text">{title}</h3>
      {children}
    </article>
  )
}

function TextList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-sm text-muted">Sin datos.</p>

  return (
    <ul className="space-y-1.5 text-sm leading-relaxed text-label">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-blue" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function BlueprintList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">{title}</p>
      <TextList items={items.map(humanizeBlueprintLabel)} />
    </div>
  )
}

function normalizeQuestionForUi(question: PendingQuestion | string): PendingQuestion {
  if (typeof question !== 'string') return question
  return {
    question,
    severity: 'important',
    reason: 'Migrated from legacy format',
  }
}

function severityMeta(severity: RequirementSeverity): { title: string; className: string } {
  if (severity === 'critical') {
    return {
      title: 'Información crítica',
      className: 'border-red-400/30 bg-red-400/10 text-red-300',
    }
  }

  if (severity === 'important') {
    return {
      title: 'Información recomendable',
      className: 'border-yellow-400/30 bg-yellow-400/10 text-yellow-300',
    }
  }

  return {
    title: 'Información opcional',
    className: 'border-green-400/30 bg-green-400/10 text-green-300',
  }
}

function QuestionSeverityGroups({ questions }: { questions: Array<PendingQuestion | string> }) {
  const normalizedQuestions = questions.map(normalizeQuestionForUi)
  const severities: RequirementSeverity[] = ['critical', 'important', 'optional']

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {severities.map((severity) => {
        const items = normalizedQuestions.filter((question) => question.severity === severity)
        const meta = severityMeta(severity)

        return (
          <div key={severity} className={`rounded-[8px] border p-3 ${meta.className}`}>
            <p className="mb-2 text-xs font-black uppercase tracking-wide">
              {meta.title} ({items.length})
            </p>
            {items.length === 0 ? (
              <p className="text-sm opacity-80">Sin preguntas.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {items.map((item) => (
                  <li key={item.question}>
                    <p className="font-bold text-text">{item.question}</p>
                    <p className="mt-1 text-xs text-muted">{item.reason}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

function confidenceLabel(level: StructuredProjectBlueprint['confidenceLevel']): string {
  if (level === 'high') return 'Alta'
  if (level === 'medium') return 'Media'
  return 'Baja'
}

function EditableText({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="w-full resize-y rounded-[8px] border border-border bg-surface2 px-3 py-2 text-sm leading-relaxed text-text outline-none transition-colors focus:border-accent-blue"
        aria-label={label}
      />
    </label>
  )
}

export function SystemArtifactPanel({
  system,
  updateSystemField,
  exportAsMarkdown,
  onSaveSkill,
  onSaveWorkflow,
  onSaveAgent,
}: SystemArtifactPanelProps) {
  const [feedback, setFeedback] = useState('')
  const [showBlueprint, setShowBlueprint] = useState(false)
  const criticalPendingQuestions = system.structuredBlueprint?.pendingQuestions.filter((question) => question.severity === 'critical') ?? []

  function showFeedback(message: string) {
    setFeedback(message)
    window.setTimeout(() => setFeedback(''), 1800)
  }

  async function handleCopyPrompt() {
    if (!navigator.clipboard) {
      showFeedback('Portapapeles no disponible')
      return
    }
    await navigator.clipboard.writeText(system.recommendedPrompt.prompt)
    showFeedback('Prompt copiado')
  }

  async function handleExportMarkdown() {
    const markdown = exportAsMarkdown()
    if (!markdown || !navigator.clipboard) {
      showFeedback('Portapapeles no disponible')
      return
    }
    await navigator.clipboard.writeText(markdown)
    showFeedback('Markdown copiado')
  }

  function handleSaveSkill() {
    onSaveSkill()
    showFeedback('Skill guardada')
  }

  function handleSaveWorkflow() {
    onSaveWorkflow()
    showFeedback('Workflow guardado')
  }

  function handleSaveAgent() {
    onSaveAgent()
    showFeedback('Agente guardado')
  }

  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Sistema generado</p>
            <h2 className="mt-1 text-xl font-black text-text">{system.title}</h2>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-border bg-surface px-3 text-sm font-bold text-text transition-colors hover:border-accent-blue/40"
              aria-label="Copiar prompt recomendado"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              Copiar prompt
            </button>
            <button
              type="button"
              onClick={handleSaveSkill}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-accent-purple/30 bg-accent-purple/10 px-3 text-sm font-bold text-accent-purple transition-colors hover:border-accent-purple"
              aria-label="Guardar artefacto como skill"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              Guardar como skill
            </button>
            <button
              type="button"
              onClick={handleSaveWorkflow}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-orange-400/30 bg-orange-400/10 px-3 text-sm font-bold text-orange-400 transition-colors hover:border-orange-400"
              aria-label="Guardar artefacto como workflow"
            >
              <GitBranch className="h-4 w-4" aria-hidden="true" />
              Guardar como workflow
            </button>
            <button
              type="button"
              onClick={handleSaveAgent}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-accent-blue/30 bg-accent-blue/10 px-3 text-sm font-bold text-accent-blue transition-colors hover:border-accent-blue"
              aria-label="Guardar artefacto como agente"
            >
              <Bot className="h-4 w-4" aria-hidden="true" />
              Guardar como agente
            </button>
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-border bg-surface px-3 text-sm font-bold text-text transition-colors hover:border-accent-blue/40"
              aria-label="Exportar sistema Nexus como Markdown"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              Exportar Markdown
            </button>
            {system.blueprint && (
              <button
                type="button"
                onClick={() => setShowBlueprint((current) => !current)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-border bg-surface px-3 text-sm font-bold text-muted transition-colors hover:border-accent-blue/40 hover:text-text"
                aria-label={showBlueprint ? 'Ocultar Project Blueprint' : 'Ver Project Blueprint'}
                aria-expanded={showBlueprint}
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                {showBlueprint ? 'Ocultar Blueprint' : 'Ver Blueprint'}
              </button>
            )}
          </div>
        </div>
        {feedback && (
          <div className="inline-flex w-fit items-center gap-2 rounded-[8px] border border-accent/30 bg-accent/10 px-3 py-2 text-sm font-bold text-accent" role="status" aria-live="polite">
            <Check className="h-4 w-4" aria-hidden="true" />
            {feedback}
          </div>
        )}
      </div>

      {system.structuredBlueprint?.needsDiscovery && (
        <article className="mb-4 rounded-[8px] border border-yellow-400/30 bg-yellow-400/10 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-yellow-300">Discovery Mode</p>
          <h3 className="mt-1 text-lg font-black text-text">Necesitamos más información para generar un sistema fiable.</h3>
          <p className="mt-2 text-sm text-muted">
            Confianza: {system.structuredBlueprint.confidence}% · {confidenceLabel(system.structuredBlueprint.confidenceLevel)}
          </p>
          <div className="mt-4">
            <QuestionSeverityGroups questions={system.structuredBlueprint.pendingQuestions} />
          </div>
        </article>
      )}

      {system.structuredBlueprint && !system.structuredBlueprint.needsDiscovery && system.structuredBlueprint.pendingQuestions.length > 0 && (
        <article className="mb-4 rounded-[8px] border border-border/70 bg-surface p-4">
          <div className="mb-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
              {criticalPendingQuestions.length > 0 ? 'Decisión crítica pendiente' : 'Preguntas pendientes'}
            </p>
            <h3 className="mt-1 text-lg font-black text-text">
              {criticalPendingQuestions.length > 0
                ? 'Sistema generado con decisión crítica pendiente'
                : `Confianza: ${system.structuredBlueprint.confidence}% · ${confidenceLabel(system.structuredBlueprint.confidenceLevel)}`}
            </h3>
            {criticalPendingQuestions.length > 0 && (
              <p className="mt-2 text-sm text-muted">
                No bloquea el sistema base, pero afectará arquitectura comercial.
              </p>
            )}
          </div>
          <QuestionSeverityGroups questions={system.structuredBlueprint.pendingQuestions} />
        </article>
      )}

      {showBlueprint && system.blueprint && (
        <article className="mb-4 rounded-[8px] border border-accent-blue/20 bg-surface p-4">
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-accent-blue">Modo experto</p>
            <h3 className="mt-1 text-lg font-black text-text">Project Blueprint</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 text-sm text-label md:grid-cols-2">
            <p><span className="text-muted">Tipo:</span> {system.blueprint.projectType}</p>
            <p><span className="text-muted">Categoría:</span> {system.blueprint.category}</p>
            <p><span className="text-muted">Confianza:</span> {Math.round(system.blueprint.confidence * 100)}%</p>
            <p><span className="text-muted">Objetivo:</span> {system.blueprint.objective}</p>
            <p className="md:col-span-2"><span className="text-muted">Audiencia:</span> {system.blueprint.audience}</p>
            <BlueprintList title="Confirmado" items={[
              ...(system.blueprint.confirmedFeatures ?? []),
              ...(system.blueprint.confirmedIntegrations ?? []).map((item) => `Integracion: ${item}`),
              ...(system.blueprint.confirmedVisualDesign ?? []).map((item) => `Diseno: ${item}`),
              ...(system.blueprint.confirmedMonetization ?? []).map((item) => `Monetizacion: ${item}`),
            ]} />
            <BlueprintList title="Inferido" items={[
              ...(system.blueprint.inferredFeatures ?? []),
              ...(system.blueprint.inferredMonetization ?? []).map((item) => `Monetizacion: ${item}`),
              ...system.blueprint.entities.map((item) => `Entidad: ${item}`),
              ...system.blueprint.roles.map((item) => `Rol: ${item}`),
            ]} />
            <BlueprintList title="Sugerido" items={[
              ...(system.blueprint.suggestedIntegrations ?? []).map((item) => `Integracion: ${item}`),
              ...(system.blueprint.suggestedVisualDesign ?? []).map((item) => `Diseno: ${item}`),
              ...(system.blueprint.suggestedMonetization ?? []).map((item) => `Monetizacion: ${item}`),
            ]} />
            <BlueprintList title="Funcionalidades totales" items={system.blueprint.features} />
            <BlueprintList title="Entidades" items={system.blueprint.entities} />
            <BlueprintList title="Roles" items={system.blueprint.roles} />
            <BlueprintList title="Integraciones" items={system.blueprint.integrations} />
            <BlueprintList title="Idiomas" items={system.blueprint.languages} />
            <BlueprintList title="Riesgos" items={system.blueprint.risks} />
            <BlueprintList title="Preguntas pendientes" items={system.blueprint.questions} />
            {system.structuredBlueprint && (
              <>
                <p><span className="text-muted">Subtipo:</span> {system.structuredBlueprint.subtype ?? 'generic'}</p>
                <p><span className="text-muted">Modelo de negocio:</span> {system.structuredBlueprint.businessModel ?? 'Sin definir'}</p>
                <BlueprintList title="MVP" items={system.structuredBlueprint.mvpScope} />
                <BlueprintList title="Fase futura" items={system.structuredBlueprint.futureScope} />
                <BlueprintList title="No funcionales" items={system.structuredBlueprint.nonFunctionalRequirements} />
                <BlueprintList title="Riesgos tecnicos" items={system.structuredBlueprint.implementationRisks} />
                <BlueprintList title="Metricas de exito" items={system.structuredBlueprint.successMetrics} />
                <BlueprintList
                  title="Integraciones consolidadas"
                  items={system.structuredBlueprint.integrationCapabilities.map((item) => `${item.name}: ${item.capabilities.join(', ')}`)}
                />
              </>
            )}
          </div>
        </article>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ArtifactCard title="Idea analizada" eyebrow="01">
          <div className="space-y-4">
            <EditableText
              label="Resumen"
              value={system.analysis.summary}
              onChange={(summary) => updateSystemField('analysis', { ...system.analysis, summary })}
            />
            <div className="grid grid-cols-1 gap-3 text-sm text-label sm:grid-cols-2">
              <p><span className="text-muted">Tipo:</span> {system.analysis.projectType}</p>
              <p><span className="text-muted">Confianza:</span> {system.structuredBlueprint ? `${system.structuredBlueprint.confidence}% · ${confidenceLabel(system.structuredBlueprint.confidenceLevel)}` : `${Math.round(system.analysis.confidence * 100)}%`}</p>
              <p className="sm:col-span-2"><span className="text-muted">Objetivo:</span> {system.analysis.objective}</p>
              <p className="sm:col-span-2"><span className="text-muted">Audiencia:</span> {system.analysis.audience}</p>
              <p><span className="text-muted">Prioridad:</span> {system.analysis.priority}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">Funcionalidades</p>
                <TextList items={system.analysis.features} />
              </div>
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">Diseño</p>
                <TextList items={system.analysis.visualDesign} />
              </div>
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">Idiomas</p>
                <TextList items={system.analysis.languages} />
              </div>
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">Contenido</p>
                <TextList items={system.analysis.content} />
              </div>
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">Monetizacion</p>
                <TextList items={system.analysis.monetization} />
              </div>
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">Integraciones</p>
                <TextList items={system.analysis.integrations} />
              </div>
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">Restricciones</p>
                <TextList items={system.analysis.restrictions} />
              </div>
            </div>
          </div>
        </ArtifactCard>

        <ArtifactCard title="Prompt recomendado" eyebrow="02">
          <div className="space-y-4">
            <p className="text-sm text-muted">{system.recommendedPrompt.rationale}</p>
            <EditableText
              label="Prompt"
              value={system.recommendedPrompt.prompt}
              rows={8}
              onChange={(prompt) => updateSystemField('recommendedPrompt', { ...system.recommendedPrompt, prompt })}
            />
            <TextList items={system.recommendedPrompt.qualitySignals} />
          </div>
        </ArtifactCard>

        <ArtifactCard title="Skill reutilizable" eyebrow="03">
          <div className="space-y-4">
            <p className="text-sm text-label">{system.skillDraft.description}</p>
            {system.skillDraft.beginnerExplanation && (
              <div className="rounded-[8px] border border-accent-blue/20 bg-accent-blue/5 px-3 py-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-accent-blue">Qué hace para ti</p>
                <p className="text-sm leading-relaxed text-label">{system.skillDraft.beginnerExplanation}</p>
              </div>
            )}
            <EditableText
              label="Contenido"
              value={system.skillDraft.content}
              rows={7}
              onChange={(content) => updateSystemField('skillDraft', { ...system.skillDraft, content })}
            />
            <p className="text-xs text-muted">Categoria: {system.skillDraft.category} - Destino: {system.skillDraft.insertTarget}</p>
          </div>
        </ArtifactCard>

        <ArtifactCard title="Workflow sugerido" eyebrow="04">
          <div className="space-y-4">
            {system.workflowDraft.beginnerExplanation && (
              <div className="rounded-[8px] border border-accent-blue/20 bg-accent-blue/5 px-3 py-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-accent-blue">Qué hace para ti</p>
                <p className="text-sm leading-relaxed text-label">{system.workflowDraft.beginnerExplanation}</p>
              </div>
            )}
            <EditableText
              label="Descripcion"
              value={system.workflowDraft.description}
              rows={3}
              onChange={(description) => updateSystemField('workflowDraft', { ...system.workflowDraft, description })}
            />
            <ol className="space-y-2">
              {system.workflowDraft.steps.map((step) => (
                <li key={step.id} className="rounded-[8px] bg-surface2 px-3 py-2 text-sm text-label">
                  <span className="mr-2 font-mono text-xs text-accent-blue">{step.order + 1}.</span>
                  <span className="font-bold uppercase text-muted">{step.type}</span>
                  <span className="ml-2">{step.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </ArtifactCard>

        <ArtifactCard title="Agente propuesto" eyebrow="05">
          <div className="space-y-4">
            <p className="text-sm text-label">{system.agentDraft.description}</p>
            <EditableText
              label="System prompt"
              value={system.agentDraft.systemPrompt}
              rows={7}
              onChange={(systemPrompt) => updateSystemField('agentDraft', { ...system.agentDraft, systemPrompt })}
            />
            <p className="text-xs text-muted">Modelo: {system.agentDraft.model} - Autonomia: {system.agentDraft.autonomyLevel}</p>
          </div>
        </ArtifactCard>

        <ArtifactCard title="Sistema base" eyebrow="06">
          <div className="space-y-4">
            <EditableText
              label="Proposito"
              value={system.finalSystem.purpose}
              onChange={(purpose) => updateSystemField('finalSystem', { ...system.finalSystem, purpose })}
            />
            <TextList items={system.finalSystem.reusableAssets} />
            <p className="text-sm leading-relaxed text-muted">{system.finalSystem.handoffInstructions}</p>
          </div>
        </ArtifactCard>

        <div className="lg:col-span-2">
          <ArtifactCard title="Resultado esperado" eyebrow="07">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <EditableText
                label="Resumen"
                value={system.expectedResult.summary}
                onChange={(summary) => updateSystemField('expectedResult', { ...system.expectedResult, summary })}
              />
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">Entregables</p>
                <TextList items={system.expectedResult.deliverables} />
              </div>
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">Impacto</p>
                <TextList items={system.expectedResult.measurableImpact} />
              </div>
            </div>
          </ArtifactCard>
        </div>
      </div>
    </section>
  )
}

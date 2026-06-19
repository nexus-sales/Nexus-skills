import type { NexusSystem } from '@/types/nexus'

interface SystemStageListProps {
  system: NexusSystem
}

const STATUS_LABELS: Record<NexusSystem['stages'][number]['status'], string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  completed: 'Completada',
  needs_review: 'Revisar',
  blocked: 'Bloqueada',
}

const STAGE_LABELS: Partial<Record<NexusSystem['stages'][number]['id'], string>> = {
  analysis: 'Idea analizada',
  recommended_prompt: 'Prompt recomendado',
  skill_draft: 'Skill reutilizable',
  workflow_draft: 'Workflow sugerido',
  agent_draft: 'Agente propuesto',
  final_system: 'Sistema base',
  expected_result: 'Resultado esperado',
}

export function SystemStageList({ system }: SystemStageListProps) {
  const stages = [...system.stages].sort((a, b) => a.order - b.order)

  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-text">Flujo Idea a Sistema</h2>
        <span className="text-xs text-muted">{stages.length} etapas</span>
      </div>
      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-label="Etapas del sistema Nexus">
        {stages.map((stage) => (
          <li
            key={stage.id}
            className="rounded-[8px] border border-border/70 bg-surface px-3 py-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] text-muted">{String(stage.order + 1).padStart(2, '0')}</span>
              <span className="rounded-[6px] border border-accent/20 bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                {STATUS_LABELS[stage.status]}
              </span>
            </div>
            <p className="text-sm font-bold text-text">{STAGE_LABELS[stage.id] ?? stage.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{stage.description}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

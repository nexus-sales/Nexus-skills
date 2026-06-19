'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, Check, Zap } from 'lucide-react'
import { useWorkflows } from '@/hooks/useWorkflows'
import { useSkills } from '@/hooks/useSkills'
import { useAgents } from '@/hooks/useAgents'
import { generatePrompt } from '@/lib/prompt-generator'
import { AuthGuard } from '@/components/layout/AuthGuard'
import type { PromptTemplate } from '@/types/prompt'

const STEP_COLORS: Record<string, string> = {
  skill:  'border-accent-purple/30 bg-accent-purple/10 text-accent-purple',
  agent:  'border-accent-blue/30 bg-accent-blue/10 text-accent-blue',
  prompt: 'border-accent/30 bg-accent/10 text-accent',
}

interface WorkflowRunnerClientProps {
  workflowId: string
}

export function WorkflowRunnerClient({ workflowId }: WorkflowRunnerClientProps) {
  const { getById } = useWorkflows()
  const { getById: getSkill } = useSkills()
  const { getById: getAgent } = useAgents()
  const workflow = getById(workflowId)

  const [task, setTask] = useState('')
  const [material, setMaterial] = useState('')
  const [copied, setCopied] = useState(false)

  const generatedPrompt = useMemo(() => {
    if (!workflow) return ''

    const skillSteps = workflow.steps
      .filter(s => s.type === 'skill')
      .map(s => getSkill(s.refId))
      .filter((s): s is NonNullable<typeof s> => !!s)

    const agentSteps = workflow.steps
      .filter(s => s.type === 'agent')
      .map(s => getAgent(s.refId))
      .filter((a): a is NonNullable<typeof a> => !!a)

    const promptSteps = workflow.steps
      .filter(s => s.type === 'prompt')
      .map(s => s.label)

    const firstAgent = agentSteps[0]

    const skillTarea = skillSteps
      .filter(s => s.insertTarget === 'tarea')
      .map(s => s.content).join('\n\n')

    const skillRestricion = skillSteps
      .filter(s => s.insertTarget === 'restriccion' || s.insertTarget === 'system')
      .map(s => s.content).join('\n\n')

    const skillAutonomia = skillSteps
      .filter(s => s.insertTarget === 'autonomia')
      .map(s => s.content).join('\n\n')

    const tareaFull = [task, skillTarea, ...promptSteps].filter(Boolean).join('\n\n')

    const state: PromptTemplate = {
      rol: firstAgent?.role ?? 'Experto especialista',
      tarea: tareaFull,
      proyecto: '',
      stack: '',
      destino: '',
      restriccion: skillRestricion,
      outputType: firstAgent?.outputFormat ?? '',
      ext: '',
      tono: '',
      autonomia: skillAutonomia,
      fuentes: material ? 'usa solo el material incluido' : 'usa conocimiento del dominio, pero marca claramente cualquier inferencia',
      cot: firstAgent?.techniques.includes('cot') ?? false,
      sc: firstAgent?.techniques.includes('sc') ?? false,
      xml: firstAgent?.techniques.includes('xml') ?? false,
      neg: firstAgent?.techniques.includes('neg') ?? !!skillRestricion,
      ej: firstAgent?.techniques.includes('ej') ?? false,
      pre: firstAgent?.techniques.includes('pre') ?? false,
      int: firstAgent?.techniques.includes('int') ?? false,
      crit: firstAgent?.techniques.includes('crit') ?? false,
      devil: firstAgent?.techniques.includes('devil') ?? false,
      matType: material ? 'contexto' : '',
      matFile: '',
      material,
      // Protecciones anti-alucinación: siempre activas en workflows
      evidenceMode: true,
      assumptionPolicy: 'distingue claramente hechos, inferencias y suposiciones',
      missingInfoPolicy: 'si falta informacion critica, pregunta antes de concluir o implementar',
      verificationDepth: 'validacion estricta: revisa requisitos, riesgos, contradicciones y datos no respaldados',
    }

    return generatePrompt(state, firstAgent?.model ?? 'universal')
  }, [workflow, task, material, getSkill, getAgent])

  const handleCopy = async () => {
    if (!generatedPrompt.trim()) return
    await navigator.clipboard.writeText(generatedPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!workflow) return (
    <div className="max-w-[780px] mx-auto px-5 py-6">
      <p className="text-muted">Workflow no encontrado.</p>
      <Link href="/workflows" className="text-accent-blue text-sm mt-2 inline-block">← Volver a workflows</Link>
    </div>
  )

  return (
    <AuthGuard>
      <main className="max-w-[780px] mx-auto px-5 py-6 pb-20">
        <Link
          href="/workflows"
          className="flex items-center gap-1.5 text-muted text-sm mb-6 hover:text-text transition-colors"
          aria-label="Volver al listado de workflows"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Workflows
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl shrink-0" aria-hidden="true">{workflow.icon}</span>
          <div>
            <h1 className="text-xl font-extrabold text-text">{workflow.name}</h1>
            <p className="text-sm text-muted">{workflow.description}</p>
          </div>
        </div>

        {/* Pasos del workflow */}
        <div className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <p className="text-[10px] text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-accent" aria-hidden="true" />
            Pasos activos ({workflow.steps.length})
          </p>
          <ol className="space-y-1.5" aria-label="Pasos del workflow">
            {workflow.steps.map((step, i) => (
              <li
                key={step.id}
                className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border ${STEP_COLORS[step.type] ?? 'border-border bg-surface2 text-muted'}`}
              >
                <span className="font-mono opacity-60 shrink-0">{i + 1}.</span>
                <span className="font-bold uppercase text-[10px] shrink-0">{step.type}</span>
                <span className="flex-1 truncate">{step.label}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Tarea */}
        <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
          <label htmlFor="wf-task" className="block text-xs text-muted uppercase tracking-[0.04em] mb-2">
            Tarea específica
          </label>
          <textarea
            id="wf-task"
            rows={3}
            value={task}
            onChange={e => setTask(e.target.value)}
            placeholder="¿Qué debe hacer este workflow exactamente?"
            className="w-full bg-surface2 border border-border rounded-lg text-text text-sm p-3 outline-none resize-y focus:border-accent-blue"
            aria-label="Tarea específica para el workflow"
          />
        </div>

        {/* Material */}
        <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
          <label htmlFor="wf-material" className="block text-xs text-muted uppercase tracking-[0.04em] mb-2">
            Material de entrada <span className="text-muted/50 normal-case font-normal">(opcional)</span>
          </label>
          <textarea
            id="wf-material"
            rows={6}
            value={material}
            onChange={e => setMaterial(e.target.value)}
            placeholder="Pega aquí el código, texto o datos que el workflow debe procesar..."
            className="w-full bg-surface2 border border-border rounded-lg text-text text-sm p-3 outline-none resize-y focus:border-accent-blue"
            aria-label="Material de entrada para el workflow"
          />
        </div>

        {/* Prompt generado */}
        <div className="bg-surface2 border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-[10px] font-mono text-accent uppercase tracking-[0.15em]">▸ prompt generado</span>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!generatedPrompt.trim()}
              className="flex items-center gap-1.5 bg-gradient-to-r from-accent to-accent-blue text-black text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              aria-label="Copiar prompt al portapapeles"
            >
              {copied
                ? <Check className="w-3.5 h-3.5" aria-hidden="true" />
                : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
          <pre className="font-mono text-xs text-text p-4 whitespace-pre-wrap break-words min-h-[80px]">
            {generatedPrompt || (
              <span className="text-muted italic">Añade una tarea para generar el prompt del workflow.</span>
            )}
          </pre>
        </div>
      </main>
    </AuthGuard>
  )
}

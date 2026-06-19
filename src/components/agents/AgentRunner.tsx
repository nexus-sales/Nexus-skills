'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, Zap } from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { useSkills } from '@/hooks/useSkills';
import { generatePrompt } from '@/lib/prompt-generator';
import type { PromptTemplate } from '@/types/prompt';

interface AgentRunnerProps {
  agentId: string;
}

export function AgentRunner({ agentId }: AgentRunnerProps) {
  const { getById } = useAgents();
  const { getById: getSkillById } = useSkills();
  const agent = getById(agentId);
  const [material, setMaterial] = useState('');
  const [task, setTask] = useState('');
  const [copied, setCopied] = useState(false);

  // Resolve skills assigned to this agent
  const agentSkills = useMemo(() => {
    if (!agent?.skillIds) return [];
    return agent.skillIds.map(id => getSkillById(id)).filter(Boolean) as NonNullable<ReturnType<typeof getSkillById>>[];
  }, [agent, getSkillById]);

  // Build extra restriccion content from skills
  const skillsRestricion = useMemo(() =>
    agentSkills
      .filter(s => s.insertTarget === 'restriccion' || s.insertTarget === 'system')
      .map(s => s.content)
      .join('\n\n'),
    [agentSkills]
  );
  const skillsTarea = useMemo(() =>
    agentSkills.filter(s => s.insertTarget === 'tarea').map(s => s.content).join('\n\n'),
    [agentSkills]
  );
  const skillsAutonomia = useMemo(() =>
    agentSkills.filter(s => s.insertTarget === 'autonomia').map(s => s.content).join('\n\n'),
    [agentSkills]
  );

  const state: PromptTemplate = agent
    ? {
        rol: agent.role,
        tarea: skillsTarea ? `${task}\n\n${skillsTarea}`.trim() : task,
        proyecto: '',
        stack: '',
        destino: '',
        restriccion: skillsRestricion ? skillsRestricion : '',
        outputType: agent.outputFormat,
        ext: '',
        tono: '',
        criterios: '',
        autonomia: skillsAutonomia
          ? skillsAutonomia
          : agent.autonomyLevel === 'ask_first' ? 'si falta informacion critica, haz preguntas antes' :
            agent.autonomyLevel === 'plan_confirm' ? 'propón un plan y espera confirmacion' :
            'ejecuta directamente usando supuestos razonables',
        fuentes: material ? 'usa solo el material incluido' : 'usa conocimiento del dominio, pero marca claramente cualquier inferencia',
        cot: agent.techniques.includes('cot'),
        sc: agent.techniques.includes('sc'),
        xml: agent.techniques.includes('xml'),
        neg: agent.techniques.includes('neg'),
        ej: agent.techniques.includes('ej'),
        pre: agent.techniques.includes('pre'),
        int: agent.techniques.includes('int'),
        crit: agent.techniques.includes('crit'),
        devil: agent.techniques.includes('devil'),
        matType: material ? 'contexto' : '',
        matFile: '',
        material,
        // Protecciones anti-alucinación: siempre activas en agentes
        evidenceMode: true,
        assumptionPolicy: 'distingue claramente hechos, inferencias y suposiciones',
        missingInfoPolicy: 'si falta informacion critica, pregunta antes de concluir o implementar',
        verificationDepth: 'validacion estricta: revisa requisitos, riesgos, contradicciones y datos no respaldados',
      }
    : {
        rol: '', tarea: '', proyecto: '', stack: '', destino: '',
        restriccion: '', outputType: '', ext: '', tono: '',
        cot: false, sc: false, xml: false, neg: false, ej: false,
        pre: false, int: false, crit: false, devil: false,
        matType: '', matFile: '', material: '',
        evidenceMode: true,
        assumptionPolicy: 'distingue claramente hechos, inferencias y suposiciones',
        missingInfoPolicy: 'si falta informacion critica, pregunta antes de concluir o implementar',
        verificationDepth: 'validacion estricta: revisa requisitos, riesgos, contradicciones y datos no respaldados',
      };

  const generatedPrompt = agent ? generatePrompt(state, agent.model) : '';

  const handleCopy = async () => {
    if (!generatedPrompt.trim()) return;
    await navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!agent) {
    return (
      <div className="max-w-[780px] mx-auto px-5 py-6">
        <p className="text-muted">Agente no encontrado.</p>
        <Link href="/agentes" className="text-accent-blue text-sm mt-2 inline-block">← Volver a agentes</Link>
      </div>
    );
  }

  return (
    <main className="max-w-[780px] mx-auto px-5 py-6 pb-20">
      <Link
        href="/agentes"
        className="flex items-center gap-1.5 text-muted text-sm mb-6 hover:text-text transition-colors"
        aria-label="Volver al listado de agentes"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Agentes
      </Link>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl" aria-hidden="true">{agent.icon}</span>
        <div>
          <h1 className="text-xl font-extrabold text-text">{agent.name}</h1>
          <p className="text-sm text-muted">{agent.description}</p>
        </div>
      </div>

      {/* Skills activas en este agente */}
      {agentSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5" aria-label="Skills activas en este agente">
          <span className="text-[10px] text-muted uppercase tracking-wider flex items-center gap-1 mr-1">
            <Zap className="w-3 h-3 text-accent-purple" aria-hidden="true" /> Skills activas:
          </span>
          {agentSkills.map(skill => (
            <span
              key={skill.id}
              className="text-[10px] px-2 py-0.5 rounded-full border border-accent-purple/30 bg-accent-purple/10 text-accent-purple"
              title={skill.description}
            >
              {skill.icon} {skill.name}
            </span>
          ))}
        </div>
      )}

      <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
        <label htmlFor="agent-task" className="block text-xs text-muted uppercase tracking-[0.04em] mb-2">
          Tarea específica
        </label>
        <textarea
          id="agent-task"
          rows={3}
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="¿Qué debe hacer el agente exactamente?"
          className="w-full bg-surface2 border border-border rounded-lg text-text text-sm p-3 outline-none resize-y focus:border-accent-blue"
          aria-label="Tarea específica para el agente"
        />
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
        <label htmlFor="agent-material" className="block text-xs text-muted uppercase tracking-[0.04em] mb-2">
          Material de entrada
        </label>
        <textarea
          id="agent-material"
          rows={8}
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          placeholder="Pega aquí el código, texto o datos que quieres que el agente procese..."
          className="w-full bg-surface2 border border-border rounded-lg text-text text-sm p-3 outline-none resize-y focus:border-accent-blue"
          aria-label="Material de entrada para el agente"
        />
      </div>

      <div className="bg-surface2 border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-[10px] font-mono text-accent uppercase tracking-[0.15em]">▸ prompt generado</span>
          <button
            onClick={handleCopy}
            disabled={!generatedPrompt.trim()}
            className="flex items-center gap-1.5 bg-gradient-to-r from-accent to-accent-blue text-black text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            aria-label="Copiar prompt al portapapeles"
          >
            {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
            {copied ? '✓ Copiado' : 'Copiar'}
          </button>
        </div>
        <pre className="font-mono text-xs text-text p-4 whitespace-pre-wrap break-words min-h-[80px]">
          {generatedPrompt || (
            <span className="text-muted italic">Añade una tarea o material para generar el prompt.</span>
          )}
        </pre>
      </div>
    </main>
  );
}

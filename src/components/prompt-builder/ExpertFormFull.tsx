'use client'
import { useState, useCallback, useId } from 'react'
import { Shield, Plus, X } from 'lucide-react'
import { InputBlock, Input, TextArea, Select, Label } from '@/components/forms/InputBlock'
import { TechniquesList } from '@/components/prompt-builder/TechniquesList'
import { SkillsPanel } from '@/components/skills/SkillsPanel'
import { PHASE_INSTRUCTIONS } from '@/lib/prompt-generator'
import type { PromptTemplate, PromptFormState, SkillInsertTarget } from '@/types/prompt'

interface ExpertFormFullProps {
  state: PromptFormState
  onUpdate: (patch: Partial<PromptTemplate>) => void
  onUpdateTechnique: (key: keyof PromptTemplate, value: boolean) => void
  onSkillInsert: (target: SkillInsertTarget, content: string, skillId: string) => void
}

interface EvidenceBtnProps { onClick: () => void }

function EvidenceModeButtonOn({ onClick }: EvidenceBtnProps) {
  return (
    <button
      type="button" onClick={onClick}
      className="flex min-h-[84px] items-center gap-3 rounded-xl border p-4 text-left transition-colors border-accent/50 bg-accent/10 text-accent"
      aria-pressed="true" aria-label="Solo con evidencia"
    >
      <Shield className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span>
        <span className="block text-[11px] font-bold uppercase tracking-wider">Solo con evidencia</span>
        <span className="block text-[10px] text-muted">No inventar, marcar incertidumbre</span>
      </span>
    </button>
  )
}

function EvidenceModeButtonOff({ onClick }: EvidenceBtnProps) {
  return (
    <button
      type="button" onClick={onClick}
      className="flex min-h-[84px] items-center gap-3 rounded-xl border p-4 text-left transition-colors border-border bg-surface2 text-muted hover:border-accent/30"
      aria-pressed="false" aria-label="Solo con evidencia"
    >
      <Shield className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span>
        <span className="block text-[11px] font-bold uppercase tracking-wider">Solo con evidencia</span>
        <span className="block text-[10px] text-muted">No inventar, marcar incertidumbre</span>
      </span>
    </button>
  )
}

export function ExpertFormFull({ state, onUpdate, onUpdateTechnique, onSkillInsert }: ExpertFormFullProps) {
  const uid = useId()
  const f = (name: string) => `${uid}-${name}`
  const [customGoal, setCustomGoal] = useState(false)
  const [customType, setCustomType] = useState(false)
  const [insertedSkillIds, setInsertedSkillIds] = useState<string[]>([])

  const handleSkillInsert = useCallback((target: SkillInsertTarget, content: string, skillId: string) => {
    onSkillInsert(target, content, skillId)
    setInsertedSkillIds(prev => prev.includes(skillId) ? prev : [...prev, skillId])
  }, [onSkillInsert])

  return (
    <>
      <InputBlock
        number="00"
        title="Modo App Inteligente"
        subtitle="objetivo, fase y checklist"
        className="2xl:col-span-2"
        help={<><strong>Atajo real:</strong> separa el trabajo por objetivo y fase.</>}
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="mb-0" htmlFor={f('appGoal')}>Objetivo</Label>
              <button
                onClick={() => { setCustomGoal(!customGoal); if (!customGoal) onUpdate({ appGoal: '' }); }}
                className="text-[10px] text-accent-blue hover:underline flex items-center gap-1"
                aria-label={customGoal ? 'Volver al selector de objetivo' : 'Escribir objetivo manual'}
              >
                {customGoal ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {customGoal ? 'Cancelar' : 'Manual'}
              </button>
            </div>
            {customGoal ? (
              <Input id={f('appGoal')} value={state.appGoal ?? ''} onChange={(e) => onUpdate({ appGoal: e.target.value })} placeholder="Escribe el objetivo..." aria-label="Objetivo manual" />
            ) : (
              <Select id={f('appGoal')} value={state.appGoal} onChange={(e) => onUpdate({ appGoal: e.target.value })} aria-label="Seleccionar objetivo">
                <option value="">— objetivo —</option>
                <option value="crear-app">Crear app desde cero</option>
                <option value="migrar-html-next">Migrar HTML/CSS a Next</option>
                <option value="arreglar-bug">Arreglar bug</option>
                <option value="refactorizar">Refactorizar sin cambiar funcionalidad</option>
                <option value="auditar">Auditar seguridad/calidad</option>
                <option value="crear-agente">Crear prompt de agente</option>
              </Select>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="mb-0" htmlFor={f('appType')}>Tipo de app</Label>
              <button
                onClick={() => { setCustomType(!customType); if (!customType) onUpdate({ appType: '' }); }}
                className="text-[10px] text-accent-blue hover:underline flex items-center gap-1"
                aria-label={customType ? 'Volver al selector de tipo' : 'Escribir tipo manual'}
              >
                {customType ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {customType ? 'Cancelar' : 'Manual'}
              </button>
            </div>
            {customType ? (
              <Input id={f('appType')} value={state.appType ?? ''} onChange={(e) => onUpdate({ appType: e.target.value })} placeholder="Escribe el tipo de app..." aria-label="Tipo de app manual" />
            ) : (
              <Select id={f('appType')} value={state.appType} onChange={(e) => onUpdate({ appType: e.target.value })} aria-label="Seleccionar tipo de app">
                <option value="">— tipo de app —</option>
                <option value="herramienta interna / dashboard operativo">Herramienta interna / dashboard</option>
                <option value="vanilla JS / HTML + CSS sin framework">Vanilla JS / HTML + CSS</option>
                <option value="SaaS B2B con usuarios, roles y paneles">SaaS B2B</option>
                <option value="CRM o gestion comercial">CRM / gestion comercial</option>
                <option value="landing o web de conversion">Landing / web conversion</option>
                <option value="app con Supabase, autenticacion y datos">App Supabase con auth</option>
                <option value="componente o modulo aislado">Componente / modulo</option>
              </Select>
            )}
          </div>
          <div>
            <Label htmlFor={f('promptPhase')}>Fase del prompt</Label>
            <Select id={f('promptPhase')} value={state.promptPhase} onChange={(e) => onUpdate({ promptPhase: e.target.value })} aria-label="Seleccionar fase del prompt">
              <option value="">— sin fase —</option>
              {Object.keys(PHASE_INSTRUCTIONS).map((phase) => (
                <option key={phase} value={phase}>{phase}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div><Label htmlFor={f('appScreens')}>Pantallas y flujos</Label><TextArea id={f('appScreens')} rows={3} value={state.appScreens ?? ''} onChange={(e) => onUpdate({ appScreens: e.target.value })} placeholder="Ej: login, dashboard, detalle cliente..." /></div>
          <div><Label htmlFor={f('appData')}>Datos y entidades</Label><TextArea id={f('appData')} rows={3} value={state.appData ?? ''} onChange={(e) => onUpdate({ appData: e.target.value })} placeholder="Ej: usuarios, clientes, proyectos..." /></div>
          <div><Label htmlFor={f('appIntegrations')}>Integraciones</Label><TextArea id={f('appIntegrations')} rows={3} value={state.appIntegrations ?? ''} onChange={(e) => onUpdate({ appIntegrations: e.target.value })} placeholder="Ej: Supabase, Stripe, email..." /></div>
          <div><Label htmlFor={f('appPermissions')}>Roles y permisos</Label><TextArea id={f('appPermissions')} rows={3} value={state.appPermissions ?? ''} onChange={(e) => onUpdate({ appPermissions: e.target.value })} placeholder="Ej: admin, comercial, cliente..." /></div>
          <div><Label htmlFor={f('appDesign')}>UX / estilo visual</Label><TextArea id={f('appDesign')} rows={3} value={state.appDesign ?? ''} onChange={(e) => onUpdate({ appDesign: e.target.value })} placeholder="Ej: app de escritorio, densa, profesional..." /></div>
          <div><Label htmlFor={f('appAcceptance')}>Criterios de aceptacion</Label><TextArea id={f('appAcceptance')} rows={3} value={state.appAcceptance ?? ''} onChange={(e) => onUpdate({ appAcceptance: e.target.value })} placeholder="Ej: build sin errores, estados loading/error..." /></div>
        </div>
      </InputBlock>

      <InputBlock number="01" title="Rol Experto" subtitle="Modo mental" help={<><strong>Define especialidad, seniority y contexto de negocio.</strong></>}>
        <Label htmlFor={f('rol')}>Identidad Profesional</Label>
        <Input id={f('rol')} value={state.rol} onChange={(e) => onUpdate({ rol: e.target.value })} placeholder="Ej: Arquitecto frontend especialista en Next.js..." aria-label="Rol experto" />
      </InputBlock>

      <InputBlock number="02" title="Tarea Principal" subtitle="Accion y criterio" className="2xl:col-span-2" help={<>Usa verbo de accion, objeto y criterio de exito.</>}>
        <Label htmlFor={f('tarea')}>Definicion de Ejecucion</Label>
        <TextArea id={f('tarea')} rows={4} value={state.tarea} onChange={(e) => onUpdate({ tarea: e.target.value })} placeholder="Verbo + objeto + criterio de exito..." aria-label="Tarea principal" />
      </InputBlock>

      <InputBlock number="03" title="Contexto Tecnico" subtitle="Entorno de ejecucion" help={<>Proyecto, stack, destinatario y restricciones.</>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div><Label htmlFor={f('proyecto')}>Proyecto / App</Label><Input id={f('proyecto')} value={state.proyecto} onChange={(e) => onUpdate({ proyecto: e.target.value })} placeholder="Nombre del sistema..." aria-label="Nombre del proyecto" /></div>
          <div><Label htmlFor={f('stack')}>Stack Tecnologico</Label><Input id={f('stack')} value={state.stack} onChange={(e) => onUpdate({ stack: e.target.value })} placeholder="Next.js, Tailwind, etc..." aria-label="Stack tecnológico" /></div>
        </div>
        <Label htmlFor={f('destino')}>Destinatario</Label>
        <Input id={f('destino')} value={state.destino} onChange={(e) => onUpdate({ destino: e.target.value })} placeholder="Ej: equipo tecnico, cliente final..." aria-label="Destinatario" />
        <Label className="mt-4" htmlFor={f('restriccion')}>Restriccion Importante</Label>
        <Input id={f('restriccion')} value={state.restriccion} onChange={(e) => onUpdate({ restriccion: e.target.value })} placeholder="Ej: no romper contratos existentes..." aria-label="Restricción importante" />
      </InputBlock>

      <InputBlock number="04" title="Formato de Salida" subtitle="estructura y utilidad" help={<>Fuerza el formato para obtener una respuesta lista para usar.</>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor={f('outputType')}>Tipo de Output</Label>
            <Select id={f('outputType')} value={state.outputType} onChange={(e) => onUpdate({ outputType: e.target.value })} aria-label="Tipo de output">
              <option value="">Elegir tipo</option>
              <option value="informe estructurado con secciones y subsecciones numeradas">Informe estructurado</option>
              <option value="lista numerada de prioridades">Lista priorizada</option>
              <option value="codigo corregido listo para copiar">Codigo listo</option>
              <option value="propuesta comercial con: problema, solucion, beneficios">Propuesta comercial</option>
              <option value="JSON estructurado">JSON</option>
            </Select>
          </div>
          <div>
            <Label htmlFor={f('ext')}>Extension</Label>
            <Select id={f('ext')} value={state.ext} onChange={(e) => onUpdate({ ext: e.target.value })} aria-label="Extensión de la respuesta">
              <option value="">Elegir extension</option>
              <option value="respuesta concisa, maximo 150 palabras">Concisa</option>
              <option value="respuesta media de entre 300 y 500 palabras">Media</option>
              <option value="respuesta detallada y completa">Completa</option>
            </Select>
          </div>
        </div>
        <Label htmlFor={f('tono')}>Tono</Label>
        <Select id={f('tono')} value={state.tono} onChange={(e) => onUpdate({ tono: e.target.value })} aria-label="Tono de la respuesta">
          <option value="">Elegir tono</option>
          <option value="tecnico y preciso">Tecnico y preciso</option>
          <option value="profesional y directo">Profesional y directo</option>
          <option value="comercial y persuasivo">Comercial / Persuasivo</option>
          <option value="ejecutivo, enfasis en ROI">Ejecutivo</option>
        </Select>
      </InputBlock>

      <InputBlock number="05" title="Control Experto" subtitle="calidad y autonomia" help={<>Define que separa una respuesta buena de una mala.</>}>
        <Label htmlFor={f('criterios')}>Criterios de Exito</Label>
        <TextArea id={f('criterios')} rows={2} value={state.criterios ?? ''} onChange={(e) => onUpdate({ criterios: e.target.value })} placeholder="Ej: cubre todos los requisitos, prioriza por impacto..." aria-label="Criterios de éxito" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <Label htmlFor={f('autonomia')}>Nivel de Autonomia</Label>
            <Select id={f('autonomia')} value={state.autonomia} onChange={(e) => onUpdate({ autonomia: e.target.value })} aria-label="Nivel de autonomía">
              <option value="ejecuta directamente usando supuestos razonables">Ejecutar con supuestos</option>
              <option value="si falta informacion critica, haz preguntas antes">Preguntar antes</option>
              <option value="propón un plan y espera confirmacion">Plan y confirmacion</option>
            </Select>
          </div>
          <div>
            <Label htmlFor={f('fuentes')}>Politica de Fuentes</Label>
            <Select id={f('fuentes')} value={state.fuentes} onChange={(e) => onUpdate({ fuentes: e.target.value })} aria-label="Política de fuentes">
              <option value="usa solo el material incluido">Solo material adjunto</option>
              <option value="conocimiento general marcado claramente">Conocimiento general</option>
              <option value="incluye citas y referencias">Citas y referencias</option>
            </Select>
          </div>
        </div>
      </InputBlock>

      <InputBlock number="06" title="Tecnicas Avanzadas" subtitle="las que marcan la diferencia" className="2xl:col-span-2" help={<>No las actives todas a la vez. Elige las 2-3 que encajen con la tarea.</>}>
        <TechniquesList
          state={state}
          onToggle={(key, value) => onUpdateTechnique(key, value)}
        />
      </InputBlock>

      <InputBlock number="07" title="Material de Referencia" subtitle="instruccion vs datos" className="2xl:col-span-2" help={<>El material se encapsula para que no se confunda con instrucciones.</>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor={f('matType')}>Tipo de Material</Label>
            <Select id={f('matType')} value={state.matType} onChange={(e) => onUpdate({ matType: e.target.value })} aria-label="Tipo de material">
              <option value="">Sin material</option>
              <option value="codigo">Codigo</option>
              <option value="documento">Documento</option>
              <option value="error">Error / Log</option>
              <option value="contexto">Contexto</option>
            </Select>
          </div>
          <div>
            <Label htmlFor={f('matFile')}>Nombre Archivo</Label>
            <Input id={f('matFile')} value={state.matFile} onChange={(e) => onUpdate({ matFile: e.target.value })} placeholder="Ej: main.ts" aria-label="Nombre del archivo" />
          </div>
        </div>
        <Label htmlFor={f('material')}>Contenido del Material</Label>
        <TextArea id={f('material')} rows={6} value={state.material ?? ''} onChange={(e) => onUpdate({ material: e.target.value })} placeholder="Pega aqui el codigo, log o documento..." aria-label="Contenido del material de referencia" />
      </InputBlock>

      <InputBlock number="08" title="Verificacion y Antialucinacion" subtitle="hacerlo real" className="2xl:col-span-2" help={<>Reduce invenciones. Distingue evidencia de suposicion.</>}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          {state.evidenceMode
            ? <EvidenceModeButtonOn onClick={() => onUpdate({ evidenceMode: false })} />
            : <EvidenceModeButtonOff onClick={() => onUpdate({ evidenceMode: true })} />
          }
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor={f('assumptionPolicy')}>Politica de suposiciones</Label>
              <Select id={f('assumptionPolicy')} value={state.assumptionPolicy} onChange={(e) => onUpdate({ assumptionPolicy: e.target.value })} aria-label="Política de suposiciones">
                <option value="distingue claramente hechos, inferencias y suposiciones">Separar hechos / inferencias</option>
                <option value="no hagas suposiciones; pregunta antes si falta informacion">No asumir, preguntar antes</option>
                <option value="puedes usar supuestos razonables, pero declaralos al final">Supuestos declarados</option>
              </Select>
            </div>
            <div>
              <Label htmlFor={f('missingInfoPolicy')}>Datos faltantes</Label>
              <Select id={f('missingInfoPolicy')} value={state.missingInfoPolicy} onChange={(e) => onUpdate({ missingInfoPolicy: e.target.value })} aria-label="Política para datos faltantes">
                <option value="si falta informacion critica, pregunta antes de concluir o implementar">Preguntar si es critico</option>
                <option value="lista los datos faltantes y entrega solo una propuesta provisional">Propuesta provisional</option>
                <option value="bloquea la respuesta final si falta material imprescindible">Bloquear si falta</option>
              </Select>
            </div>
            <div>
              <Label htmlFor={f('verificationDepth')}>Profundidad de verificacion</Label>
              <Select id={f('verificationDepth')} value={state.verificationDepth} onChange={(e) => onUpdate({ verificationDepth: e.target.value })} aria-label="Profundidad de verificación">
                <option value="validacion estricta: revisa requisitos, riesgos, contradicciones y datos no respaldados">Estricta</option>
                <option value="validacion tecnica: revisa compatibilidad, contratos, edge cases y dependencias">Tecnica para apps</option>
                <option value="validacion ligera: revisa claridad, alcance y formato">Ligera</option>
              </Select>
            </div>
          </div>
        </div>
        <Label className="mt-4" htmlFor={f('antiHallucinationNotes')}>Notas de precision</Label>
        <TextArea id={f('antiHallucinationNotes')} rows={3} value={state.antiHallucinationNotes ?? ''} onChange={(e) => onUpdate({ antiHallucinationNotes: e.target.value })} placeholder="Ej: no inventes rutas, no asumas librerias no instaladas..." aria-label="Notas de precisión" />
      </InputBlock>

      <div className="2xl:col-span-2">
        <SkillsPanel
          onInsert={handleSkillInsert}
          insertedIds={insertedSkillIds}
        />
      </div>
    </>
  )
}

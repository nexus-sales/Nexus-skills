'use client';

import { ChangeEvent, useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  Download, FileText, Link as LinkIcon, Save,
  Upload, X, AlertTriangle,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { ModeSelector } from '@/components/prompt-builder/ModeSelector';
import { TemplateGridSmart } from '@/components/prompt-builder/TemplateGridSmart';
import { QuickForm } from '@/components/prompt-builder/QuickForm';
import { ExpertFormFull } from '@/components/prompt-builder/ExpertFormFull';
import { OutputPanel } from '@/components/prompt-builder/OutputPanel';
import { ModelAdviceGrid } from '@/components/prompt-builder/ModelAdviceGrid';
import { usePromptBuilder } from '@/hooks/usePromptBuilder';
import { useHistory } from '@/hooks/useHistory';
import { useTemplates } from '@/hooks/useTemplates';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAppMode } from '@/hooks/useAppMode';
import { PHASE_INSTRUCTIONS, buildPhasePrompt } from '@/lib/prompt-generator';
import type { PromptTemplate, TargetModel, SkillInsertTarget } from '@/types/prompt';
import { TEMPLATES } from '@/constants/templates';
import { ElicitationFlow } from '@/components/agents/ElicitationFlow';
import { IterationPanel } from '@/components/prompt-builder/IterationPanel';
import { TestPanel } from '@/components/prompt-builder/TestPanel';
import { ExportMenu } from '@/components/prompt-builder/ExportMenu';
import { ValidationPanel } from '@/components/prompt-builder/ValidationPanel';
import { useIteration } from '@/hooks/useIteration';
import type { IterationFailReason } from '@/types/prompt';
import { Input, Select } from '@/components/forms/InputBlock';

const DEFAULT_TPL = 'conversion';
const MAX_SHARE_URL_CHARS = 6000;

// D-02: encodeConfig seguro para Unicode y payloads grandes
function encodeConfig(data: unknown): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(data))))
}

export default function PromptBuilderPage() {
  const builder = usePromptBuilder();
  const { history, add: addToHistory, remove: removeFromHistory } = useHistory();
  // L-01: usar useTemplates (conectado a Supabase + clave unificada) en vez de useLocalStorage directo
  const { custom: customTemplates, save: saveCustomTpl, remove: removeCustomTpl } = useTemplates();
  const { mode: appMode, setMode: setAppMode } = useAppMode();

  // UI-only local state
  const [activeTpl, setActiveTpl] = useState<string>(DEFAULT_TPL);
  const [customName, setCustomName] = useState('');
  const [toast, setToast] = useState('');
  const [phaseCopy, setPhaseCopy] = useState<string>('fase 1: requisitos y arquitectura antes de implementar');
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const { iterations, addIteration, markFailed, clearIterations, latestIteration } = useIteration(sessionId);
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const importRef = useRef<HTMLInputElement>(null);

  const allTemplates = useMemo(
    () => ({ ...TEMPLATES, ...customTemplates }),
    [customTemplates]
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2200);
  }, []);

  const handleTplSelect = useCallback((id: string) => {
    const tpl = allTemplates[id];
    if (!tpl) return;
    setActiveTpl(id);
    builder.loadTemplate(tpl);
  }, [allTemplates, builder]);

  const saveCustomTemplate = useCallback(() => {
    const name = customName.trim() || builder.state.tarea.slice(0, 28).trim() || 'Plantilla propia';
    const id = saveCustomTpl(name, builder.state);
    setActiveTpl(id);
    setCustomName('');
    showToast(`Plantilla guardada: ${name}`);
  }, [customName, builder.state, saveCustomTpl, showToast]);

  const shareConfig = useCallback(async () => {
    // S-04: excluir campos con datos sensibles del payload compartido
    const { material, matFile, antiHallucinationNotes, ...shareableState } = builder.state;
    const url = new URL(window.location.href);
    url.searchParams.set('p', encodeConfig({ ...shareableState, model: builder.model }));
    // L-06: verificar que la URL no supera límites razonables del navegador
    if (url.toString().length > MAX_SHARE_URL_CHARS) {
      showToast('Config demasiado larga para compartir — guárdala como plantilla');
      return;
    }
    await navigator.clipboard.writeText(url.toString());
    showToast('Enlace copiado');
  }, [builder.state, builder.model, showToast]);

  const exportData = useCallback(() => {
    const payload = {
      version: '2.0-next',
      exportDate: new Date().toISOString(),
      model: builder.model,
      formData: builder.state,
      customTemplates,
      history,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PromptBuilder_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exportado');
  }, [builder.model, builder.state, customTemplates, history, showToast]);

  const importData = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result)) as unknown;
        // S-05: validar que el JSON es un objeto con la forma esperada antes de aplicarlo
        if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
          showToast('Archivo no válido');
          return;
        }
        const data = raw as Record<string, unknown>;
        if (data.formData && typeof data.formData === 'object' && !Array.isArray(data.formData)) {
          builder.loadTemplate(data.formData as PromptTemplate);
        }
        const VALID_MODELS: TargetModel[] = ['claude', 'gemini', 'gpt4', 'deepseek', 'universal'];
        if (typeof data.model === 'string' && VALID_MODELS.includes(data.model as TargetModel)) {
          builder.setModel(data.model as TargetModel);
        }
        if (data.customTemplates && typeof data.customTemplates === 'object' && !Array.isArray(data.customTemplates)) {
          // Importar cada plantilla individualmente a través del hook para mantener sync con Supabase
          for (const [, tpl] of Object.entries(data.customTemplates as Record<string, PromptTemplate>)) {
            if (typeof tpl === 'object' && tpl !== null && typeof tpl.tarea === 'string') {
              saveCustomTpl(tpl.name ?? 'Importada', tpl);
            }
          }
        }
        showToast('Datos importados');
      } catch {
        showToast('Archivo no válido');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  }, [builder, saveCustomTpl, showToast]);

  const copyPhasePrompt = useCallback(async () => {
    const prompt = buildPhasePrompt(builder.state, phaseCopy);
    await navigator.clipboard.writeText(prompt);
    addToHistory(prompt, builder.state.tarea);
    showToast('Prompt de fase copiado');
  }, [builder.state, phaseCopy, addToHistory, showToast]);

  const handleCopy = useCallback(async () => {
    if (!builder.generatedPrompt.trim()) return;
    await navigator.clipboard.writeText(builder.generatedPrompt);
    addToHistory(builder.generatedPrompt, builder.state.tarea);
    addIteration(builder.generatedPrompt, builder.quality.total);
    showToast('Prompt copiado');
  }, [builder.generatedPrompt, builder.state.tarea, addToHistory, addIteration, builder.quality.total, showToast]);

  const handleSkillInsert = useCallback((target: SkillInsertTarget, content: string) => {
    if (target === 'system') {
      const prev = builder.state.restriccion ?? '';
      builder.update({ restriccion: prev ? `${prev}\n\n${content}` : content });
    } else {
      const prev = (builder.state[target as keyof typeof builder.state] as string) ?? '';
      builder.update({ [target]: prev ? `${prev}\n\n${content}` : content } as Partial<PromptTemplate>);
    }
    showToast(`Skill insertada en ${target}`);
  }, [builder, showToast]);

  const clearFields = useCallback(() => {
    builder.reset();
    setActiveTpl(DEFAULT_TPL);
    setCustomName('');
    showToast('Campos restaurados');
  }, [builder, showToast]);

  useKeyboardShortcuts({ onCopy: handleCopy, onClear: clearFields });

  // ─── Derived computations ──────────────────────────────────────────────────
  const reliabilityAudit = useMemo(() => {
    const missing: string[] = [];
    const risks: string[] = [];
    const strengths: string[] = [];
    const material = builder.state.material?.trim();
    const isAppMode = Boolean(builder.state.appGoal);

    if (!builder.state.rol) missing.push('Rol experto');
    if (!builder.state.tarea) missing.push('Tarea concreta');
    if (isAppMode && !builder.state.stack) missing.push('Stack tecnico');
    if (isAppMode && !builder.state.restriccion) missing.push('Restricciones de implementacion');
    if (isAppMode && !builder.state.appScreens) missing.push('Pantallas y flujos');
    if (isAppMode && !builder.state.appData) missing.push('Datos y entidades');
    if (isAppMode && !builder.state.appAcceptance) missing.push('Criterios de aceptacion funcional');
    if ((builder.state.matType || builder.state.tarea.toLowerCase().includes('codigo')) && !material) missing.push('Material de referencia');
    if (!builder.state.criterios) missing.push('Criterios de aceptacion');

    if (!builder.state.evidenceMode) risks.push('Modo evidencia desactivado');
    if (!builder.state.neg) risks.push('Sin restricciones explicitas');
    if (!builder.state.crit) risks.push('Sin auto-critica final');
    if (isAppMode && !builder.state.missingInfoPolicy?.includes('pregunta')) risks.push('Podria implementar con huecos de contexto');

    if (builder.state.evidenceMode) strengths.push('Distingue hechos, inferencias y suposiciones');
    if (builder.state.crit) strengths.push('Revisa el borrador antes de responder');
    if (builder.state.neg) strengths.push('Reduce relleno y cambios fuera de alcance');
    if (material) strengths.push('Tiene material de referencia');
    if (builder.state.promptPhase) strengths.push('Trabajo separado por fase');
    if (builder.state.appScreens && builder.state.appData) strengths.push('Blueprint con pantallas y datos');

    const riskScore = Math.min(100, missing.length * 14 + risks.length * 10);
    const level: 'alto' | 'medio' | 'bajo' = riskScore >= 55 ? 'alto' : riskScore >= 25 ? 'medio' : 'bajo';
    return { missing, risks, strengths, level, isAppMode };
  }, [builder.state]);

  const appReadiness = useMemo(() => {
    const items = [
      { label: 'Objetivo definido', done: Boolean(builder.state.appGoal) },
      { label: 'Fase seleccionada', done: Boolean(builder.state.promptPhase) },
      { label: 'Stack tecnico', done: Boolean(builder.state.stack) },
      { label: 'Pantallas/flujos', done: Boolean(builder.state.appScreens) },
      { label: 'Datos/entidades', done: Boolean(builder.state.appData) },
      { label: 'Permisos/roles', done: Boolean(builder.state.appPermissions) },
      { label: 'Integraciones', done: Boolean(builder.state.appIntegrations) },
      { label: 'UX/estilo', done: Boolean(builder.state.appDesign) },
      { label: 'Criterios aceptacion', done: Boolean(builder.state.appAcceptance || builder.state.criterios) },
      { label: 'Restricciones', done: Boolean(builder.state.restriccion) },
    ];
    const done = items.filter(i => i.done).length;
    return { items, percent: Math.round((done / items.length) * 100) };
  }, [builder.state]);

  const guidedQuestions = useMemo(() => {
    if (!builder.state.appGoal) return [];
    const questions: string[] = [];
    if (!builder.state.appScreens) questions.push('¿Qué pantallas y flujos debe tener la app?');
    if (!builder.state.appData) questions.push('¿Qué entidades de datos existen y cómo se relacionan?');
    if (!builder.state.stack) questions.push('¿Qué stack debe usar el agente?');
    if (!builder.state.appPermissions) questions.push('¿Qué roles existen y qué puede hacer cada uno?');
    if (!builder.state.appIntegrations) questions.push('¿Hay integraciones externas o servicios de terceros?');
    if (!builder.state.appDesign) questions.push('¿Cómo debe sentirse la interfaz?');
    if (!builder.state.appAcceptance && !builder.state.criterios) questions.push('¿Cómo sabremos que está terminado?');
    if (!builder.state.restriccion) questions.push('¿Qué no debe tocar el agente bajo ningún concepto?');
    return questions.slice(0, 8);
  }, [builder.state]);

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-bg text-text pb-20 selection:bg-accent-blue/30">
      <Header
        model={builder.model}
        onModelChange={builder.setModel}
        onThemeToggle={() => document.body.classList.toggle('light-mode')}
        onClear={clearFields}
      />

      <main className="mx-auto max-w-[1800px] px-4 py-5 sm:px-6">
        <header className="mb-5 flex flex-col gap-3 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[24px] sm:text-[32px] font-black tracking-tighter bg-gradient-to-br from-text via-text to-accent bg-clip-text text-transparent mb-2">
              PROMPT BUILDER <span className="text-accent-blue italic uppercase">Avanzado</span>
            </h1>
            <p className="text-[14px] text-muted font-medium">
              Modo experto para afinar prompts, skills, agentes y workflows - <span className="text-accent/80 font-mono text-xs tracking-widest">V2.0-EXPERT</span>
            </p>
          </div>
          <div className="flex gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            <span className="rounded-lg border border-border bg-surface px-3 py-2">Configura</span>
            <span className="rounded-lg border border-accent-blue/30 bg-accent-blue/10 px-3 py-2 text-accent-blue">Genera</span>
            <span className="rounded-lg border border-border bg-surface px-3 py-2">Itera</span>
          </div>
        </header>

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[320px_minmax(0,1fr)_480px]">
          {/* ─── Sidebar izquierda ──────────────────────────────────────────── */}
          <aside className="space-y-5 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto xl:pr-1">
            {history.length > 0 && (
              <section className="mb-8">
                <p className="font-mono text-[10px] text-muted uppercase tracking-[0.2em] mb-3 opacity-50">Historial reciente</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {history.map((item) => (
                    <div key={item.id} className="relative min-w-[170px] shrink-0 group">
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(item.text);
                          showToast('Prompt recuperado');
                        }}
                        className="w-full rounded-xl border border-border bg-surface px-3 py-2 pr-7 text-left hover:border-accent-blue/40 transition-colors"
                      >
                        <span className="block truncate text-[11px] font-bold text-text">{item.title}</span>
                        <span className="block text-[10px] text-muted mt-1">{item.date}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromHistory(item.id)}
                        aria-label="Eliminar del historial"
                        className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded text-muted opacity-0 group-hover:opacity-100 hover:bg-surface2 hover:text-red-400 transition-all"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-border bg-surface/70 p-4">
              <div className="flex flex-col gap-3">
                <div className="flex-1">
                  <label htmlFor="custom-template-name" className="block text-[11px] text-label mb-1.5 tracking-wide uppercase">Nombre para guardar plantilla</label>
                  <Input
                    id="custom-template-name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Ej: Auditoria UI Sprint 3"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={saveCustomTemplate} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 text-[10px] font-bold uppercase tracking-wider text-accent">
                    <Save className="h-4 w-4" aria-hidden="true" /> Guardar
                  </button>
                  <button onClick={shareConfig} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-accent-purple/30 bg-accent-purple/10 px-3 text-[10px] font-bold uppercase tracking-wider text-accent-purple">
                    <LinkIcon className="h-4 w-4" aria-hidden="true" /> Compartir
                  </button>
                  <button onClick={exportData} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-surface2 px-3 text-[10px] font-bold uppercase tracking-wider text-text">
                    <Download className="h-4 w-4" aria-hidden="true" /> Exportar
                  </button>
                  <button onClick={() => importRef.current?.click()} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-surface2 px-3 text-[10px] font-bold uppercase tracking-wider text-text">
                    <Upload className="h-4 w-4" aria-hidden="true" /> Importar
                  </button>
                  <input
                    ref={importRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={importData}
                    title="Subir archivo de configuración"
                    aria-label="Subir archivo de configuración"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <button
                onClick={builder.activateHiperFocus}
                className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-accent-purple/30 bg-accent-purple/10 px-3 font-mono text-[10px] font-bold uppercase tracking-wider text-accent-purple hover:border-accent-purple transition-colors"
                aria-label="Activar modo hiper foco"
              >
                🧠 Modo Hiper-Foco
              </button>
              <button
                onClick={builder.activateDevilMode}
                className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 font-mono text-[10px] font-bold uppercase tracking-wider text-red-400 hover:border-red-500 transition-colors"
                aria-label="Activar modo diablo"
              >
                😈 Modo Diablo
              </button>
            </section>
          </aside>

          {/* ─── Centro: modo selector + formulario ─────────────────────────── */}
          <section className="grid grid-cols-1 gap-3 content-start 2xl:grid-cols-2">

            {/* Selector de modo — siempre visible */}
            <div className="2xl:col-span-2">
              <ModeSelector mode={appMode} onMode={setAppMode} />
            </div>

            {/* Modo Rápido */}
            {appMode === 'quick' && (
              <>
                <div className="2xl:col-span-2">
                  <TemplateGridSmart
                    templates={allTemplates}
                    activeId={activeTpl}
                    onSelect={handleTplSelect}
                  />
                </div>
                <div className="2xl:col-span-2">
                  <QuickForm
                    templateId={activeTpl}
                    template={allTemplates[activeTpl] ?? null}
                    state={builder.state}
                    onUpdate={builder.update}
                    onExpert={() => setAppMode('expert')}
                  />
                </div>
              </>
            )}

            {/* Modo Guiado */}
            {appMode === 'guided' && (
              <div className="2xl:col-span-2">
                <ElicitationFlow
                  onComplete={(patch) => {
                    builder.update(patch);
                    setAppMode('quick');
                  }}
                  onSkip={() => setAppMode('expert')}
                />
              </div>
            )}

            {/* Modo Experto */}
            {appMode === 'expert' && (
              <ExpertFormFull
                state={builder.state}
                onUpdate={builder.update}
                onUpdateTechnique={builder.updateTechnique}
                onSkillInsert={handleSkillInsert}
              />
            )}
          </section>

          {/* ─── Sidebar derecha ─────────────────────────────────────────────── */}
          <aside className="xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto">
            <section className={`mb-4 rounded-2xl border p-4 ${
              reliabilityAudit.level === 'alto' ? 'border-red-500/30 bg-red-500/10' :
              reliabilityAudit.level === 'medio' ? 'border-yellow-500/30 bg-yellow-500/10' :
              'border-accent/30 bg-accent/10'
            }`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${reliabilityAudit.level === 'alto' ? 'text-red-400' : reliabilityAudit.level === 'medio' ? 'text-yellow-400' : 'text-accent'}`} aria-hidden="true" />
                  <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text">Riesgo de alucinacion</h2>
                </div>
                <span className="rounded-md border border-border bg-surface px-2 py-1 font-mono text-[10px] uppercase text-text">{reliabilityAudit.level}</span>
              </div>
              <div className="space-y-3 text-[11px] leading-relaxed text-label">
                <div><p className="mb-1 font-bold uppercase tracking-wide text-text">Falta revisar</p><p>{reliabilityAudit.missing.length ? reliabilityAudit.missing.join(', ') : 'Nada critico detectado.'}</p></div>
                <div><p className="mb-1 font-bold uppercase tracking-wide text-text">Riesgos</p><p>{reliabilityAudit.risks.length ? reliabilityAudit.risks.join(', ') : 'Controles suficientes.'}</p></div>
                <div><p className="mb-1 font-bold uppercase tracking-wide text-text">Fortalezas</p><p>{reliabilityAudit.strengths.length ? reliabilityAudit.strengths.join(', ') : 'Aun no hay suficientes defensas activas.'}</p></div>
              </div>
            </section>

            {reliabilityAudit.isAppMode && (
            <section className="mb-4 rounded-2xl border border-border bg-surface p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text">Checklist app</h2>
                <span className="rounded-md border border-border bg-surface2 px-2 py-1 font-mono text-[10px] text-accent-blue">{appReadiness.percent}%</span>
              </div>
              <div className="grid grid-cols-1 gap-2 text-[11px] text-label">
                {appReadiness.items.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${item.done ? 'bg-accent' : 'bg-muted/40'}`} aria-hidden="true" />
                    <span className={item.done ? 'text-label' : 'text-muted'}>{item.label}</span>
                  </div>
                ))}
              </div>
            </section>
            )}

            {reliabilityAudit.isAppMode && guidedQuestions.length > 0 && (
            <section className="mb-4 rounded-2xl border border-border bg-surface p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text">Preguntas necesarias</h2>
                <span className="rounded-md border border-border bg-surface2 px-2 py-1 font-mono text-[10px] text-muted">{guidedQuestions.length}</span>
              </div>
              <div className="space-y-2">
                {guidedQuestions.map((q, i) => (
                  <div key={q} className="rounded-lg border border-border bg-surface2/60 p-3 text-[11px] leading-relaxed text-label">
                    <span className="mr-2 font-mono text-[10px] text-accent-blue">{i + 1}.</span>{q}
                  </div>
                ))}
              </div>
            </section>
            )}

            {reliabilityAudit.isAppMode && (
            <section className="mb-4 rounded-2xl border border-border bg-surface p-4">
              <h2 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text">Copiar prompt por fase</h2>
              <div className="space-y-3">
                <Select value={phaseCopy} onChange={(e) => setPhaseCopy(e.target.value)} aria-label="Seleccionar fase para copiar prompt">
                  {Object.keys(PHASE_INSTRUCTIONS).map((phase) => (
                    <option key={phase} value={phase}>{phase}</option>
                  ))}
                </Select>
                <button type="button" onClick={copyPhasePrompt} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-accent-blue/30 bg-accent-blue/10 px-3 font-mono text-[10px] font-bold uppercase tracking-wider text-accent-blue transition-colors hover:border-accent-blue" aria-label="Copiar prompt de la fase seleccionada">
                  <FileText className="h-4 w-4" aria-hidden="true" /> Copiar fase
                </button>
              </div>
            </section>
            )}

            {builder.generatedPrompt && (
              <div className="flex justify-end mb-2">
                <ExportMenu state={builder.state} model={builder.model} />
              </div>
            )}

            <OutputPanel
              className="xl:min-h-[calc(100vh-7rem)]"
              content={builder.generatedPrompt}
              quality={builder.quality.total}
              onCopy={(content) => {
                addToHistory(content, builder.state.tarea);
                addIteration(content, builder.quality.total);
                showToast('Copiado al portapapeles');
              }}
            />

            <ValidationPanel
              prompt={builder.generatedPrompt}
              state={builder.state}
            />

            <IterationPanel
              iterations={iterations}
              hasPrompt={Boolean(builder.generatedPrompt.trim())}
              onMarkWorked={() => {
                if (latestIteration) {
                  showToast('¡Guardado como versión exitosa!');
                }
              }}
              onMarkFailed={(reason: IterationFailReason, note?: string) => {
                if (latestIteration) {
                  const patch = markFailed(latestIteration.id, reason, note);
                  builder.update(patch);
                  showToast('Prompt ajustado automáticamente');
                }
              }}
              onClearAll={clearIterations}
            />

            <TestPanel prompt={builder.generatedPrompt} />

            <div className="mt-4">
              <ModelAdviceGrid model={builder.model} />
            </div>

            <div className="mt-4 rounded-2xl border border-border/50 bg-surface2/30 p-4">
              <p className="mb-3 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-muted">Atajos</p>
              <div className="space-y-2">
                {[
                  { keys: 'Ctrl+Enter', desc: 'Copiar prompt' },
                  { keys: '?', desc: 'Ayuda del bloque' },
                  { keys: '🧹', desc: 'Limpiar todo' },
                ].map(({ keys, desc }) => (
                  <div key={keys} className="flex items-center justify-between gap-3">
                    <kbd className="font-mono text-[9px] bg-surface border border-border rounded px-1.5 py-0.5 text-accent-blue">{keys}</kbd>
                    <span className="text-[10px] text-muted">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-accent px-5 py-2 font-mono text-[11px] font-bold text-black shadow-xl" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}

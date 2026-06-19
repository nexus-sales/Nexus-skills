'use client';

import { useState } from 'react';
import {
  ShieldAlert, Bug, Code2, RefreshCcw, Bot, FileText,
  Briefcase, Mail, Link as LinkIcon, Lock, Calendar,
  BarChart3, Rocket, Wrench, HelpCircle, X, Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PromptTemplate } from '@/types/prompt';

const ICON_MAP: Record<string, LucideIcon> = {
  audit: ShieldAlert, fix: Bug, componente: Code2, refactor: RefreshCcw,
  sysprompt: Bot, doc: FileText, propuesta: Briefcase, email: Mail,
  linkedin: LinkIcon, nis2: Lock, sprint: Calendar, analisis: BarChart3,
  conversion: Rocket, app_existente: Wrench,
};

const TEMPLATE_LABELS: Record<string, string> = {
  audit: 'Auditar', fix: 'Fix Bug', componente: 'Componente', refactor: 'Refactor',
  conversion: 'HTML→Next', sysprompt: 'SysPrompt', doc: 'Documento',
  propuesta: 'Propuesta', email: 'Email', linkedin: 'LinkedIn',
  nis2: 'NIS2', sprint: 'Sprint', analisis: 'Análisis', app_existente: 'App creada',
};

const TEMPLATE_HELP: Record<string, string> = {
  audit: 'Usala para revisar codigo con mirada de seguridad: vulnerabilidades, errores logicos, duplicados, malas practicas y severidad de cada hallazgo.',
  fix: 'Usala cuando tienes un bug concreto. Fuerza al modelo a encontrar causa raiz, proponer el cambio minimo y devolver codigo aplicable.',
  componente: 'Usala para crear componentes React/Tailwind listos para produccion, con props, accesibilidad y ejemplo de uso.',
  refactor: 'Usala cuando el codigo funciona pero necesita limpieza: legibilidad, duplicados, rendimiento y mantenimiento sin cambiar la API publica.',
  conversion: 'Usala para transformar HTML/CSS legacy en una estructura moderna de Next.js o React con componentes, hooks y estilos mantenibles.',
  sysprompt: 'Usala para disenar instrucciones de sistema para asistentes o agentes: rol, limites, formato, tono y manejo de casos fuera de alcance.',
  doc: 'Usala para convertir material tecnico o comercial en un documento estructurado: resumen, hallazgos, prioridades y plan de accion.',
  propuesta: 'Usala para redactar propuestas comerciales B2B con diagnostico, solucion, beneficios, ROI, inversion y proximos pasos.',
  email: 'Usala para emails comerciales de captacion o seguimiento: asunto, apertura, propuesta de valor breve y CTA claro.',
  linkedin: 'Usala para posts de LinkedIn con enfoque B2B: gancho inicial, desarrollo, aprendizaje y cierre orientado a conversacion.',
  nis2: 'Usala para preparar analisis y documentos de cumplimiento NIS2 adaptados a PYME, con brechas, medidas y prioridades.',
  sprint: 'Usala para convertir requisitos o backlog en un plan de sprints realista con objetivos, tareas, dependencias y definicion de done.',
  analisis: 'Usala para analizar una funcionalidad antes de construirla: casos de uso, impacto, complejidad, riesgos y ambiguedades.',
  app_existente: 'Usala cuando la app ya esta creada y solo necesitas un cambio, fix o mejora puntual. Fuerza al modelo a no tocar nada fuera del scope y a pedir archivos antes de inventarlos.',
};

interface TemplateGridProps {
  templates: Record<string, PromptTemplate>;
  activeId?: string;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
  layout?: 'grid' | 'sidebar';
}

export const TemplateGrid = ({ templates, activeId, onSelect, onDelete, layout = 'grid' }: TemplateGridProps) => {
  const [openHelp, setOpenHelp] = useState<string | null>(null);

  const getLabel = (id: string, tpl: PromptTemplate) => {
    if (TEMPLATE_LABELS[id]) return TEMPLATE_LABELS[id];
    if (tpl.name) return tpl.name.slice(0, 16);
    return id.startsWith('custom-') ? 'Custom' : id.slice(0, 10);
  };

  return (
    <div className={`grid gap-2 ${layout === 'sidebar' ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4 mb-8'}`}>
      {Object.entries(templates).map(([id, tpl]) => {
        const Icon = ICON_MAP[id] ?? Code2;
        const isActive = activeId === id;
        const isCustom = id.startsWith('custom-');
        const helpText = TEMPLATE_HELP[id] ?? (tpl.name ? `Plantilla guardada: ${tpl.name}` : `Plantilla: ${tpl.tarea?.slice(0, 80) || 'una tarea frecuente guardada por ti.'}`);
        const label = getLabel(id, tpl);

        return (
          <div key={id} className="relative">
            <button
              type="button"
              onClick={() => onSelect(id)}
              className={`flex w-full flex-col items-center justify-center rounded-xl border transition-all duration-200 group ${
                layout === 'sidebar' ? 'min-h-[92px] p-3 pt-5' : 'p-4 pt-6'
              } ${
                isActive
                  ? 'border-accent-blue bg-accent-blue/10 ring-1 ring-accent-blue/50'
                  : 'border-border bg-surface hover:border-accent-blue/40 hover:bg-accent-blue/5'
              }`}
              aria-label={`Cargar plantilla ${label}`}
            >
              <Icon className={`${layout === 'sidebar' ? 'w-5 h-5 mb-1.5' : 'w-6 h-6 mb-2'} transition-transform group-hover:scale-110 ${isActive ? 'text-accent-blue' : 'text-muted'}`} aria-hidden="true" />
              <span className={`text-[11px] font-bold uppercase tracking-tight text-center leading-tight ${isActive ? 'text-text' : 'text-muted group-hover:text-text'}`}>
                {label}
              </span>
              {isCustom && (
                <span className="mt-1 font-mono text-[8px] text-accent/60 uppercase tracking-widest">custom</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setOpenHelp(openHelp === id ? null : id)}
              aria-label={`Ayuda de plantilla ${label}`}
              className={`absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-lg border text-muted transition-colors ${openHelp === id ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-border bg-surface2 hover:border-accent-blue/40 hover:text-accent-blue'}`}
            >
              <HelpCircle className="h-3 w-3" aria-hidden="true" />
            </button>

            {isCustom && onDelete && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(id); }}
                aria-label={`Eliminar plantilla ${label}`}
                className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-lg border border-border bg-surface2 text-muted transition-colors hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
              </button>
            )}

            {openHelp === id && (
              <div className="absolute left-0 right-0 top-2 z-30 rounded-xl border border-accent-blue/30 bg-surface3 p-3 pr-9 text-left shadow-2xl">
                <button
                  type="button"
                  onClick={() => setOpenHelp(null)}
                  aria-label="Cerrar ayuda"
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-surface2 hover:text-text"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <p className="mb-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-accent-blue">{label}</p>
                <p className="text-[11px] leading-relaxed text-label">{helpText}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

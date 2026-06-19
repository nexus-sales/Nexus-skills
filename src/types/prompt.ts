export interface PromptTemplate {
  name?: string;
  rol: string;
  tarea: string;
  proyecto: string;
  stack: string;
  destino: string;
  restriccion: string;
  outputType: string;
  ext: string;
  tono: string;
  criterios?: string;
  autonomia?: string;
  fuentes?: string;
  cot: boolean;
  sc: boolean;
  xml: boolean;
  neg: boolean;
  ej: boolean;
  pre: boolean;
  int?: boolean;
  crit?: boolean;
  devil?: boolean;
  matType: string;
  matFile: string;
  material?: string;
  evidenceMode?: boolean;
  assumptionPolicy?: string;
  missingInfoPolicy?: string;
  verificationDepth?: string;
  antiHallucinationNotes?: string;
  appGoal?: string;
  appType?: string;
  promptPhase?: string;
  appScreens?: string;
  appData?: string;
  appIntegrations?: string;
  appPermissions?: string;
  appDesign?: string;
  appAcceptance?: string;
  visibleFields?: FieldConfig[];
  quickSummary?: string;
}

// Alias usado en hooks y lib functions
export type PromptFormState = PromptTemplate;

// ─── Perfil de usuario (tabla profiles en Supabase) ─────────────────────────

export interface Profile {
  id: string;
  email: string | null;
  nombre: string | null;
  role: string;               // 'user' | 'admin' | ...
  is_blocked: boolean;
  telefono: string | null;
  zone: string;
  permissions: string[];
  full_name_v7: string | null;
  phone_v7: string | null;
  company_name_v7: string | null;
  signature_v7: string | null;
  created_at: string | null;
  updated_v7_at: string | null;
}

export type TargetModel = 'universal' | 'claude' | 'gemini' | 'gpt4' | 'deepseek';

// ─── Skills ──────────────────────────────────────────────────────────────────

export type SkillCategory =
  | 'behavior'   // cómo piensa/razona la IA
  | 'format'     // cómo formatea el output
  | 'context'    // contexto de empresa/proyecto
  | 'security'   // anti-alucinación, restricciones
  | 'workflow'   // pasos de un flujo
  | 'custom';

export type SkillInsertTarget =
  | 'tarea'       // se añade al campo Tarea
  | 'restriccion' // se añade al campo Restricciones
  | 'autonomia'   // se añade al campo Autonomía
  | 'system';     // se inyecta al system prompt del agente

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: SkillCategory;
  content: string;           // el texto de instrucción que se inserta
  insertTarget: SkillInsertTarget;
  isPredefined: boolean;
  isExportable: boolean;     // opción C: exportar como .instructions.md
  createdAt: string;
  updatedAt: string;
}

// ─── Workflows ───────────────────────────────────────────────────────────────

export interface WorkflowStep {
  id: string;
  order: number;
  type: 'skill' | 'agent' | 'prompt';
  refId: string;             // id del skill, agente o plantilla
  label: string;
  inputFrom?: string;        // id del step anterior cuyo output se pasa como input
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  icon: string;
  steps: WorkflowStep[];
  isPredefined: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Agentes ─────────────────────────────────────────────────────────────────

export type AgentTool =
  | 'web_search'
  | 'code_execution'
  | 'file_read'
  | 'supabase_query';

export type AutonomyLevel =
  | 'ask_first'
  | 'plan_confirm'
  | 'execute_declare'
  | 'full_auto';

export type TechniqueId =
  | 'cot' | 'sc' | 'xml' | 'neg'
  | 'ej' | 'pre' | 'int' | 'crit' | 'devil';

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  role: string;
  systemPrompt: string;
  model: TargetModel;
  tools: AgentTool[];
  techniques: TechniqueId[];
  skillIds: string[];        // skills asignados al agente
  outputFormat: string;
  autonomyLevel: AutonomyLevel;
  createdAt: string;
  updatedAt: string;
  isCustom: boolean;
}

// ─── Historial y puntuación ──────────────────────────────────────────────────

export interface PromptHistory {
  id: string;
  text: string;
  title: string;
  date: string;
  agentId?: string;
}

export interface QualityScore {
  total: number;
  breakdown: {
    role: number;
    task: number;
    context: number;
    format: number;
    techniques: number;
    criteria: number;
  };
  tips: string[];
}

// ─── Validacion objetiva de prompts ──────────────────────────────────────────

export interface ValidationCriterion {
  id: string;
  label: string;
  description: string;
  weight: number;
  keywords: string[];
}

export interface ValidationCase {
  id: string;
  name: string;
  description: string;
  templateIds: string[];
  scenario: string;
  baselinePrompt: string;
  expectedSignals: string[];
  failureSignals: string[];
  criteria: ValidationCriterion[];
}

export interface ValidationCriterionResult {
  id: string;
  label: string;
  description: string;
  weight: number;
  matched: boolean;
  evidence: string[];
}

export interface PromptValidationReport {
  score: number;
  level: 'fuerte' | 'aceptable' | 'debil';
  baselineScore: number;
  criteria: ValidationCriterionResult[];
  strengths: string[];
  gaps: string[];
  evaluatorPrompt: string;
}

// ─── Iteración de prompts ────────────────────────────────────────────────────

export type IterationFailReason =
  | 'too_generic'
  | 'wrong_format'
  | 'missing_context'
  | 'wrong_tone'
  | 'too_long'
  | 'too_short'
  | 'other'

export interface PromptIteration {
  id: string
  version: number
  prompt: string
  score: number
  createdAt: string
  failReason?: IterationFailReason
  note?: string
}

// ─── Fase 14: Rediseño UX ─────────────────────────────────────────────────────

export type FieldId =
  | 'rol' | 'tarea' | 'proyecto' | 'stack' | 'destino' | 'restriccion'
  | 'outputType' | 'ext' | 'tono' | 'criterios' | 'autonomia' | 'fuentes'
  | 'material' | 'matType' | 'matFile' | 'techniques'
  | 'appGoal' | 'appType' | 'promptPhase' | 'appScreens' | 'appData'
  | 'appIntegrations' | 'appPermissions' | 'appDesign' | 'appAcceptance'

export type FieldStatus = 'required' | 'prefilled' | 'advanced' | 'hidden'

export interface FieldConfig {
  id: FieldId
  status: FieldStatus
  label?: string
  placeholder?: string
}

export type AppMode = 'quick' | 'guided' | 'expert'


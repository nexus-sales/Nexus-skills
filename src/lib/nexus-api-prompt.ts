import type { StructuredProjectBlueprint } from '@/types/project-blueprint'
import type { NexusApiArtifacts } from '@/types/nexus-api'
import { NexusApiParseError } from '@/types/nexus-api'
import type {
  AgentTool,
  AutonomyLevel,
  SkillCategory,
  SkillInsertTarget,
  TargetModel,
  TechniqueId,
  WorkflowStep,
} from '@/types/prompt'

// ─── Enum constants ───────────────────────────────────────────────────────────

const TARGET_MODELS = ['universal', 'claude', 'gemini', 'gpt4', 'deepseek'] as const
const SKILL_CATEGORIES = ['behavior', 'format', 'context', 'security', 'workflow', 'custom'] as const
const SKILL_INSERT_TARGETS = ['tarea', 'restriccion', 'autonomia', 'system'] as const
const AUTONOMY_LEVELS = ['ask_first', 'plan_confirm', 'execute_declare', 'full_auto'] as const
const AGENT_TOOLS = ['web_search', 'code_execution', 'file_read', 'supabase_query'] as const
const TECHNIQUE_IDS = ['cot', 'sc', 'xml', 'neg', 'ej', 'pre', 'int', 'crit', 'devil'] as const
const STEP_TYPES = ['skill', 'agent', 'prompt'] as const

// ─── Safe extractors ──────────────────────────────────────────────────────────

function safeStr(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function safeStrArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((item): item is string => typeof item === 'string')
}

function safeEnum<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(v as string) ? (v as T) : fallback
}

function safeBool(v: unknown, fallback = false): boolean {
  return typeof v === 'boolean' ? v : fallback
}

function safeNumber(v: unknown, fallback = 0): number {
  return typeof v === 'number' && isFinite(v) ? v : fallback
}

function safeObj(v: unknown): Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {}
}

function safeAgentTools(v: unknown): AgentTool[] {
  if (!Array.isArray(v)) return []
  return v.filter((item): item is AgentTool =>
    (AGENT_TOOLS as readonly string[]).includes(item as string)
  )
}

function safeTechniqueIds(v: unknown): TechniqueId[] {
  if (!Array.isArray(v)) return []
  return v.filter((item): item is TechniqueId =>
    (TECHNIQUE_IDS as readonly string[]).includes(item as string)
  )
}

function safeSteps(v: unknown): WorkflowStep[] {
  if (!Array.isArray(v)) return []
  return v
    .filter((item): item is Record<string, unknown> =>
      typeof item === 'object' && item !== null
    )
    .map((item, index) => ({
      id: safeStr(item['id'], `step-${index}`),
      order: safeNumber(item['order'], index),
      type: safeEnum(item['type'], STEP_TYPES, 'prompt' as const),
      refId: safeStr(item['refId'], ''),
      label: safeStr(item['label'], `Paso ${index + 1}`),
    }))
}

function stripMarkdownFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()
}

function serializeList(items: string[]): string {
  if (items.length === 0) return '- (vacío)'
  return items.map((item) => `- ${item}`).join('\n')
}

// ─── System Prompt ────────────────────────────────────────────────────────────

export function buildNexusApiSystemPrompt(): string {
  return `You are an AI system architect. Your task is to enrich the artifacts of a software project using a pre-analyzed StructuredProjectBlueprint as your only source of truth.

CRITICAL RULES — never violate:

1. The blueprint you receive is already analyzed and classified. Do not reclassify the project category or subtype.
2. Do NOT add new items to confirmedRequirements. That list is final and closed.
3. Your generated artifacts must fully respect these blueprint fields and never contradict them: category, subtype, confirmedRequirements, constraints, mvpScope, futureScope.
4. Output ONLY a valid JSON object. No markdown, no code fences, no explanation before or after. Raw JSON only.
5. The JSON must contain exactly these top-level keys: recommendedPrompt, skillDraft, workflowDraft, agentDraft, finalSystem, expectedResult.
6. Every string field must be non-empty. Every array field must have at least one item.

OUTPUT SCHEMA (follow exactly):

{
  "recommendedPrompt": {
    "title": string,
    "prompt": string,
    "rationale": string,
    "targetModel": "universal" | "claude" | "gemini" | "gpt4" | "deepseek",
    "qualitySignals": string[]
  },
  "skillDraft": {
    "name": string,
    "description": string,
    "category": "behavior" | "format" | "context" | "security" | "workflow" | "custom",
    "content": string,
    "insertTarget": "tarea" | "restriccion" | "autonomia" | "system",
    "isExportable": boolean
  },
  "workflowDraft": {
    "name": string,
    "description": string,
    "steps": [
      {
        "id": string,
        "order": number (0-indexed),
        "type": "skill" | "agent" | "prompt",
        "refId": string,
        "label": string
      }
    ]
  },
  "agentDraft": {
    "name": string,
    "description": string,
    "role": string,
    "systemPrompt": string,
    "model": "universal" | "claude" | "gemini" | "gpt4" | "deepseek",
    "tools": Array<"web_search" | "code_execution" | "file_read" | "supabase_query">,
    "techniques": Array<"cot" | "sc" | "xml" | "neg" | "ej" | "pre" | "int" | "crit" | "devil">,
    "skillIds": string[],
    "outputFormat": string,
    "autonomyLevel": "ask_first" | "plan_confirm" | "execute_declare" | "full_auto"
  },
  "finalSystem": {
    "name": string,
    "purpose": string,
    "reusableAssets": string[],
    "operatingFlow": string[],
    "handoffInstructions": string,
    "limitations": string[],
    "maintenanceNotes": string[]
  },
  "expectedResult": {
    "summary": string,
    "deliverables": string[],
    "successCriteria": string[],
    "exampleOutcome": string,
    "measurableImpact": string[]
  }
}`
}

// ─── User Prompt ──────────────────────────────────────────────────────────────

export function buildNexusApiUserPrompt(blueprint: StructuredProjectBlueprint): string {
  const integrationNames = blueprint.integrationCapabilities.map(
    (ic) => `${ic.name} (${ic.capabilities.join(', ')})`
  )

  return `PROJECT BLUEPRINT

Category: ${blueprint.category}
Subtype: ${blueprint.subtype ?? 'none'}
Subtype confidence: ${blueprint.subtypeConfidence ?? 'n/a'}
Confidence: ${blueprint.confidence} / 100
Confidence level: ${blueprint.confidenceLevel}
Business model: ${blueprint.businessModel ?? 'not defined'}

Objective: ${blueprint.objective}
Audience: ${blueprint.audience.join(', ')}

CONFIRMED REQUIREMENTS (closed — do not modify)
${serializeList(blueprint.confirmedRequirements)}

INFERRED REQUIREMENTS (may amplify with [INFERRED] prefix)
${serializeList(blueprint.inferredRequirements)}

SUGGESTED REQUIREMENTS (may amplify with [SUGGESTED] prefix)
${serializeList(blueprint.suggestedRequirements)}

MVP SCOPE
${serializeList(blueprint.mvpScope)}

FUTURE SCOPE
${serializeList(blueprint.futureScope)}

NON-FUNCTIONAL REQUIREMENTS
${serializeList(blueprint.nonFunctionalRequirements)}

IMPLEMENTATION RISKS
${serializeList(blueprint.implementationRisks)}

SCREENS
${serializeList(blueprint.screens)}

ENTITIES
${serializeList(blueprint.entities)}

ROLES
${serializeList(blueprint.roles)}

INTEGRATIONS (confirmed)
${serializeList(blueprint.integrations)}

INTEGRATION CAPABILITIES
${serializeList(integrationNames)}

INTEGRATIONS (suggested)
${serializeList(blueprint.suggestedIntegrations)}

VISUAL DESIGN (confirmed)
${serializeList(blueprint.visualDesign)}

VISUAL DESIGN (suggested)
${serializeList(blueprint.suggestedVisualDesign)}

MONETIZATION
${serializeList(blueprint.monetization)}

CONSTRAINTS
${serializeList(blueprint.constraints)}

RISKS
${serializeList(blueprint.risks)}

SUCCESS METRICS
${serializeList(blueprint.successMetrics)}

Original idea: "${blueprint.originalIdea}"

Generate the artifacts JSON now. Output raw JSON only — no markdown, no explanation.`
}

// ─── Response Parser ──────────────────────────────────────────────────────────

export function parseNexusApiResponse(raw: string): NexusApiArtifacts {
  const cleaned = stripMarkdownFences(raw)

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new NexusApiParseError('La respuesta de la API no es JSON válido', raw)
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new NexusApiParseError('La respuesta JSON no es un objeto', raw)
  }

  const data = parsed as Record<string, unknown>

  // ── recommendedPrompt ──────────────────────────────────────────────────────
  const rp = safeObj(data['recommendedPrompt'])

  const recommendedPrompt = {
    title: safeStr(rp['title'], 'Prompt sin título'),
    prompt: safeStr(rp['prompt'], ''),
    rationale: safeStr(rp['rationale'], ''),
    targetModel: safeEnum<TargetModel>(rp['targetModel'], TARGET_MODELS, 'claude'),
    qualitySignals: safeStrArray(rp['qualitySignals']),
  }

  // ── skillDraft ─────────────────────────────────────────────────────────────
  const sd = safeObj(data['skillDraft'])

  const skillDraft = {
    name: safeStr(sd['name'], 'Skill sin nombre'),
    description: safeStr(sd['description'], ''),
    category: safeEnum<SkillCategory>(sd['category'], SKILL_CATEGORIES, 'custom'),
    content: safeStr(sd['content'], ''),
    insertTarget: safeEnum<SkillInsertTarget>(sd['insertTarget'], SKILL_INSERT_TARGETS, 'system'),
    isExportable: safeBool(sd['isExportable'], true),
  }

  // ── workflowDraft ──────────────────────────────────────────────────────────
  const wd = safeObj(data['workflowDraft'])

  const workflowDraft = {
    name: safeStr(wd['name'], 'Workflow sin nombre'),
    description: safeStr(wd['description'], ''),
    steps: safeSteps(wd['steps']),
  }

  // ── agentDraft ─────────────────────────────────────────────────────────────
  const ad = safeObj(data['agentDraft'])

  const agentDraft = {
    name: safeStr(ad['name'], 'Agente sin nombre'),
    description: safeStr(ad['description'], ''),
    role: safeStr(ad['role'], ''),
    systemPrompt: safeStr(ad['systemPrompt'], ''),
    model: safeEnum<TargetModel>(ad['model'], TARGET_MODELS, 'claude'),
    tools: safeAgentTools(ad['tools']),
    techniques: safeTechniqueIds(ad['techniques']),
    skillIds: safeStrArray(ad['skillIds']),
    outputFormat: safeStr(ad['outputFormat'], 'text'),
    autonomyLevel: safeEnum<AutonomyLevel>(ad['autonomyLevel'], AUTONOMY_LEVELS, 'plan_confirm'),
  }

  // ── finalSystem ───────────────────────────────────────────────────────────
  const fs = safeObj(data['finalSystem'])

  const finalSystem = {
    name: safeStr(fs['name'], 'Sistema sin nombre'),
    purpose: safeStr(fs['purpose'], ''),
    reusableAssets: safeStrArray(fs['reusableAssets']),
    operatingFlow: safeStrArray(fs['operatingFlow']),
    handoffInstructions: safeStr(fs['handoffInstructions'], ''),
    limitations: safeStrArray(fs['limitations']),
    maintenanceNotes: safeStrArray(fs['maintenanceNotes']),
  }

  // ── expectedResult ────────────────────────────────────────────────────────
  const er = safeObj(data['expectedResult'])

  const expectedResult = {
    summary: safeStr(er['summary'], ''),
    deliverables: safeStrArray(er['deliverables']),
    successCriteria: safeStrArray(er['successCriteria']),
    exampleOutcome: safeStr(er['exampleOutcome'], ''),
    measurableImpact: safeStrArray(er['measurableImpact']),
  }

  return {
    recommendedPrompt,
    skillDraft,
    workflowDraft,
    agentDraft,
    finalSystem,
    expectedResult,
  }
}

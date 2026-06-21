import type {
  Agent,
  AutonomyLevel,
  PromptTemplate,
  Skill,
  TargetModel,
  TechniqueId,
  Workflow,
  WorkflowStep,
} from '@/types/prompt'
import type { ProjectBlueprint } from '@/types/blueprint'
import type { PromptBlueprint } from '@/types/prompt-blueprint'
import type { StructuredProjectBlueprint } from '@/types/project-blueprint'

export type NexusStageStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'needs_review'
  | 'blocked'

export interface NexusSystemStage {
  id:
    | 'idea'
    | 'analysis'
    | 'recommended_prompt'
    | 'skill_draft'
    | 'workflow_draft'
    | 'agent_draft'
    | 'final_system'
    | 'expected_result'
  label: string
  description: string
  status: NexusStageStatus
  order: number
  completedAt?: string
}

export interface NexusIdeaAnalysis {
  summary: string
  domain: string
  objective: string
  audience: string
  features: string[]
  visualDesign: string[]
  languages: string[]
  content: string[]
  entities: string[]
  roles: string[]
  pendingQuestions: string[]
  monetization: string[]
  integrations: string[]
  restrictions: string[]
  priority: string
  projectType: string
  targetUser: string
  mainGoal: string
  useCases: string[]
  requiredInputs: string[]
  expectedOutputs: string[]
  risks: string[]
  assumptions: string[]
  confidence: number
}

export interface NexusRecommendedPrompt {
  title: string
  prompt: string
  rationale: string
  targetModel: TargetModel
  templateId?: string
  promptTemplateDraft?: Partial<PromptTemplate>
  qualitySignals: string[]
}

export interface NexusSkillDraft {
  name: string
  description: string
  category: Skill['category']
  content: string
  insertTarget: Skill['insertTarget']
  isExportable: boolean
  compatibleSkill?: Partial<Skill>
  beginnerExplanation?: string
}

export interface NexusWorkflowDraft {
  name: string
  description: string
  steps: WorkflowStep[]
  compatibleWorkflow?: Partial<Workflow>
}

export interface NexusAgentDraft {
  name: string
  description: string
  role: string
  systemPrompt: string
  model: TargetModel
  tools: Agent['tools']
  techniques: TechniqueId[]
  skillIds: string[]
  outputFormat: string
  autonomyLevel: AutonomyLevel
  compatibleAgent?: Partial<Agent>
}

export interface NexusFinalSystem {
  name: string
  purpose: string
  reusableAssets: string[]
  operatingFlow: string[]
  handoffInstructions: string
  limitations: string[]
  maintenanceNotes: string[]
}

export interface NexusExpectedResult {
  summary: string
  deliverables: string[]
  successCriteria: string[]
  exampleOutcome: string
  measurableImpact: string[]
}

export interface NexusSystem {
  id: string
  title: string
  originalIdea: string
  blueprint?: ProjectBlueprint
  structuredBlueprint?: StructuredProjectBlueprint
  promptBlueprint?: PromptBlueprint
  analysis: NexusIdeaAnalysis
  recommendedPrompt: NexusRecommendedPrompt
  skillDraft: NexusSkillDraft
  workflowDraft: NexusWorkflowDraft
  agentDraft: NexusAgentDraft
  finalSystem: NexusFinalSystem
  expectedResult: NexusExpectedResult
  stages: NexusSystemStage[]
  createdAt: string
  updatedAt: string
  version: string
}

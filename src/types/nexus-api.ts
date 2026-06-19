import type {
  NexusAgentDraft,
  NexusExpectedResult,
  NexusFinalSystem,
  NexusRecommendedPrompt,
  NexusSkillDraft,
  NexusWorkflowDraft,
} from '@/types/nexus'

export interface NexusApiArtifacts {
  recommendedPrompt: NexusRecommendedPrompt
  skillDraft: NexusSkillDraft
  workflowDraft: NexusWorkflowDraft
  agentDraft: NexusAgentDraft
  finalSystem: NexusFinalSystem
  expectedResult: NexusExpectedResult
}

export class NexusApiParseError extends Error {
  constructor(
    message: string,
    public readonly raw: string
  ) {
    super(message)
    this.name = 'NexusApiParseError'
  }
}

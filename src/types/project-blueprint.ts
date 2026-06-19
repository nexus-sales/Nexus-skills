export type StructuredProjectCategory =
  | 'booking-system'
  | 'course-platform'
  | 'landing-page'
  | 'marketplace'
  | 'crm'
  | 'support-system'
  | 'content-system'
  | 'custom'

export type RequirementSeverity =
  | 'critical'
  | 'important'
  | 'optional'

export interface PendingQuestion {
  questionKey?: string
  question: string
  severity: RequirementSeverity
  reason: string
}

export interface IntegrationCapability {
  name: string
  capabilities: string[]
  risk: string
}

export interface StructuredProjectBlueprint {
  id: string
  category: StructuredProjectCategory
  subtype?: string
  subtypeConfidence?: number
  subtypeReasoning?: string
  subtypeSignals?: string[]
  businessModel?: string
  mvpScope: string[]
  futureScope: string[]
  nonFunctionalRequirements: string[]
  implementationRisks: string[]
  integrationCapabilities: IntegrationCapability[]
  successMetrics: string[]
  confidence: number
  confidenceLevel: 'high' | 'medium' | 'low'
  needsDiscovery: boolean
  originalIdea: string
  baseIdea?: string
  incorporatedDiscoveryAnswers?: string[]
  objective: string
  audience: string[]
  confirmedRequirements: string[]
  inferredRequirements: string[]
  suggestedRequirements: string[]
  screens: string[]
  entities: string[]
  roles: string[]
  integrations: string[]
  suggestedIntegrations: string[]
  visualDesign: string[]
  suggestedVisualDesign: string[]
  monetization: string[]
  constraints: string[]
  risks: string[]
  pendingQuestions: PendingQuestion[]
}

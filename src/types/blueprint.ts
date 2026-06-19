import type { ProjectCategory } from '@/lib/project-detector'

export type BlueprintRiskLevel = 'low' | 'medium' | 'high'

export type BlueprintConfidence = number

export interface ProjectBlueprint {
  id: string
  originalIdea: string
  projectType: string
  category: ProjectCategory
  confidence: BlueprintConfidence
  objective: string
  audience: string
  features: string[]
  confirmedFeatures?: string[]
  inferredFeatures?: string[]
  entities: string[]
  roles: string[]
  integrations: string[]
  confirmedIntegrations?: string[]
  suggestedIntegrations?: string[]
  visualDesign: string[]
  confirmedVisualDesign?: string[]
  suggestedVisualDesign?: string[]
  monetization: string[]
  confirmedMonetization?: string[]
  inferredMonetization?: string[]
  suggestedMonetization?: string[]
  constraints: string[]
  risks: string[]
  questions: string[]
  languages: string[]
  createdAt: string
}

import type { StructuredProjectCategory } from '@/types/project-blueprint'

export interface AiClassification {
  category: StructuredProjectCategory
  subtype?: string
  confidence: number
  reasoning: string
  objective: string
  entities: string[]
  roles: string[]
  screens: string[]
  audience: string[]
  confirmedRequirements: string[]
  suggestedRequirements: string[]
  integrations: string[]
}

export class AiClassificationParseError extends Error {
  constructor(
    message: string,
    public readonly raw: string
  ) {
    super(message)
    this.name = 'AiClassificationParseError'
  }
}

import type { TargetModel } from '@/types/prompt'
import type { PendingQuestion } from '@/types/project-blueprint'

export interface PromptBlueprint {
  role: string
  task: string
  context: string
  requirements: string[]
  entities: string[]
  constraints: string[]
  questions: PendingQuestion[]
  outputFormat: string
  targetModel: TargetModel
}

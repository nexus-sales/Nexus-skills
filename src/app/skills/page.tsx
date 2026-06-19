import type { Metadata } from 'next'
import { SkillsPageClient } from './SkillsPageClient'

export const metadata: Metadata = {
  title: 'Skills - Nexus',
  description: 'Bloques de instrucción reutilizables para prompts, agentes y sistemas IA',
}

export default function SkillsPage() {
  return <SkillsPageClient />
}

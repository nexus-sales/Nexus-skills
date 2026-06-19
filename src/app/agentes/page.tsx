import type { Metadata } from 'next'
import { AgentsPageClient } from './AgentsPageClient'

export const metadata: Metadata = {
  title: 'Agentes IA - Nexus',
  description: 'Configura y ejecuta agentes de IA especializados para tus sistemas reutilizables',
}

export default function AgentsPage() {
  return <AgentsPageClient />
}

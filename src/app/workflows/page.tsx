import type { Metadata } from 'next'
import { WorkflowsPageClient } from './WorkflowsPageClient'

export const metadata: Metadata = {
  title: 'Workflows - Nexus',
  description: 'Encadena skills y agentes en flujos de trabajo reutilizables',
}

export default function WorkflowsPage() {
  return <WorkflowsPageClient />
}

import type { Metadata } from 'next'
import { AgentRunnerClient } from './AgentRunnerClient'

export const metadata: Metadata = {
  title: 'Ejecutar Agente - Nexus',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function AgentPage({ params }: Props) {
  const { id } = await params
  return <AgentRunnerClient agentId={id} />
}

import type { Metadata } from 'next'
import { WorkflowRunnerClient } from './WorkflowRunnerClient'

export const metadata: Metadata = {
  title: 'Ejecutar Workflow - Nexus',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function WorkflowRunnerPage({ params }: Props) {
  const { id } = await params
  return <WorkflowRunnerClient workflowId={id} />
}

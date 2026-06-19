'use client';

import { AgentRunner } from '@/components/agents/AgentRunner';

interface Props {
  agentId: string;
}

export function AgentRunnerClient({ agentId }: Props) {
  return <AgentRunner agentId={agentId} />;
}

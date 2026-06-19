'use client'

import { CheckCircle2, Cpu, Loader2, TriangleAlert, XCircle } from 'lucide-react'
import type { NexusGenerationState } from '@/hooks/useNexusSystem'

interface GenerationStatusBadgeProps {
  state: NexusGenerationState
}

type ActiveState = Exclude<NexusGenerationState, 'idle'>

interface BadgeConfig {
  label: string
  wrapperClass: string
  spin: boolean
}

const BADGE_CONFIG: Record<ActiveState, BadgeConfig> = {
  blueprint_ready: {
    label: 'Blueprint listo',
    wrapperClass: 'border-accent-blue/30 bg-accent-blue/10 text-accent-blue',
    spin: false,
  },
  classifying: {
    label: 'Clasificando dominio...',
    wrapperClass: 'border-violet-500/50 bg-violet-500/10 text-violet-400',
    spin: true,
  },
  enriching: {
    label: 'Mejorando con Claude...',
    wrapperClass: 'border-accent-blue/50 bg-accent-blue/15 text-accent-blue',
    spin: true,
  },
  completed: {
    label: 'Enriquecido con Claude',
    wrapperClass: 'border-green-500/30 bg-green-500/10 text-green-400',
    spin: false,
  },
  fallback_local: {
    label: 'Modo local',
    wrapperClass: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    spin: false,
  },
  error: {
    label: 'Error',
    wrapperClass: 'border-red-500/30 bg-red-500/10 text-red-400',
    spin: false,
  },
}

function StateIcon({ state, spin }: { state: ActiveState; spin: boolean }) {
  const cls = `h-3.5 w-3.5 shrink-0${spin ? ' animate-spin' : ''}`
  switch (state) {
    case 'blueprint_ready': return <Cpu className={cls} aria-hidden="true" />
    case 'classifying':     return <Loader2 className={cls} aria-hidden="true" />
    case 'enriching':       return <Loader2 className={cls} aria-hidden="true" />
    case 'completed':       return <CheckCircle2 className={cls} aria-hidden="true" />
    case 'fallback_local':  return <TriangleAlert className={cls} aria-hidden="true" />
    case 'error':           return <XCircle className={cls} aria-hidden="true" />
  }
}

export function GenerationStatusBadge({ state }: GenerationStatusBadgeProps) {
  if (state === 'idle') return null

  const { label, wrapperClass, spin } = BADGE_CONFIG[state]

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={`Estado de generación: ${label}`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${wrapperClass}`}
    >
      <StateIcon state={state} spin={spin} />
      {label}
    </span>
  )
}

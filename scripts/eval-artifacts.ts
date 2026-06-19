/**
 * Nexus Artifact Quality Eval — Phase 23 baseline
 *
 * Measures domain fidelity of local vs AI-enriched artifacts.
 * Does NOT modify the pipeline — read-only measurement only.
 *
 * Usage:
 *   1. npm run dev   (ANTHROPIC_API_KEY must be set in .env.local)
 *   2. npx tsx scripts/eval-artifacts.ts
 *
 * Output: stdout table + evals/baseline.md
 */

import * as fs from 'fs'
import * as path from 'path'
import {
  generateLocalNexusSystem,
  isNexusApiArtifactsUsable,
  mergeWithApiArtifacts,
} from '@/lib/nexus-system-generator'
import { prepareBlueprintForApi } from '@/lib/prepare-blueprint-for-api'
import type { AiClassification } from '@/types/ai-classification'
import type { NexusApiArtifacts } from '@/types/nexus-api'
import type { NexusSystem } from '@/types/nexus'
import type { StructuredProjectBlueprint } from '@/types/project-blueprint'

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:3000'
const TIMEOUT_MS = 30_000

const IDEAS: string[] = [
  'Necesito una app de botánica para catalogar plantas y cuidados.',
  'Quiero una app para un gimnasio con acceso QR, rutinas y monitor IA.',
  'App para un coworking que gestione reservas de salas y miembros.',
  'Plataforma para una autoescuela: alumnos, clases y exámenes.',
  'Tienda online de ropa con carrito y pagos.',
  'CRM para una agencia inmobiliaria.',
  'Blog de recetas con categorías.',
  'Necesito una app.',
]

const META_TOKENS = [
  'nexus',
  'sistema reutilizable',
  'transforma la idea',
  'convertir la idea',
  'idea base',
  'prompt recomendado',
]

const STOP_WORDS = new Set([
  'para', 'con', 'una', 'que', 'los', 'las', 'del', 'este', 'esta', 'como',
  'por', 'mas', 'crear', 'hacer', 'tener', 'poder', 'sistema', 'aplicacion',
  'plataforma', 'proyecto', 'tipo', 'cada', 'todos', 'todo', 'solo', 'bien',
  'debe', 'sera', 'tiene', 'and', 'the', 'for', 'with', 'that', 'from',
])

// ─── Types ───────────────────────────────────────────────────────────────────

type ArtifactKey =
  | 'recommendedPrompt'
  | 'skillDraft'
  | 'workflowDraft'
  | 'agentDraft'
  | 'finalSystem'
  | 'expectedResult'

const ARTIFACT_KEYS: ArtifactKey[] = [
  'recommendedPrompt',
  'skillDraft',
  'workflowDraft',
  'agentDraft',
  'finalSystem',
  'expectedResult',
]

const ARTIFACT_LABEL: Record<ArtifactKey, string> = {
  recommendedPrompt: 'prompt    ',
  skillDraft:        'skill     ',
  workflowDraft:     'workflow  ',
  agentDraft:        'agent     ',
  finalSystem:       'finalSys. ',
  expectedResult:    'expected  ',
}

interface ArtifactScore { local: number; enriched: number; delta: number }
interface AggStat       { mean: number; min: number; max: number }

interface IdeaResult {
  idea: string
  category: string
  confidence: number
  subtype: string
  blocked: boolean
  enrichedAvailable: boolean
  scores: Record<ArtifactKey, ArtifactScore>
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

function hasClassification(v: unknown): v is { classification: AiClassification } {
  return (
    typeof v === 'object' && v !== null && 'classification' in v &&
    typeof (v as Record<string, unknown>)['classification'] === 'object' &&
    (v as Record<string, unknown>)['classification'] !== null
  )
}

function hasArtifacts(v: unknown): v is { artifacts: NexusApiArtifacts } {
  return (
    typeof v === 'object' && v !== null && 'artifacts' in v &&
    typeof (v as Record<string, unknown>)['artifacts'] === 'object' &&
    (v as Record<string, unknown>)['artifacts'] !== null
  )
}

async function fetchClassification(idea: string): Promise<AiClassification | null> {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/api/nexus/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea }),
    })
    if (!res.ok) return null
    const json: unknown = await res.json()
    return hasClassification(json) ? json.classification : null
  } catch {
    return null
  }
}

async function fetchEnrichment(
  blueprint: StructuredProjectBlueprint,
): Promise<NexusApiArtifacts | null> {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/api/nexus/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blueprint: prepareBlueprintForApi(blueprint) }),
    })
    if (!res.ok) return null
    const json: unknown = await res.json()
    if (!hasArtifacts(json)) return null
    const { artifacts } = json
    return isNexusApiArtifactsUsable(artifacts) ? artifacts : null
  } catch {
    return null
  }
}

// ─── System builders ─────────────────────────────────────────────────────────

async function buildLocalSystem(idea: string): Promise<NexusSystem> {
  let system = generateLocalNexusSystem(idea)
  const bp = system.structuredBlueprint
  if (!bp) return system
  const needsClassify = bp.category === 'custom' || bp.confidence < 40
  if (!needsClassify) return system
  const classification = await fetchClassification(idea)
  if (classification) system = generateLocalNexusSystem(idea, classification)
  return system
}

async function buildSystems(idea: string): Promise<{
  local: NexusSystem
  enriched: NexusSystem
  enrichedAvailable: boolean
}> {
  const local = await buildLocalSystem(idea)
  const bp = local.structuredBlueprint
  if (!bp) return { local, enriched: local, enrichedAvailable: false }
  const artifacts = await fetchEnrichment(bp)
  if (!artifacts) return { local, enriched: local, enrichedAvailable: false }
  return { local, enriched: mergeWithApiArtifacts(local, artifacts), enrichedAvailable: true }
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

function norm(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function expandTokens(items: string[]): string[] {
  return Array.from(new Set(
    items.flatMap((s) => norm(s).split(/[\s\-_,;:.]+/)).filter((w) => w.length >= 3),
  ))
}

function objectiveKeywords(objective: string): string[] {
  return norm(objective)
    .split(/[\s\-_,;:.]+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ''))
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w))
}

function signalTerms(bp: StructuredProjectBlueprint): string[] {
  return Array.from(new Set([
    ...expandTokens(bp.entities),
    ...expandTokens(bp.roles),
    ...expandTokens(bp.mvpScope),
    ...expandTokens(bp.confirmedRequirements),
    ...expandTokens([bp.subtype ?? '']),
    ...objectiveKeywords(bp.objective),
  ].filter((t) => t.length >= 3)))
}

function artifactText(system: NexusSystem, key: ArtifactKey): string {
  switch (key) {
    case 'recommendedPrompt':
      return [
        system.recommendedPrompt.title,
        system.recommendedPrompt.prompt,
        system.recommendedPrompt.rationale,
      ].join(' ')
    case 'skillDraft':
      return [
        system.skillDraft.name,
        system.skillDraft.description,
        system.skillDraft.content,
      ].join(' ')
    case 'workflowDraft':
      return [
        system.workflowDraft.name,
        system.workflowDraft.description,
        ...system.workflowDraft.steps.map((s) => s.label),
      ].join(' ')
    case 'agentDraft':
      return [
        system.agentDraft.name,
        system.agentDraft.description,
        system.agentDraft.role,
        system.agentDraft.systemPrompt,
      ].join(' ')
    case 'finalSystem':
      return [
        system.finalSystem.name,
        system.finalSystem.purpose,
        ...system.finalSystem.reusableAssets,
        ...system.finalSystem.operatingFlow,
        system.finalSystem.handoffInstructions,
      ].join(' ')
    case 'expectedResult':
      return [
        system.expectedResult.summary,
        ...system.expectedResult.deliverables,
        ...system.expectedResult.successCriteria,
        system.expectedResult.exampleOutcome,
      ].join(' ')
  }
}

function scoreArtifact(system: NexusSystem, key: ArtifactKey, signals: string[]): number {
  if (signals.length === 0) return 0
  const text = norm(artifactText(system, key))
  const covered = signals.filter((t) => text.includes(t)).length
  const coverage = Math.round((covered / signals.length) * 100)
  const metaHits = META_TOKENS.filter((t) => text.includes(norm(t))).length
  const penalty = Math.min(60, metaHits * 15)
  return Math.max(0, Math.min(100, coverage - penalty))
}

function computeScore(
  local: NexusSystem,
  enriched: NexusSystem,
  key: ArtifactKey,
  signals: string[],
): ArtifactScore {
  const l = scoreArtifact(local, key, signals)
  const e = scoreArtifact(enriched, key, signals)
  return { local: l, enriched: e, delta: e - l }
}

function calcAgg(results: IdeaResult[], key: ArtifactKey): AggStat {
  const deltas = results.filter((r) => r.enrichedAvailable).map((r) => r.scores[key].delta)
  if (deltas.length === 0) return { mean: 0, min: 0, max: 0 }
  const mean = Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length)
  return { mean, min: Math.min(...deltas), max: Math.max(...deltas) }
}

// ─── Formatting ───────────────────────────────────────────────────────────────

function fmtScore(n: number): string { return String(n).padStart(3) }
function fmtDelta(n: number): string { return (n >= 0 ? `+${n}` : String(n)).padStart(4) }
function fmtMean(n: number): string  { return (n >= 0 ? `+${n}` : String(n)).padStart(5) }

function formatResults(results: IdeaResult[], runAt: string): string {
  const lines: string[] = []

  lines.push(`# Nexus Artifacts Eval — ${runAt}`)
  lines.push('')
  lines.push('> Local = deterministic engine + AI classify when needed.')
  lines.push('> Enriched = Local → `/api/nexus/generate` merge.')
  lines.push('> Score = domain coverage (0-100) minus meta-process penalty.')
  lines.push('')

  results.forEach((r, i) => {
    const enrichedTag = r.enrichedAvailable ? '✅' : '❌ (enrichment unavailable)'
    lines.push(`## ${i + 1}/${results.length}: "${r.idea}"`)
    lines.push('')
    lines.push(`Category: \`${r.category}\` | Confidence: ${r.confidence}% | Subtype: \`${r.subtype || '—'}\` | Blocked: ${r.blocked ? 'Yes' : 'No'} | Enriched: ${enrichedTag}`)
    lines.push('')
    lines.push('| Artifact   | Local | Enriched |    Δ |')
    lines.push('|:-----------|------:|---------:|-----:|')
    for (const key of ARTIFACT_KEYS) {
      const s = r.scores[key]
      const enrichedCell = r.enrichedAvailable ? fmtScore(s.enriched) : '  — '
      const deltaCell    = r.enrichedAvailable ? fmtDelta(s.delta)    : '   —'
      lines.push(`| ${ARTIFACT_LABEL[key]}| ${fmtScore(s.local)} | ${enrichedCell} | ${deltaCell} |`)
    }
    lines.push('')
  })

  const enrichedCount = results.filter((r) => r.enrichedAvailable).length
  lines.push(`## Aggregate Δ by artifact type (${enrichedCount}/${results.length} ideas enriched)`)
  lines.push('')
  lines.push('| Artifact   | Mean Δ | Min Δ | Max Δ |')
  lines.push('|:-----------|-------:|------:|------:|')
  for (const key of ARTIFACT_KEYS) {
    const a = calcAgg(results, key)
    lines.push(`| ${ARTIFACT_LABEL[key]}| ${fmtMean(a.mean)} | ${fmtDelta(a.min)} | ${fmtDelta(a.max)} |`)
  }
  lines.push('')

  return lines.join('\n')
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const runAt = new Date().toISOString()
  console.log(`\nNexus Artifact Eval — ${runAt}`)
  console.log(`Ideas: ${IDEAS.length} | Server: ${BASE_URL}\n`)

  const results: IdeaResult[] = []

  for (let i = 0; i < IDEAS.length; i++) {
    const idea = IDEAS[i]
    process.stdout.write(`[${i + 1}/${IDEAS.length}] ${idea.slice(0, 60)}... `)

    const { local, enriched, enrichedAvailable } = await buildSystems(idea)
    const bp = local.structuredBlueprint
    const signals = bp ? signalTerms(bp) : []

    const scores: Record<ArtifactKey, ArtifactScore> = {
      recommendedPrompt: computeScore(local, enriched, 'recommendedPrompt', signals),
      skillDraft:        computeScore(local, enriched, 'skillDraft',        signals),
      workflowDraft:     computeScore(local, enriched, 'workflowDraft',     signals),
      agentDraft:        computeScore(local, enriched, 'agentDraft',        signals),
      finalSystem:       computeScore(local, enriched, 'finalSystem',       signals),
      expectedResult:    computeScore(local, enriched, 'expectedResult',    signals),
    }

    results.push({
      idea,
      category:          bp?.category ?? 'unknown',
      confidence:        Math.round(bp?.confidence ?? 0),
      subtype:           bp?.subtype ?? '',
      blocked:           bp?.needsDiscovery ?? false,
      enrichedAvailable,
      scores,
    })

    console.log(enrichedAvailable ? 'done' : 'local only')
  }

  const output = formatResults(results, runAt)
  console.log('\n' + output)

  const evalsDir = path.join(process.cwd(), 'evals')
  fs.mkdirSync(evalsDir, { recursive: true })
  fs.writeFileSync(path.join(evalsDir, 'baseline.md'), output, 'utf-8')
  console.log('Written to evals/baseline.md')
}

main().catch((err: unknown) => {
  console.error('Eval failed:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})

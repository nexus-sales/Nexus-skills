'use client'
import { useState, useCallback, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { generatePrompt } from '@/lib/prompt-generator'
import { scorePrompt } from '@/lib/quality-scorer'
import type { PromptTemplate, TargetModel, QualityScore } from '@/types/prompt'
import { TEMPLATES } from '@/constants/templates'

const DEFAULT_TPL = 'conversion'

function normalizeTemplate(template: Partial<PromptTemplate>): PromptTemplate {
  return {
    name: template.name,
    rol: template.rol ?? '',
    tarea: template.tarea ?? '',
    proyecto: template.proyecto ?? '',
    stack: template.stack ?? '',
    destino: template.destino ?? '',
    restriccion: template.restriccion ?? '',
    outputType: template.outputType ?? '',
    ext: template.ext ?? '',
    tono: template.tono ?? '',
    criterios: template.criterios ?? '',
    autonomia: template.autonomia ?? '',
    fuentes: template.fuentes ?? '',
    cot: Boolean(template.cot),
    sc: Boolean(template.sc),
    xml: Boolean(template.xml),
    neg: Boolean(template.neg),
    ej: Boolean(template.ej),
    pre: Boolean(template.pre),
    int: Boolean(template.int),
    crit: Boolean(template.crit),
    devil: Boolean(template.devil),
    matType: template.matType ?? '',
    matFile: template.matFile ?? '',
    material: template.material ?? '',
    evidenceMode: template.evidenceMode ?? false,
    assumptionPolicy: template.assumptionPolicy ?? '',
    missingInfoPolicy: template.missingInfoPolicy ?? '',
    verificationDepth: template.verificationDepth ?? '',
    antiHallucinationNotes: template.antiHallucinationNotes ?? '',
    // Campos de app blueprint: solo se incluyen en el prompt cuando la plantilla los define explícitamente.
    // NO usar defaults no vacíos aquí: contaminarían prompts de email, linkedin, auditoria, etc.
    appGoal: template.appGoal ?? '',
    appType: template.appType ?? '',
    promptPhase: template.promptPhase ?? '',
    appScreens: template.appScreens ?? '',
    appData: template.appData ?? '',
    appIntegrations: template.appIntegrations ?? '',
    appPermissions: template.appPermissions ?? '',
    appDesign: template.appDesign ?? '',
    appAcceptance: template.appAcceptance ?? '',
  }
}

// Limpia los valores que el antiguo normalizeTemplate inyectaba como default aunque
// el usuario no los definiera explícitamente. Migra el localStorage de versiones anteriores.
function migrateFromLegacy(saved: PromptTemplate): PromptTemplate {
  const legacyAppGoal = 'crear-app'
  const legacyAppType = 'herramienta interna / dashboard operativo'
  const legacyPhase = 'fase 1: requisitos y arquitectura antes de implementar'
  const needsMigration =
    saved.appGoal === legacyAppGoal ||
    saved.appType === legacyAppType ||
    saved.promptPhase === legacyPhase
  if (!needsMigration) return saved
  return {
    ...saved,
    appGoal: saved.appGoal === legacyAppGoal ? '' : saved.appGoal,
    appType: saved.appType === legacyAppType ? '' : saved.appType,
    promptPhase: saved.promptPhase === legacyPhase ? '' : saved.promptPhase,
  }
}

const DEFAULT_STATE = normalizeTemplate(
  TEMPLATES[DEFAULT_TPL] ?? TEMPLATES[Object.keys(TEMPLATES)[0]]
)

export function usePromptBuilder() {
  const [savedState, setSavedState] = useLocalStorage<PromptTemplate>('nexus-expert-config', DEFAULT_STATE)
  const [savedModel, setSavedModel] = useLocalStorage<TargetModel>('nexus-expert-model', 'universal')
  const [state, setState] = useState<PromptTemplate>(() => {
    const migrated = migrateFromLegacy(savedState)
    // L-02: persiste la migración inmediatamente para no re-ejecutarla en cada recarga
    if (migrated !== savedState) setSavedState(migrated)
    return migrated
  })
  const [model, setModelState] = useState<TargetModel>(savedModel)

  const update = useCallback((patch: Partial<PromptTemplate>) => {
    setState((prev) => {
      const next = normalizeTemplate({ ...prev, ...patch })
      setSavedState(next)
      return next
    })
  }, [setSavedState])

  const setModel = useCallback((m: TargetModel) => {
    setModelState(m)
    setSavedModel(m)
  }, [setSavedModel])

  const updateTechnique = useCallback(
    (key: keyof PromptTemplate, value: boolean) => {
      update({ [key]: value } as Partial<PromptTemplate>)
    },
    [update]
  )

  const loadTemplate = useCallback((tpl: PromptTemplate) => {
    const next = normalizeTemplate(tpl)
    setState(next)
    setSavedState(next)
  }, [setSavedState])

  const generatedPrompt = useMemo(
    () => generatePrompt(state, model),
    [state, model]
  )

  const quality = useMemo<QualityScore>(
    () => scorePrompt(state),
    [state]
  )

  const activateHiperFocus = useCallback(() => {
    update({
      cot: true, int: true, crit: true, xml: true, neg: true, devil: true,
      tarea: state.tarea.includes('<plan_de_ejecucion>')
        ? state.tarea
        : state.tarea + '\n\nAntes de generar el resultado, crea un bloque <plan_de_ejecucion> donde listes los pasos lógicos.',
    })
  }, [state.tarea, update])

  const activateDevilMode = useCallback(() => {
    update({
      neg: true, crit: true, devil: true, sc: true,
      autonomia: 'ejecuta directamente usando supuestos razonables y decláralos al final',
      fuentes: 'puedes usar conocimiento general, pero marca claramente cualquier inferencia',
    })
  }, [update])

  const reset = useCallback(() => {
    const next = normalizeTemplate(TEMPLATES[DEFAULT_TPL] ?? TEMPLATES[Object.keys(TEMPLATES)[0]])
    setState(next)
    setSavedState(next)
  }, [setSavedState])

  return {
    state,
    model,
    setModel,
    update,
    updateTechnique,
    loadTemplate,
    generatedPrompt,
    quality,
    activateHiperFocus,
    activateDevilMode,
    reset,
  }
}

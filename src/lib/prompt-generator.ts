import type { PromptFormState, TargetModel } from '@/types/prompt'

const PHASE_INSTRUCTIONS: Record<string, string> = {
  'fase 0: app ya creada — mejora, fix o auditoria':
    'La app ya existe y esta en uso o en pruebas. No propongas reestructurar desde cero ni cambies arquitectura sin pedirlo. Centra la respuesta en el cambio, fix o mejora concreta solicitada. Si necesitas contexto de un archivo existente, pidelo antes de asumir su contenido.',
  'fase 1: requisitos y arquitectura antes de implementar':
    'Primero valida requisitos, alcance, pantallas, entidades de datos, permisos, riesgos y arquitectura. No escribas codigo final salvo pseudocodigo o estructura de archivos si ayuda.',
  'fase 2: plan de implementacion por archivos':
    'Entrega un plan de implementacion por archivos/componentes, dependencias, orden de trabajo, contratos entre modulos y pruebas necesarias. No implementes codigo completo todavia.',
  'fase 3: implementacion lista para copiar':
    'Entrega codigo listo para aplicar. Respeta el stack, no inventes archivos existentes y separa cambios por archivo. Si falta contexto critico, pide el archivo o dato exacto antes de cerrar.',
  'fase 4: pruebas y hardening':
    'Centra la respuesta en pruebas, edge cases, accesibilidad, estados de carga/error, seguridad, rendimiento y regresiones posibles.',
  'fase 5: revision modo diablo':
    'Actua como revisor senior. Busca fallos de producto, deuda tecnica, supuestos falsos, problemas de UX, huecos de seguridad y riesgos de mantenimiento.',
}

export { PHASE_INSTRUCTIONS }

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function buildPhasePrompt(state: PromptFormState, phase: string): string {
  const material = state.material?.trim() ?? ''
  const parts: string[] = []

  if (state.rol) parts.push(`${state.rol}.`)
  parts.push(`Tarea: ${state.tarea || 'Trabaja sobre la app descrita en el blueprint.'}`)

  const blueprintLines = [
    state.appGoal     && `Objetivo de trabajo: ${state.appGoal}`,
    state.appType     && `Tipo de app: ${state.appType}`,
    `Fase actual: ${phase}`,
    PHASE_INSTRUCTIONS[phase] && `Instruccion de fase: ${PHASE_INSTRUCTIONS[phase]}`,
    state.appScreens  && `Pantallas/flujos:\n${state.appScreens}`,
    state.appData     && `Datos/entidades:\n${state.appData}`,
    state.appIntegrations && `Integraciones:\n${state.appIntegrations}`,
    state.appPermissions  && `Roles/permisos:\n${state.appPermissions}`,
    state.appDesign       && `UX/estilo visual:\n${state.appDesign}`,
    (state.appAcceptance || state.criterios) && `Criterios de aceptacion:\n${state.appAcceptance || state.criterios}`,
  ].filter(Boolean)
  parts.push(`<blueprint_app>\n${blueprintLines.join('\n\n')}\n</blueprint_app>`)

  const contextLines = [
    state.stack      && `Stack: ${state.stack}`,
    state.destino    && `Destinatario: ${state.destino}`,
    state.restriccion && `Restricciones: ${state.restriccion}`,
  ].filter(Boolean)
  if (contextLines.length) {
    parts.push(`<contexto>\n${contextLines.join('\n')}\n</contexto>`)
  }

  parts.push(`<verificacion_antialucinacion>
- No inventes archivos, rutas, dependencias, APIs ni datos.
- Distingue hechos, inferencias y suposiciones.
- Si falta informacion critica para esta fase, pregunta antes de cerrar.
- Valida que la respuesta sea aplicable al stack y restricciones indicadas.
</verificacion_antialucinacion>`)

  if (material) {
    const type = state.matType || 'material_referencia'
    parts.push(`<${type}>\n${material}\n</${type}>`)
  }

  return parts.join('\n\n').trim()
}

export function generatePrompt(state: PromptFormState, model: TargetModel = 'universal'): string {
  const parts: string[] = []
  const material = state.material?.trim() ?? ''

  if (model === 'claude') {
    parts.push('Instrucciones para Claude: usa estructura clara, separa datos, contexto y tarea, y sigue las etiquetas XML como bloques de contenido.')
  } else if (model === 'gemini') {
    parts.push('Instrucciones para Gemini: aprovecha la ventana de contexto masivo y capacidad multimodal. Puedes recibir documentos completos.')
  } else if (model === 'gpt4') {
    parts.push('Instrucciones para GPT-4o: sigue la jerarquia de instrucciones, usa Markdown claro y manten alta precision en restricciones.')
  } else if (model === 'deepseek') {
    parts.push('Instrucciones para DeepSeek: descompón internamente el problema y entrega conclusiones verificables paso a paso.')
  }

  if (state.rol) parts.push(`${state.rol}.`)

  if (state.cot) {
    parts.push('Antes de responder, analiza el problema internamente paso a paso. No muestres razonamiento privado; entrega solo conclusiones, comprobaciones utiles y la respuesta final.')
  }
  if (state.crit) {
    parts.push('Antes de escribir la respuesta final, revisa internamente tu borrador: omisiones, errores logicos, contradicciones, incumplimiento de restricciones y puntos ambiguos. Corrige la version definitiva.')
  }
  if (state.devil) {
    parts.push(`<modo_diablo>
Actua como un revisor hostil y esceptico antes de entregar el resultado final.
- Ataca los supuestos debiles de la solucion inicial.
- Busca al menos 3 riesgos, contraejemplos, vulnerabilidades, costes ocultos o fallos de logica.
- Distingue hechos, inferencias y suposiciones.
- No aceptes afirmaciones importantes sin evidencia o justificacion.
- Ajusta la solucion final para resistir esas criticas.
</modo_diablo>`)
  }
  if (state.sc) {
    parts.push('Haz el analisis de forma interna. En la respuesta incluye unicamente el output final, sin mostrar el proceso de razonamiento.')
  }

  if (state.tarea) parts.push(`Tarea: ${state.tarea}`)

  if (state.int) {
    parts.push('IMPORTANTE: Si tienes alguna duda razonable o necesitas mas contexto para ser 100% preciso, hazme hasta 3 preguntas antes de generar el resultado.')
  }

  const appBlueprint = [
    state.appGoal && `Objetivo de trabajo: ${state.appGoal}`,
    state.appType && `Tipo de app: ${state.appType}`,
    state.promptPhase && `Fase actual: ${state.promptPhase}`,
    state.promptPhase && PHASE_INSTRUCTIONS[state.promptPhase] && `Instruccion de fase: ${PHASE_INSTRUCTIONS[state.promptPhase]}`,
    state.appScreens && `Pantallas/flujos:\n- ${state.appScreens.split('\n').map((l) => l.trim()).filter(Boolean).join('\n- ')}`,
    state.appData && `Datos/entidades:\n- ${state.appData.split('\n').map((l) => l.trim()).filter(Boolean).join('\n- ')}`,
    state.appIntegrations && `Integraciones:\n- ${state.appIntegrations.split('\n').map((l) => l.trim()).filter(Boolean).join('\n- ')}`,
    state.appPermissions && `Roles/permisos:\n- ${state.appPermissions.split('\n').map((l) => l.trim()).filter(Boolean).join('\n- ')}`,
    state.appDesign && `Criterios visuales/UX:\n- ${state.appDesign.split('\n').map((l) => l.trim()).filter(Boolean).join('\n- ')}`,
    state.appAcceptance && `Aceptacion funcional:\n- ${state.appAcceptance.split('\n').map((l) => l.trim()).filter(Boolean).join('\n- ')}`,
  ].filter(Boolean)
  if (appBlueprint.length) parts.push(`<blueprint_app>\n${appBlueprint.join('\n\n')}\n</blueprint_app>`)

  const context = [
    state.proyecto && `Proyecto: ${state.proyecto}`,
    state.stack && `Stack: ${state.stack}`,
    state.destino && `Destinatario: ${state.destino}`,
    state.restriccion && `Restriccion importante: ${state.restriccion}`,
  ].filter(Boolean)
  if (context.length) parts.push(`<contexto>\n${context.join('\n')}\n</contexto>`)

  const control = [
    state.criterios && `Criterios de exito:\n- ${state.criterios.split('\n').map((l) => l.trim()).filter(Boolean).join('\n- ')}`,
    state.autonomia && `Autonomia: ${state.autonomia}`,
    state.fuentes && `Politica de fuentes: ${state.fuentes}`,
  ].filter(Boolean)
  if (control.length) parts.push(`<control_experto>\n${control.join('\n\n')}\n</control_experto>`)

  const verification = [
    state.evidenceMode && 'Modo evidencia: no inventes datos. Separa hechos confirmados, inferencias razonables y suposiciones.',
    state.assumptionPolicy && `Politica de suposiciones: ${state.assumptionPolicy}`,
    state.missingInfoPolicy && `Informacion faltante: ${state.missingInfoPolicy}`,
    state.verificationDepth && `Nivel de verificacion: ${state.verificationDepth}`,
    state.antiHallucinationNotes && `Notas de precision: ${state.antiHallucinationNotes}`,
  ].filter(Boolean)
  if (verification.length) {
    parts.push(`<verificacion_antialucinacion>
${verification.join('\n')}
- Si una afirmacion no esta respaldada por el material, marcala como inferencia o suposicion.
- Si un dato es necesario para implementar con seguridad y no esta presente, pide aclaracion antes de cerrar la respuesta.
- No rellenes huecos con conocimiento inventado, nombres de archivos inexistentes, APIs no confirmadas ni dependencias no mencionadas.
- Antes de entregar, comprueba que la respuesta cumple tarea, contexto, restricciones, formato y criterios de exito.
</verificacion_antialucinacion>`)
  }

  const format = [
    state.outputType && `Formato: ${state.outputType}`,
    state.tono && `Tono: ${state.tono}`,
    state.ext && `Extension: ${state.ext}`,
    state.xml && 'Usa etiquetas XML descriptivas para cada seccion del output.',
  ].filter(Boolean)
  if (format.length) parts.push(`<formato_de_salida>\n${format.join('\n')}\n</formato_de_salida>`)

  if (state.neg) {
    parts.push(`<restricciones>
- No incluyas introducciones, preambulos ni frases de relleno.
- No hagas suposiciones sobre lo que no esta documentado en el material.
- No propongas cambios fuera del alcance exacto de la tarea.
- Si algo es ambiguo, indicalo en lugar de asumir.
</restricciones>`)
  }
  if (state.ej) {
    parts.push(`<ejemplo_formato>
[Pega aqui un ejemplo breve del formato de salida que esperas; el modelo lo imitara]
</ejemplo_formato>`)
  }

  if (material) {
    const type = state.matType || 'material_referencia'
    const file = state.matFile ? ` archivo="${escapeAttribute(state.matFile)}"` : ''
    parts.push(`<${type}${file}>\n${material}\n</${type}>`)
  }

  if (state.pre) {
    parts.push('Comienza la respuesta directamente, sin ningun preambulo. Primera linea de tu respuesta:')
  }

  return parts.join('\n\n').trim()
}

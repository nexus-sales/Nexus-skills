# CLAUDE.md — Nexus
# Stack: Next.js 16 · React 19 · TypeScript 5 · Tailwind 4 · Supabase

---

## QUÉ ES NEXUS

Nexus es una plataforma que transforma una idea en un sistema de IA reutilizable. No genera un prompt puntual — convierte una idea en artefactos conectados que se pueden revisar, guardar y evolucionar.

**Flujo principal:**
```
Idea
↓
Project Detector → StructuredProjectBlueprint
↓
Prompt Blueprint
↓
NexusSystem {
  analysis · recommendedPrompt · skillDraft
  workflowDraft · agentDraft · finalSystem · expectedResult
}
```

El **Blueprint Engine** es la pieza central: actúa como fuente de verdad intermedia que evita generar artefactos directamente desde texto libre. Todos los generadores leen del blueprint, no de la idea original.

---

## RUTAS

| Ruta | Descripción |
|------|-------------|
| `/` | Experiencia principal: Idea → Sistema |
| `/nexus` | Alias de la experiencia Nexus |
| `/prompt-builder` | Modo experto: control campo por campo |
| `/skills` | Biblioteca de skills guardadas |
| `/workflows` | Biblioteca de workflows |
| `/agentes` | Gestión y ejecución de agentes |
| `/login` | Autenticación Supabase |

---

## REGLAS ABSOLUTAS — NUNCA VIOLARLAS

1. **TypeScript estricto**: cero `any`, cero `as unknown`, cero `@ts-ignore`. Si un tipo no encaja, refactoriza el tipo.
2. **Cero estilos inline**: todo en Tailwind utility classes. Si Tailwind no alcanza, CSS Module. Nunca `style={{}}`.
3. **Server Components por defecto**: solo `'use client'` cuando haya interactividad real (hooks de estado, eventos del navegador).
4. **Separación lógica/UI**: los componentes solo renderizan. Toda la lógica vive en `/src/hooks/`.
5. **Accesibilidad AA mínimo**: todos los elementos interactivos tienen `aria-label` o `aria-labelledby`. Iconos decorativos con `aria-hidden="true"`.
6. **Fuentes de verdad — no reescribir sin necesidad:**
   - `src/types/` — tipos compartidos
   - `src/constants/templates.ts` — plantillas base
   - `src/constants/skills.ts` — skills predefinidas
   - `src/constants/agents.ts` — agentes predefinidos
7. **Commits atómicos** con mensaje descriptivo.

---

## ARQUITECTURA REAL — LO QUE EXISTE HOY

### Tipos (`src/types/`)

| Archivo | Qué contiene |
|---------|-------------|
| `nexus.ts` | `NexusSystem`, `NexusSystemStage`, `NexusIdeaAnalysis`, `NexusRecommendedPrompt`, `NexusSkillDraft`, `NexusWorkflowDraft`, `NexusAgentDraft`, `NexusFinalSystem`, `NexusExpectedResult` |
| `project-blueprint.ts` | `StructuredProjectBlueprint`, `StructuredProjectCategory`, `PendingQuestion`, `RequirementSeverity` |
| `prompt-blueprint.ts` | `PromptBlueprint` — representación intermedia antes de generar el prompt |
| `blueprint.ts` | `ProjectBlueprint` — blueprint legacy (v1), mantenido por compatibilidad |
| `prompt.ts` | Tipos compartidos: `Agent`, `Skill`, `Workflow`, `WorkflowStep`, `PromptTemplate`, `PromptFormState`, `QualityScore`, `PromptHistory`, `TechniqueId`, `TargetModel`, `AutonomyLevel`, `FieldId`, `FieldStatus`, `FieldConfig`, `AppMode` |

### Blueprint Engine (`src/lib/`)

| Archivo | Responsabilidad |
|---------|----------------|
| `project-detector.ts` | Detecta la categoría del proyecto a partir de la idea en texto libre |
| `domain-catalog.ts` | Defaults estructurados por dominio (booking, marketplace, crm…) |
| `domain-refinement-engine.ts` | Refina el blueprint según señales del dominio detectado |
| `domain-skill-generator.ts` | Genera la skill draft apropiada para el dominio |
| `structured-blueprint-generator.ts` | Normaliza la idea a `StructuredProjectBlueprint` (fuente de verdad) |
| `confidence-engine.ts` | Calcula confianza, clasifica preguntas por severidad (`critical/important/optional`), decide si activar Discovery Mode |
| `discovery-catalog.ts` | Catálogo de preguntas de discovery por categoría |
| `discovery-generator.ts` | Genera las preguntas de discovery relevantes para un blueprint |
| `discovery-answer-parser.ts` | Interpreta respuestas libres del usuario y las aplica al blueprint |
| `prompt-blueprint-generator.ts` | Convierte `StructuredProjectBlueprint` en `PromptBlueprint` |
| `nexus-system-generator.ts` | Motor principal: idea → `NexusSystem` completo (orquesta todos los anteriores) |
| `blueprint-generator.ts` | Generador de `ProjectBlueprint` legacy (v1) |
| `project-extractors/index.ts` | Extractores de señales por tipo de proyecto |

### Lib auxiliar (`src/lib/`)

| Archivo | Responsabilidad |
|---------|----------------|
| `prompt-generator.ts` | Función pura: `PromptFormState` → string de prompt |
| `quality-scorer.ts` | Función pura: `PromptFormState` → `QualityScore` |
| `strategy-hints.ts` | Función pura: `PromptFormState` → sugerencias de estrategia |
| `prompt-validation.ts` | Validación de prompt contra casos de riesgo de alucinación |
| `template-matcher.ts` | Detecta qué plantilla encaja con texto libre del usuario |
| `export-formats.ts` | `exportPrompt()`: convierte prompt a `plain/claude_code/api_system/gpt_markdown/gemini` |
| `supabase.ts` | Cliente Supabase (opcional en local) |
| `utils.ts` | `cn()` — merge de clases Tailwind |

### Hooks (`src/hooks/`)

| Hook | Responsabilidad |
|------|----------------|
| `useNexusSystem.ts` | Orquestador principal de la experiencia Nexus: genera, edita y exporta el sistema |
| `usePromptBuilder.ts` | Estado y lógica del Prompt Builder (modo experto) |
| `useAgents.ts` | CRUD de agentes — predefinidos + custom en localStorage |
| `useSkills.ts` | CRUD de skills — predefinidas + custom |
| `useWorkflows.ts` | CRUD de workflows |
| `useTemplates.ts` | Plantillas custom: guardar, eliminar, exportar JSON |
| `useHistory.ts` | Historial de prompts copiados (últimos 10) |
| `useIteration.ts` | Ciclo de iteración: registrar versiones, marcar fallo, aplicar ajuste automático |
| `useAppMode.ts` | Estado del modo del Prompt Builder: `quick/guided/expert` |
| `useLocalStorage.ts` | Wrapper tipado de localStorage |
| `useKeyboardShortcuts.ts` | Atajos de teclado globales (Ctrl+Enter, Ctrl+Backspace) |
| `useTestPrompt.ts` | Llama a `/api/test-prompt` y gestiona el estado de la respuesta |
| `useAuth.ts` | Estado de sesión Supabase |

### Componentes — Nexus (`src/components/nexus/`)

| Componente | Descripción |
|-----------|-------------|
| `NexusSystemPage.tsx` | Página completa de la experiencia Nexus (`'use client'`) |
| `IdeaInput.tsx` | Input de idea con Discovery Mode integrado |
| `SystemStageList.tsx` | Lista de etapas con estado (pending/in_progress/completed…) |
| `SystemArtifactPanel.tsx` | Panel de cada artefacto generado (prompt, skill, workflow, agente…) |

### Componentes — Prompt Builder (`src/components/prompt-builder/`)

| Componente | Descripción |
|-----------|-------------|
| `PromptBuilderPage.tsx` | Orquestador del modo experto (`'use client'`) |
| `ModeSelector.tsx` | Selector Quick / Guided / Expert |
| `TemplateGridSmart.tsx` | Grid de plantillas con indicador de campos requeridos |
| `QuickForm.tsx` | Formulario inteligente: muestra solo los campos que la plantilla necesita |
| `ExpertFormFull.tsx` | Formulario completo — todos los bloques (solo en modo Expert) |
| `OutputPanel.tsx` | Panel de output con score de calidad |
| `ExportMenu.tsx` | Menú de exportación (plain / CLAUDE.md / API JSON / GPT Markdown) |
| `IterationPanel.tsx` | Panel de iteración: ¿funcionó? → ajuste automático |
| `TestPanel.tsx` | Test en vivo contra Claude API desde dentro de la app |
| `ValidationPanel.tsx` | Checklist de riesgo de alucinación |
| `TechniquesList.tsx` | Lista de técnicas avanzadas de prompting |
| `ModelAdviceGrid.tsx` | Consejos por modelo de destino |

### Componentes — Secciones (`src/components/`)

| Sección | Componentes |
|---------|------------|
| `agents/` | `AgentCard`, `AgentForm`, `AgentRunner`, `ElicitationFlow` |
| `skills/` | `SkillCard`, `SkillForm`, `SkillsPanel` |
| `workflows/` | `WorkflowCard`, `WorkflowBuilder` |
| `layout/` | `Header`, `SubPageNav`, `AuthGuard` |
| `forms/` | `InputBlock` |
| `ui/` | `Button`, `Select`, `Badge`, `Toast` |

### Constantes (`src/constants/`)

| Archivo | Contenido |
|---------|-----------|
| `templates.ts` | Plantillas de prompt predefinidas con `visibleFields` y `quickSummary` |
| `skills.ts` | Skills predefinidas del sistema Nexus |
| `agents.ts` | Agentes predefinidos (Dev Senior, NIS2, Copywriter B2B, Arquitecto IA, Asistente de Prompt) |
| `validation-cases.ts` | Casos de riesgo de alucinación para `ValidationPanel` |

---

## DISCOVERY MODE

Nexus no bloquea la generación a menos que la idea esté realmente incompleta. Solo bloquea si:
- Confianza < 40
- Categoría `custom` (no reconocida)
- Menos de 2 requisitos confirmados

Si la idea está suficientemente definida pero queda una decisión crítica, genera el sistema completo y muestra "Decisión crítica pendiente" en lugar de bloquear.

Las preguntas pendientes tienen severidad:
- `critical` — información necesaria para decisiones estructurales
- `important` — mejora la arquitectura pero no la bloquea
- `optional` — no bloquea el sistema base

---

## PROMPT BUILDER — MODOS

El Prompt Builder en `/prompt-builder` tiene 3 modos controlados por `useAppMode`:

| Modo | Comportamiento |
|------|---------------|
| `quick` | Elige plantilla → `QuickForm` muestra solo los campos `required` de `visibleFields` |
| `guided` | `ElicitationFlow` hace 3 preguntas → rellena campos automáticamente → sugiere plantilla si hay match |
| `expert` | `ExpertFormFull` muestra todos los bloques — opt-in, nunca por defecto |

**Reglas de `visibleFields` en plantillas:**
- Máximo 3 campos `required` por plantilla
- `rol`, `techniques`, `outputType`, `tono`, `ext` → siempre `hidden` en modo quick
- `criterios`, `autonomia`, `fuentes` → siempre `advanced` (colapsados)

---

## API ROUTES

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/test-prompt` | POST | Envía prompt a Claude API y devuelve `{ result, inputTokens, outputTokens, model, durationMs }` |

---

## VARIABLES DE ENTORNO

```env
# Anthropic — necesario para /api/nexus/generate y TestPanel
ANTHROPIC_API_KEY=sk-ant-...

# Modelo para enriquecimiento Nexus (por defecto: claude-haiku-4-5-20251001)
ANTHROPIC_MODEL=claude-haiku-4-5-20251001

# Tokens máximos por respuesta (por defecto: 4096)
ANTHROPIC_MAX_TOKENS=4096

# Timeout del fetch a Anthropic en ms (por defecto: 25000)
ANTHROPIC_TIMEOUT_MS=25000

# Supabase — opcional en local, necesario para auth y sync en producción
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## COMANDOS

```bash
npm run dev      # desarrollo en localhost:3000
npm run build    # verificar antes de cada commit
npm run lint     # pasar siempre antes de commit
```

---

## CRITERIOS DE CALIDAD

Antes de cada commit verificar:
- [ ] `npm run build` — cero errores de TypeScript
- [ ] `npm run lint` — cero warnings de ESLint
- [ ] Ningún componente supera 200 líneas
- [ ] Cero `any`, cero `as unknown`, cero estilos inline
- [ ] Todos los elementos interactivos tienen `aria-label` o `<label>` asociado

---

*Autor: Salvador Muñoz Portillo | admin@nexus-sales.eu | Nexus Sales*

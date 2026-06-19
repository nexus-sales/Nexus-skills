# Nexus

De una idea a un sistema de IA reutilizable.

Nexus es una plataforma para transformar una idea inicial en recursos de IA que se pueden revisar, guardar, repetir y evolucionar. No se queda en generar un prompt aislado: convierte una necesidad en artefactos conectados y reutilizables.

```text
Idea
↓
Blueprint
↓
Prompt
↓
Skill
↓
Workflow
↓
Agente
↓
Sistema
↓
Resultado
```

## Que hace Nexus

- El usuario describe una idea.
- Nexus detecta el tipo real de proyecto.
- Genera un Project Blueprint estructurado.
- Distingue requisitos confirmados, inferidos y sugeridos.
- Genera un prompt recomendado.
- Crea una skill reutilizable.
- Sugiere un workflow.
- Propone un agente.
- Construye un sistema base.
- Permite guardar y exportar los artefactos.

## Por que no es solo un generador de prompts

Un prompt resuelve una tarea puntual. Nexus busca convertir conocimiento, criterios y procesos en recursos reutilizables: prompts que se pueden mejorar, skills que encapsulan instrucciones, workflows que ordenan pasos y agentes preparados para ejecutar un tipo de trabajo.

La diferencia esta en el objetivo: no producir una respuesta util una sola vez, sino crear un sistema que pueda volver a usarse con consistencia.

## Blueprint Engine

Nexus usa una capa interna de blueprint para evitar que los artefactos se generen directamente desde texto libre.

El flujo interno actual es:

```text
Idea
↓
Project Detector
↓
Structured Project Blueprint
↓
Prompt Blueprint
↓
Prompt / Skill / Workflow / Agent
```

El `StructuredProjectBlueprint` actua como fuente de verdad para:

- categoria del proyecto,
- objetivo,
- audiencia,
- requisitos confirmados,
- requisitos inferidos,
- sugerencias,
- pantallas,
- entidades,
- roles,
- integraciones,
- monetizacion,
- restricciones,
- riesgos,
- preguntas pendientes.

## Severidad y Discovery Mode

Las preguntas pendientes ya no se tratan todas igual. Nexus clasifica cada pregunta como:

- `critical`: informacion necesaria para decisiones estructurales.
- `important`: informacion recomendable que mejora la arquitectura.
- `optional`: informacion que no bloquea el sistema base.

Discovery Mode solo bloquea cuando la idea esta realmente incompleta:

- confianza menor de 40,
- categoria `custom`,
- menos de 2 requisitos confirmados.

Si el sistema esta suficientemente definido pero queda una decision critica, Nexus genera el sistema y muestra "Decision critica pendiente" en lugar de bloquear Skill, Workflow y Agent.

## Respuestas de Discovery

Nexus puede detectar respuestas libres a preguntas pendientes y aplicarlas al blueprint.

Ejemplo marketplace artesanal:

```text
La compra sera solo local, de momento, preparada para segunda fase.
Habra panel de administracion.
Los comentarios seran de ambos.
Los descuentos seran por temporada y manuales.
Instagram sera enlace e importacion.
WhatsApp sera contacto.
```

Esto permite:

- resolver preguntas pendientes ya contestadas,
- mover informacion a requisitos confirmados,
- actualizar monetizacion e integraciones,
- limpiar sugerencias que ya no aplican,
- recalcular confianza,
- evitar que Nexus siga preguntando lo mismo.

Para checkout local en marketplace, Nexus confirma:

- `venta-local`,
- `catalogo-con-contacto-local`,
- `checkout-online-pospuesto-a-fase-2`.

Y elimina la sugerencia inmediata de `payment-gateway`.

## Rutas principales

- `/`: experiencia principal Idea -> Sistema.
- `/nexus`: experiencia Nexus.
- `/prompt-builder`: modo avanzado.
- `/skills`: skills.
- `/workflows`: workflows.
- `/agentes`: agentes.

## Experiencia principal

En la home, el usuario empieza con una idea sencilla, por ejemplo:

```text
Quiero automatizar el seguimiento de clientes potenciales
```

Nexus genera progresivamente:

- analisis de la idea,
- blueprint estructurado,
- prompt recomendado,
- skill reutilizable,
- workflow sugerido,
- agente propuesto,
- sistema base,
- resultado esperado.

Desde la pantalla principal se puede copiar el prompt, guardar los artefactos como recursos reutilizables y exportar el sistema completo en Markdown.

## Modo avanzado

El Prompt Builder sigue disponible en `/prompt-builder` como modo experto. Sirve para ajustar prompts campo por campo cuando se necesita control fino sobre:

- rol experto,
- tarea,
- contexto tecnico,
- formato de salida,
- criterios de exito,
- tecnicas avanzadas,
- material de referencia,
- verificacion y antialucinacion.

Este modo conserva funciones del builder original:

- plantillas rapidas,
- plantillas personalizadas,
- historial de prompts copiados,
- exportacion/importacion de configuracion en JSON,
- compartir configuracion por URL,
- copia por fases,
- panel de calidad,
- checklist de riesgo de alucinacion.

## Antialucinacion

Nexus y el modo avanzado estan pensados para reducir respuestas inventadas. La app permite definir:

- modo solo con evidencia,
- politica de suposiciones,
- comportamiento ante datos faltantes,
- profundidad de verificacion,
- notas de precision especificas del caso.

El objetivo es que el sistema distinga entre datos confirmados, inferencias razonables y sugerencias opcionales.

## Desarrollo

Instalar dependencias:

```bash
npm install
```

Ejecutar en local:

```bash
npm run dev
```

Abrir:

```text
http://localhost:3000
```

Validar el proyecto:

```bash
npm run lint
npm run build
```

## Variables de entorno

Supabase es opcional para desarrollo local. Si no esta configurado, la app puede funcionar con almacenamiento local para la experiencia principal.

Para habilitar autenticacion y sincronizacion en la nube:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Lucide React
- Supabase

## Estructura relevante

- `src/components/nexus/`: experiencia principal Idea -> Sistema.
- `src/hooks/useNexusSystem.ts`: orquestacion del flujo Nexus.
- `src/lib/project-detector.ts`: deteccion heuristica del tipo de proyecto.
- `src/lib/domain-catalog.ts`: defaults por dominio.
- `src/lib/structured-blueprint-generator.ts`: normalizador a `StructuredProjectBlueprint`.
- `src/lib/confidence-engine.ts`: confianza, severidad y normalizacion de preguntas.
- `src/lib/discovery-answer-parser.ts`: interpretacion de respuestas a Discovery.
- `src/lib/prompt-blueprint-generator.ts`: conversion de blueprint a prompt blueprint.
- `src/lib/nexus-system-generator.ts`: motor local que transforma una idea en un `NexusSystem`.
- `src/types/project-blueprint.ts`: tipos del blueprint estructurado.
- `src/types/prompt-blueprint.ts`: tipos del prompt blueprint.
- `src/types/nexus.ts`: tipos del sistema Nexus.
- `src/components/prompt-builder/`: modo avanzado de Prompt Builder.
- `src/constants/templates.ts`: plantillas base.
- `src/constants/skills.ts`: skills predefinidas.
- `src/constants/agents.ts`: agentes predefinidos.
- `src/types/prompt.ts`: tipos compartidos de prompts, skills, workflows y agentes.

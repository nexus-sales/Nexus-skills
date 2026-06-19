# AGENTS.md — Guía para agentes de Claude Code

## Stack
Next.js 16 App Router · React 19 · TypeScript 5 estricto · Tailwind 4 · lucide-react

## Reglas
- TypeScript estricto: cero any, cero as unknown
- Server Components por defecto, 'use client' solo cuando sea necesario
- Lógica en /src/hooks/, componentes solo renderizan
- Accesibilidad: aria-label en todos los elementos interactivos
- Estilos: solo Tailwind, cero inline styles

## Estructura clave
- /src/hooks/ — toda la lógica de negocio
- /src/lib/ — funciones puras (prompt-generator, quality-scorer)
- /src/constants/ — templates.ts y agents.ts son fuente de verdad
- /src/types/ — tipos compartidos

## Comandos
npm run dev     → desarrollo
npm run build   → verificar build antes de commit
npm run lint    → pasar siempre antes de commit

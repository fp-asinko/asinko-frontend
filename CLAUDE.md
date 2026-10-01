# CLAUDE.md

Este proyecto trabaja con Spec-Driven Development. Antes de implementar cualquier feature, lee y aplica las guías canónicas en `docs/ai-guidelines/`. Se importan con `@` para que Claude Code las cargue en contexto automáticamente:

- @docs/ai-guidelines/sdd-philosophy.md
- @docs/ai-guidelines/conventions.md
- @docs/ai-guidelines/structure.md
- @docs/ai-guidelines/engineering-principles.md
- @docs/ai-guidelines/libraries.md
- @docs/ai-guidelines/api-integration.md
- @docs/ai-guidelines/tooling.md
- @docs/ai-guidelines/design-system.md
- @docs/ai-guidelines/i18n.md
- @docs/ai-guidelines/testing.md
- @docs/ai-guidelines/security.md
- @docs/ai-guidelines/seo.md
- @docs/ai-guidelines/memory.md

Qué es el producto (visión, menciones, tipos de contenido y roadmap):

- @docs/product/overview.md

Reglas rápidas:
1. No escribas código de feature sin un spec aprobado.
2. Si la spec es ambigua, pregunta. No completes con suposiciones.
3. Sigue Conventional Commits.
4. Valida todo input con esquemas; trata las fuentes externas como no confiables.
5. Cumple el Definition of Done antes de dar por terminado un PR.
6. Next.js 16 tiene cambios respecto de tu conocimiento previo: antes de escribir código de Next, leé la guía correspondiente en `node_modules/next/dist/docs/`.

## Skills

Las skills de `.claude/skills/` (instaladas con `npx skills`, ver `skills-lock.json`) aportan criterio de diseño, animación y UX. Se aplican **dentro** de las guías: si una skill recomienda una librería, un componente o un valor que contradice una guía (por ejemplo, una librería que no está en `libraries.md` o un color fuera de los tokens de `design-system.md`), gana la guía. Sumar algo que propone una skill sigue el criterio de `libraries.md`.

## Subagentes

En `.claude/agents/`. Son de solo lectura y reportan hallazgos; los arreglos los aplica la sesión principal.

- `ui-reviewer` — reglas de UI del proyecto (mobile first, a11y, tokens, i18n, Atomic Design, tests). Correrlo al terminar un componente o vista y antes de cada PR con UI. Lo estético y las animaciones quedan para las skills `apple-design`, `emil-design-eng` y `review-animations`.

## Memoria (Engram)

Si las herramientas `mem_*` están disponibles, seguí el protocolo de `memory.md`: `mem_context` al arrancar, `mem_search` antes de repetir decisiones, `mem_save` al completar algo relevante y `mem_session_summary` al cerrar. Engram es para contexto de trabajo del proyecto; la auto-memory de Claude Code queda solo para preferencias personales del usuario.

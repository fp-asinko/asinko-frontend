# AGENTS.md

Este proyecto trabaja con **Spec-Driven Development**. Antes de implementar cualquier feature, lee y aplica las guías en `docs/ai-guidelines/`.

## Guías canónicas (fuente de verdad)

- `docs/ai-guidelines/sdd-philosophy.md` — Cómo trabajamos: specs antes de código.
- `docs/ai-guidelines/conventions.md` — Commits, branching, PRs, Definition of Done.
- `docs/ai-guidelines/structure.md` — Estructura Next.js, organización por dominio y naming.
- `docs/ai-guidelines/engineering-principles.md` — SOLID aplicado a React/Next.js, KISS, YAGNI.
- `docs/ai-guidelines/libraries.md` — Librerías aprobadas, estado, env y criterio para sumar dependencias.
- `docs/ai-guidelines/api-integration.md` — Consumo del backend `asinko-app`: cliente HTTP, errores, sesión.
- `docs/ai-guidelines/tooling.md` — TypeScript estricto, ESLint, Prettier, git hooks, quality gates.
- `docs/ai-guidelines/i18n.md` — Multi-idioma con next-intl: rutas, mensajes, SEO.
- `docs/ai-guidelines/design-system.md` — shadcn/ui, Atomic Design, mobile first y accesibilidad.
- `docs/ai-guidelines/testing.md` — Vitest para componentes y lógica, Playwright para e2e.
- `docs/ai-guidelines/security.md` — Manejo de secretos y seguridad.
- `docs/ai-guidelines/seo.md` — Reglas técnicas de SEO y Core Web Vitals.
- `docs/ai-guidelines/memory.md` — Memoria persistente con Engram: qué guardar y cómo.

## Producto

- `docs/product/overview.md` — Qué es Asinko: visión, menciones, tipos de contenido y roadmap.

## Reglas rápidas

1. No escribas código de feature sin un spec aprobado.
2. Si la spec es ambigua, pregunta. No completes con suposiciones.
3. Sigue Conventional Commits.
4. Valida todo input con esquemas; trata las fuentes externas como no confiables.
5. Cumple el Definition of Done antes de dar por terminado un PR.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

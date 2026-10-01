# AI Guidelines

Guías canónicas del proyecto: la fuente de verdad sobre cómo trabajamos, tanto para personas como para asistentes de IA. Si una regla cambia, se cambia acá; los punteros de la raíz no duplican contenido.

## Guías

| Archivo                                                  | Qué cubre                                                                            |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [`sdd-philosophy.md`](sdd-philosophy.md)                 | Spec-Driven Development: fases, reglas, cuándo saltarse el flujo                     |
| [`conventions.md`](conventions.md)                       | Idioma, gestor de paquetes, branching, Conventional Commits, PRs, Definition of Done |
| [`structure.md`](structure.md)                           | Estructura Next.js, organización por dominio, naming, reglas de dependencias         |
| [`engineering-principles.md`](engineering-principles.md) | SOLID aplicado a React/Next.js, KISS, YAGNI, manejo de errores                       |
| [`libraries.md`](libraries.md)                           | Librerías aprobadas, dónde vive el estado, env, criterio para sumar dependencias     |
| [`tooling.md`](tooling.md)                               | TypeScript estricto, ESLint (boundaries, a11y), Prettier, git hooks, quality gates   |
| [`api-integration.md`](api-integration.md)               | Consumo del backend (`asinko-app`): cliente HTTP, errores, sesión con Supabase       |
| [`security.md`](security.md)                             | Manejo de credenciales, secret scanning, seguridad en el frontend, on/offboarding    |
| [`seo.md`](seo.md)                                       | SEO técnico, multi-idioma, mobile first indexing, performance y Core Web Vitals      |
| [`design-system.md`](design-system.md)                   | shadcn/ui, tokens, Atomic Design, mobile first, accesibilidad                        |
| [`i18n.md`](i18n.md)                                     | Multi-idioma con next-intl: rutas traducidas, mensajes, formato, testing             |
| [`testing.md`](testing.md)                               | Vitest + Testing Library para componentes y lógica, Playwright para e2e              |
| [`memory.md`](memory.md)                                 | Memoria persistente con Engram: protocolo, qué guardar, Git Sync                     |

## Punteros para asistentes de IA

- [`AGENTS.md`](../../AGENTS.md) — índice genérico. Lo leen varias herramientas (Cursor, Copilot, Codex, entre otras).
- [`CLAUDE.md`](../../CLAUDE.md) — Claude Code. Importa las guías con `@` para cargarlas en contexto.

Para sumar otra herramienta que no lea `AGENTS.md`, crear un puntero fino en la ubicación que espera y que solo referencie esta carpeta.

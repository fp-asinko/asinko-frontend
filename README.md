# asinko-web

Asinko es una red social de finanzas inspirada en Reddit, donde la reputación se gana acertando: los usuarios publican tesis de inversión verificables y su historial de aciertos queda público. El contenido se conecta con menciones: `$` para activos, `#` para comunidades y `@` para usuarios.

Visión completa de producto: [`docs/product/overview.md`](docs/product/overview.md).

## Requisitos

- Node.js
- [pnpm](https://pnpm.io/) — único gestor de paquetes del proyecto
- [Engram](https://github.com/Gentleman-Programming/engram) — memoria persistente para asistentes de IA (ver [`memory.md`](docs/ai-guidelines/memory.md))

## Stack

- Next.js (App Router)
- shadcn/ui + Tailwind CSS
- TypeScript (estricto)
- next-intl (multi-idioma)
- Vitest + Testing Library (unitarios) · Playwright (e2e)

## Cómo trabajamos

El proyecto sigue **Spec-Driven Development**: ningún feature se implementa sin un spec aprobado en `specs/<feature>/` (`requirements.md` → `design.md` → `tasks.md`).

Las convenciones, la estructura y las reglas de seguridad están en [`docs/ai-guidelines/`](docs/ai-guidelines/README.md).

## Asistentes de IA

- [`CLAUDE.md`](CLAUDE.md) — Claude Code (asistente principal).
- [`AGENTS.md`](AGENTS.md) — índice genérico para otras herramientas.

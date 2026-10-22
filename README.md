# asinko-web

Frontend de **Asinko**, una red social de finanzas inspirada en Reddit donde la reputación se gana **acertando**: las personas publican tesis de inversión verificables y su historial de aciertos queda público. El contenido se conecta con menciones: `$` para activos, `#` para comunidades y `@` para personas.

- Visión de producto y roadmap: [`docs/product/overview.md`](docs/product/overview.md)
- Backend: [`asinko-app`](https://github.com/eceraolo/asinko-app) (API REST en `/api/v1`, Postgres con Prisma, auth con Supabase). Este repo es **solo el frontend**: no accede a la base de datos.

**Versión: 0.1.0** (fase 1, MVP social). Se lee de `package.json` y se muestra en el pie de la columna derecha.

## Qué hay hoy

- **Home** con feed (Para ti / Siguiendo), encuestas, votos, comentarios anidados y menciones.
- **Crear post** (texto, link, imagen), con borradores en la cuenta, marcas y comunidades relacionadas.
- **Páginas de grupo, activo y perfil**: banner, unirse / seguir, miembros, seguidores.
- **Perfil** como LinkedIn y Reddit: titular, acerca de, links, destacados, "abierto a", tarjeta de reputación, "participa en" y logros.
- **Widgets de los grupos** que arma cada moderador.
- Multi-idioma (en, es, pt), tema claro y oscuro, mobile first.

Los **logros** y los **widgets** están hechos solo en el front: el backend los implementa en su fase 3. Mientras tanto se ven con mocks (ver [Modos de la API](#modos-de-la-api)).

## Requisitos

- **Node.js 24** (`.nvmrc`; `package.json` pide `>=24 <25`).
- **pnpm 11.1.3**, el único gestor de paquetes del proyecto. Con Corepack: `corepack enable` y queda la versión de `packageManager`.
- Opcional: [Engram](https://github.com/Gentleman-Programming/engram), la memoria persistente de los asistentes de IA ([`memory.md`](docs/ai-guidelines/memory.md)).

## Primeros pasos

```bash
pnpm install                 # también registra los git hooks (Lefthook)
cp .env.example .env.local   # valores de desarrollo; nunca secretos reales en el repo
pnpm dev                     # http://localhost:3000
```

Con `API_MOCKS=true` (el valor de `.env.example`) la app funciona **sin backend**: todo se responde desde `src/mocks/`, con un usuario demo como sesión.

## Variables de entorno

Validadas en el build con zod (`src/env.ts`). Nunca se lee `process.env` fuera de ese archivo (y de `src/env.client.ts`).

| Variable                                | Para qué                                                                                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `APP_ENV`                               | `development`, `preview` o `production`. Decide si el sitio se indexa y si se permiten mocks y el login de desarrollo. |
| `NEXT_PUBLIC_SITE_URL`                  | URL pública del sitio: canonical, `metadataBase`, sitemap.                                                             |
| `API_BASE_URL`                          | URL de `asinko-app`. Desarrollo: `https://asinko-app-web.vercel.app` (o `http://localhost:3001` con el backend local). |
| `API_MOCKS`                             | `true`, `missing` o `false` (ver abajo). **Prohibido distinto de `false` en producción**: el build falla.              |
| `API_TIMEOUT_MS`                        | Opcional. Tiempo máximo de cada pedido al backend (10 s por defecto).                                                  |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`  | Opcionales. Sin DSN, Sentry queda apagado.                                                                             |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`     | Opcionales, solo desarrollo: el mismo proyecto Supabase que usa el backend, para el login de desarrollo.               |
| `DEV_LOGIN_EMAIL`, `DEV_LOGIN_PASSWORD` | Opcionales, solo desarrollo: la cuenta de prueba del botón "Dev login". Nunca en producción.                           |

## Modos de la API

`API_MOCKS` decide qué se responde desde `src/mocks/` y qué va al backend real ([`api-integration.md § Mocks`](docs/ai-guidelines/api-integration.md)):

| Valor     | Qué se mockea                                                                 | Para qué                                                    |
| --------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `true`    | Todo, con el usuario demo como sesión                                         | Trabajar sin backend; es lo que usa el CI                   |
| `missing` | Solo lo que el backend todavía no tiene: logros, widgets, "abierto a", marcas | Desarrollo y el ambiente **DEV** contra el backend de `dev` |
| `false`   | Nada                                                                          | Producción                                                  |

Con `missing`, los logros y los widgets se ven también con los usuarios y grupos reales de `dev`: cada persona tiene una vitrina de ejemplo y cada grupo, sus widgets. Lo que un moderador guarda en un widget vive en la memoria de esa instancia del servidor, hasta que exista la fase 3 del backend.

**Login de desarrollo:** con `APP_ENV` distinto de `production` y las variables de Supabase y `DEV_LOGIN_*` cargadas, aparece el botón **Dev login** en la barra superior. Entra con la cuenta de prueba y manda su token al backend como `Bearer`. El login real llega en una fase posterior.

## Comandos

| Comando                         | Qué hace                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------- |
| `pnpm dev`                      | Servidor de desarrollo en `:3000`                                            |
| `pnpm build` / `pnpm start`     | Build de producción y su servidor                                            |
| `pnpm lint`                     | ESLint, sin un solo warning                                                  |
| `pnpm format` / `format:check`  | Prettier (ordena también las clases de Tailwind)                             |
| `pnpm typecheck`                | Tipos de rutas de Next + TypeScript estricto                                 |
| `pnpm test` / `test:coverage`   | Vitest; la cobertura tiene umbrales mínimos                                  |
| `pnpm test:e2e` / `test:e2e:ui` | Playwright en mobile y desktop, contra el build de producción en `:3100`     |
| `pnpm api:smoke`                | Lee el backend de `dev` y valida cada respuesta con el contrato (solo `GET`) |

## Stack

- **Next.js 16** (App Router, Turbopack, React 19). Next 16 cambia cosas respecto de versiones anteriores: su documentación está en `node_modules/next/dist/docs/`.
- **TypeScript** estricto · **zod** para todo input externo (formularios, actions, API, env).
- **shadcn/ui** sobre **Base UI** + **Tailwind CSS 4**; íconos de lucide.
- **next-intl** (en, es, pt) con los mensajes precompilados en el build.
- **react-hook-form**, **nuqs** (estado en la URL), **date-fns**, **next-themes**, **Sentry**.
- **Vitest** + Testing Library (unitarios) · **Playwright** + axe (e2e y accesibilidad).

La lista completa, y el criterio para sumar una librería, está en [`libraries.md`](docs/ai-guidelines/libraries.md).

## Estructura

```
docs/
  ai-guidelines/     # Las reglas del proyecto (convenciones, estructura, diseño, i18n, seguridad, SEO…)
  product/           # Visión de producto
  references/api/    # Snapshot del contrato del backend y propuestas (proposals.md)
specs/               # Un spec por feature: requirements.md → design.md → tasks.md
messages/            # Traducciones: en.json (fuente), es.json, pt.json
e2e/                 # Tests de Playwright
src/
  app/[locale]/      # Rutas (App Router); todo cuelga del idioma
  components/        # UI compartida con Atomic Design: ui (shadcn) → molecules → organisms
  features/          # Un directorio por dominio: feed, communities, composer, interests…
  lib/               # Cliente de la API (server-only), utilidades
  mocks/             # Mocks de la API por endpoint
```

Detalle y reglas de dependencias: [`structure.md`](docs/ai-guidelines/structure.md).

## Cómo trabajamos

- **Spec-Driven Development:** ningún feature se implementa sin un spec aprobado en `specs/<feature>/` ([`sdd-philosophy.md`](docs/ai-guidelines/sdd-philosophy.md)).
- **Ramas:** `main` (producción), `staging` (QA), `develop` (integradora, DEV) y `feature/<spec>-<descripción>`, `fix/…`, `hotfix/…` ([`conventions.md`](docs/ai-guidelines/conventions.md)).
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/), en inglés; los valida commitlint.
- **Git hooks** (Lefthook): ESLint y Prettier antes de cada commit; tipos y tests antes de cada push.
- **Definición de "hecho"** (tests, i18n, accesibilidad, presupuesto de JS…): [`conventions.md § DoD`](docs/ai-guidelines/conventions.md).

## Calidad

El CI (`.github/workflows/ci.yml`) corre en cada push y PR a `develop`, `staging` y `main`, y todo bloquea el merge:

1. `format:check` → `lint` → `typecheck` → `test:coverage` → `build` → `test:e2e`
2. En paralelo: gitleaks (secretos en el historial) y `pnpm audit`

Además:

- **Presupuesto de JavaScript:** 240 KB gzip de primera carga por ruta, medido por `e2e/performance.spec.ts` ([`seo.md`](docs/ai-guidelines/seo.md)).
- **Accesibilidad:** WCAG 2.2 AA, con axe en los e2e, en claro y en oscuro.
- **Mobile first:** todo se prueba a 360 px y en desktop.

## Ambientes

| Rama      | Ambiente   | `APP_ENV`     | `API_MOCKS` |
| --------- | ---------- | ------------- | ----------- |
| `develop` | DEV        | `development` | `missing`   |
| `staging` | QA         | `preview`     | `missing`   |
| `main`    | Producción | `production`  | `false`     |

Fuera de producción el sitio no se indexa (`noindex` y `robots.txt` cerrado). En DEV y QA, cargar también las variables de Supabase y `DEV_LOGIN_*` para tener el login de desarrollo. Producción todavía no tiene login real ni la fase 3 del backend: logros y widgets no deberían publicarse ahí hasta entonces.

## Backend y contrato

- El contrato vigente vive en [`docs/references/api/`](docs/references/api/README.md); las respuestas del backend, en `docs/references/api/responses/`.
- Lo que el front necesita y el backend todavía no tiene se mockea y se propone en [`proposals.md`](docs/references/api/proposals.md). Es lo que se le pasa al equipo de backend.

## Asistentes de IA

- [`CLAUDE.md`](CLAUDE.md): Claude Code, el asistente principal. Carga las guías de `docs/ai-guidelines/`.
- [`AGENTS.md`](AGENTS.md): índice genérico para otras herramientas.
- `.claude/agents/ui-reviewer`: revisa cada vista contra las reglas de UI antes de un PR.

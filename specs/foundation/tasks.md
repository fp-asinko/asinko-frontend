# Foundation — Tasks

> **Spec:** `foundation` · **Rama:** `feature/foundation-project-setup` · **Estado:** ✅ aprobado (2026-10-01)
> **Fase:** 3 de 3 · Requirements ✅ · Design ✅

Cada tarea es un commit (o un grupo chico de commits) que deja el proyecto funcionando: compila, pasa lint y sus tests. Una tarea no está hecha sin sus tests. Complejidad: **S** (< 1 h) · **M** (1–3 h) · **L** (> 3 h o con riesgo técnico).

## Orden y dependencias

```
T-01 ─┬─ T-02 ── T-03 ── T-04
      ├─ T-05
      └─ T-06 ── T-07 ─┬─ T-08
                       ├─ T-09 ── T-10 ── T-11 ── T-12 ── T-13
                       └─ T-14 ── T-15 ── T-16
T-17 (después de T-11 y T-08) ── T-18 ── T-19 ── T-20
```

## Tareas

### Base del proyecto

- [x] **T-01 · Scaffold de Next.js 16 con pnpm** · M · F-01, F-02, F-07
  - `create-next-app` con TypeScript, App Router, Tailwind 4, `src/`, alias `@/`, **sin** ESLint del template (se configura en T-03).
  - `packageManager` (pnpm 11), `engines` (Node 24), `.nvmrc`. Versiones exactas de `next`, `react`, `react-dom`.
  - `tsconfig.json` estricto con las opciones de `tooling.md`.
  - Scripts de `tooling.md` y `testing.md` (los que dependen de tareas posteriores se completan ahí).
  - Leer `node_modules/next/dist/docs/` para los cambios de Next 16 antes de seguir.
  - **Verificación:** `pnpm typecheck` y `pnpm build` pasan; no existe otro lockfile.

- [x] **T-02 · Prettier, EditorConfig y VS Code** · S · F-05
  - Prettier + `prettier-plugin-tailwindcss` con la config de `tooling.md`. `.prettierignore`.
  - `.vscode/extensions.json` y `settings.json`.
  - **Verificación:** `pnpm format:check` pasa.

- [x] **T-03 · ESLint con reglas del proyecto** · M · F-03, F-04
  - Flat config: `eslint-config-next`, `jsx-a11y`, `boundaries` (tabla de `tooling.md`), `react/no-danger`, `no-restricted-imports` (`next/link`/`next/navigation` fuera de `src/i18n/`, `@radix-ui/*`), `no-console`, `eslint-config-prettier`.
  - Fixtures de violaciones en `src/test/fixtures/boundaries/` (excluidas de build y cobertura).
  - **Tests:** `eslint-rules.test.ts` corre ESLint (API de Node) sobre las fixtures y espera un error por regla: feature → feature, `components` → `features`, átomo → molécula, `next/link` fuera de `i18n/`, `dangerouslySetInnerHTML`, import de Radix.

- [x] **T-04 · Git hooks y commitlint** · S · F-06
  - Lefthook (`pre-commit`, `commit-msg`, `pre-push`) y `@commitlint/config-conventional` con los tipos de `conventions.md`.
  - **Tests:** `commitlint.test.ts` valida mensajes de ejemplo con la API de commitlint: acepta `feat(home): add feed`, rechaza `agregué cosas` y tipos fuera de la lista.

- [x] **T-05 · Vitest y Testing Library** · S · F-08, F-09
  - `vitest.config.mts` de `testing.md` (umbrales por carpeta), `src/test/setup.ts`.
  - **Verificación:** `pnpm test:coverage` corre y aplica umbrales (se prueba bajando uno temporalmente en local; no se commitea).

### Configuración e i18n

- [x] **T-06 · Variables de entorno** · S · F-29, F-30
  - `src/env.ts` con el esquema de `design.md` §6, `.env.example`.
  - **Tests:** `env.test.ts` sobre el esquema: falla sin `API_BASE_URL`, con URL inválida, y con `APP_ENV=production` + `API_MOCKS=true`; pasa con una config válida de preview con mocks.

- [x] **T-07 · next-intl, mensajes y layout por idioma** · M · F-11, F-13, F-14, F-15, F-08
  - `src/i18n/{routing,navigation,request}.ts`, `messages/{en,es,pt}.json` (namespaces `common`, `errors`, `api.errors`), `app/[locale]/layout.tsx` con `<html lang>`.
  - `src/test/render-with-intl.tsx`.
  - **Tests:** `messages.test.ts` (paridad de claves entre los tres idiomas, F-14) y `render-with-intl.test.tsx` (renderiza un texto traducido).

- [x] **T-08 · Proxy: locale + CSP con nonce, headers de seguridad** · **L** · F-12, F-27, F-28
  - `src/proxy.ts` según `design.md` §5; headers fijos en `next.config.ts`.
  - **Riesgo:** propagar el nonce al render con next-intl. Si no hay forma limpia, **parar y consultar** el plan B (CSP por hash + SRI) antes de aplicarlo.
  - **Tests:** `csp.test.ts` (unitario sobre la función que arma la política: con nonce, sin `unsafe-eval`/`unsafe-inline` en `script-src` cuando no es desarrollo, Sentry en `connect-src` solo con DSN). La parte de punta a punta queda en T-17.

### Design system y layout

- [x] **T-09 · shadcn con Base UI, tokens iOS y tipografía** · M · F-16, F-17, F-18
  - `shadcn init` (Base UI, default), tokens de `design.md` §4 en `:root`/`.dark`/`@theme inline`, fuente del sistema, utilidades de tipografía, `--radius`.
  - Componentes base que usa el shell: `button`, `switch`, `sheet`, `skeleton`.
  - **Tests:** `tokens-contrast.test.ts` lee los tokens de `globals.css` y verifica cada par texto/fondo ≥ 4,5:1 y no-texto ≥ 3:1, en claro y oscuro (D-01). `package.json` sin dependencias `@radix-ui/*` (lo cubre también ESLint).

- [ ] **T-10 · Tema claro/oscuro con toggle** · M · F-19, F-20, F-21
  - Provider de `next-themes` (`defaultTheme="light"`, `enableSystem={false}`, `nonce`), `ThemeToggle` (molécula) con el `Switch`.
  - **Tests:** `theme-toggle.test.tsx`: tiene nombre accesible traducido, se opera con teclado (Espacio), refleja y cambia el estado.

- [ ] **T-11 · Shell de 3 columnas** · **L** · F-22, F-23, F-23b, F-26
  - `asinko-logo` (átomo), organismos `site-header`, `sidebar-left` (fija en `md+`, `Sheet` en mobile), `bottom-nav`, `app-shell` y `PageColumns` (`design.md` §3). Barras translúcidas con fallback para `prefers-reduced-transparency`; transiciones con `motion-safe:`/`motion-reduce:`; link "Saltar al contenido"; landmarks.
  - Configuración de navegación con un solo ítem: Home.
  - `app/[locale]/page.tsx`: Home de relleno (título traducido), usando `PageColumns` sin `aside`.
  - **Tests:** uno por componente — `asinko-logo.test.tsx` (nombre accesible), `site-header.test.tsx` (logo lleva al Home, incluye el toggle), `bottom-nav.test.tsx` (solo ítems registrados, `aria-current` en el activo), `sidebar-left.test.tsx` (el botón de menú abre y cierra el panel, con teclado y Escape), `page-columns.test.tsx` (con y sin `aside`).
  - Correr el subagente `ui-reviewer` y las skills `apple-design` / `mobile-native` sobre el shell; aplicar lo que corresponda.

- [ ] **T-12 · Páginas de error y carga** · S · F-24, F-25
  - `not-found.tsx`, `[...rest]/page.tsx`, `error.tsx`, `global-error.tsx`, `loading.tsx` (`design.md` §10).
  - **Tests:** `not-found.test.tsx` (texto traducido y link al Home), `error.test.tsx` (mensaje traducido, "Reintentar" llama a `reset`).

- [ ] **T-13 · Metadata y SEO base** · S · F-31
  - `generateMetadata` con `metadataBase`, `alternates.languages` + `x-default`, canonical por idioma. `robots.ts` y `sitemap.ts`.
  - **Tests:** `robots.test.ts` (`Disallow: /` salvo `APP_ENV=production`).

### API, mocks y observabilidad

- [ ] **T-14 · Cliente HTTP** · M · F-32, F-33, F-34
  - `src/lib/api/` y `src/lib/result.ts` (`design.md` §7).
  - **Tests:** `client.test.ts` con `fetch` mockeado: respuesta válida → `ok`; respuesta que no cumple el esquema → lanza; cada fila de la tabla de errores (`401`, `404`, `403/409/422/429` con su clave, código desconocido → `UNKNOWN`, `5xx` y timeout → lanzan); el `message` del backend nunca aparece en el resultado. F-32 se verifica en T-17 (build).

- [ ] **T-15 · Mocks y usuario demo** · M · F-36, F-37, F-38
  - `src/mocks/` (`design.md` §8), `src/lib/session.ts` (`getViewer()`), mock de ejemplo `GET /api/v1/profiles/{identifier}`.
  - **Tests:** `match.test.ts` (rutas con parámetros, método distinto no matchea); `client.test.ts` suma: con mocks una ruta registrada no llama a `fetch` y una no registrada sí; `fixtures.test.ts` parsea todas las fixtures con sus esquemas; `session.test.ts` (demo con mocks, `null` sin mocks).

- [ ] **T-16 · Sentry opcional** · S · F-35
  - `instrumentation.ts`, `instrumentation-client.ts`, inicialización solo con DSN, `beforeSend` que limpia datos sensibles.
  - **Tests:** `sentry-scrub.test.ts` (el `beforeSend` elimina cookies, headers y query strings; sin DSN no se inicializa).

### Verificación de punta a punta y entrega

- [ ] **T-17 · Playwright y e2e** · M · F-10, F-12, F-13, F-19, F-20, F-21, F-24, F-26, F-27, F-28, F-31, F-32
  - `playwright.config.ts` (mobile + desktop, build de producción con mocks), helper de axe.
  - Specs de `design.md` §2:
    - `i18n.spec.ts`: `/` redirige según `Accept-Language` (`es` → `/es`, `fr` → `/en`); `lang` correcto por idioma.
    - `theme.spec.ts`: arranca claro con el sistema en oscuro (`colorScheme: 'dark'`); el toggle cambia y persiste al recargar; sin parpadeo (la clase está en `<html>` antes de hidratar).
    - `shell.spec.ts`: sin scroll horizontal a 360px; 1/2/3 columnas en 360/800/1280px; navegación completa con teclado; axe sin violaciones.
    - `errors.spec.ts`: URL inexistente → página "no encontrado" traducida, link al Home.
    - `security-headers.spec.ts`: CSP con nonce y **los `<script>` llevan ese nonce**; headers fijos presentes; `robots.txt` con `Disallow: /` en preview.
  - El build de producción verifica F-32: un Client Component de prueba que importe el cliente rompe el build (test de compilación en `src/test/fixtures/`, excluido del build normal).

- [ ] **T-18 · CI** · S · F-39
  - `.github/workflows/ci.yml` (`design.md` §13) con gitleaks y `pnpm audit`.
  - **Verificación:** el workflow pasa `actionlint`; se prueba de verdad cuando exista el repositorio remoto.

- [ ] **T-19 · Guías actualizadas** · S · F-40
  - `i18n.md` (render dinámico por CSP), `libraries.md` (`next-themes`, `@axe-core/playwright`, gitleaks), `design-system.md` (tokens iOS con regla de alto contraste, átomos de marca en `ui/`).

- [ ] **T-20 · Definition of Done** · S
  - Todos los gates locales en orden: `format:check` → `lint` → `typecheck` → `test:coverage` → `build` → `test:e2e`.
  - `ui-reviewer` sobre todo `src/` sin bloqueantes.
  - Probado a mano en 360px y desktop, con teclado, en claro y oscuro.
  - Specs actualizados si algo cambió; estado de `tasks.md` al día.

## Mapeo de criterios a verificación

| Criterio | Verificación                                                                            | Tarea      |
| -------- | --------------------------------------------------------------------------------------- | ---------- |
| F-01     | `pnpm build` + único lockfile                                                           | T-01       |
| F-02     | `pnpm typecheck` (CI)                                                                   | T-01       |
| F-03     | `pnpm lint` (CI) + `eslint-rules.test.ts`                                               | T-03       |
| F-04     | `eslint-rules.test.ts`                                                                  | T-03       |
| F-05     | `pnpm format:check` (CI)                                                                | T-02       |
| F-06     | `commitlint.test.ts` + hooks instalados                                                 | T-04       |
| F-07     | Scripts presentes y usados por CI                                                       | T-01, T-18 |
| F-08     | `render-with-intl.test.tsx`                                                             | T-05, T-07 |
| F-09     | `pnpm test:coverage` (CI)                                                               | T-05       |
| F-10     | `playwright.config.ts` + suite e2e                                                      | T-17       |
| F-11     | `i18n.spec.ts`                                                                          | T-07, T-17 |
| F-12     | `i18n.spec.ts`                                                                          | T-08, T-17 |
| F-13     | `i18n.spec.ts`                                                                          | T-07, T-17 |
| F-14     | `messages.test.ts`                                                                      | T-07       |
| F-15     | `messages.test.ts` + revisión de `ui-reviewer`                                          | T-07, T-20 |
| F-16     | ESLint (`@radix-ui/*`) + `components.json`                                              | T-09       |
| F-17     | `tokens-contrast.test.ts`                                                               | T-09       |
| F-18     | Revisión de `globals.css` (sin `next/font` ni fuentes externas) + CSP `font-src 'self'` | T-09       |
| F-19     | `theme.spec.ts`                                                                         | T-10, T-17 |
| F-20     | `theme.spec.ts`                                                                         | T-10, T-17 |
| F-21     | `theme-toggle.test.tsx` + axe                                                           | T-10, T-17 |
| F-22     | Revisión de `ui-reviewer` (`motion-safe`/`motion-reduce`)                               | T-11       |
| F-23     | Tests de componentes del shell + `shell.spec.ts`                                        | T-11, T-17 |
| F-23b    | `bottom-nav.test.tsx`                                                                   | T-11       |
| F-24     | `not-found.test.tsx` + `errors.spec.ts`                                                 | T-12, T-17 |
| F-25     | `error.test.tsx`                                                                        | T-12       |
| F-26     | `shell.spec.ts`                                                                         | T-11, T-17 |
| F-27     | `csp.test.ts` + `security-headers.spec.ts`                                              | T-08, T-17 |
| F-28     | `csp.test.ts` + `security-headers.spec.ts`                                              | T-08, T-17 |
| F-29     | `env.test.ts`                                                                           | T-06       |
| F-30     | `env.test.ts`                                                                           | T-06       |
| F-31     | `robots.test.ts` + `security-headers.spec.ts`                                           | T-13, T-17 |
| F-32     | Test de compilación (Client Component que importa el cliente)                           | T-14, T-17 |
| F-33     | `client.test.ts`                                                                        | T-14       |
| F-34     | `client.test.ts`                                                                        | T-14       |
| F-35     | `sentry-scrub.test.ts`                                                                  | T-16       |
| F-36     | `match.test.ts` + `client.test.ts`                                                      | T-15       |
| F-37     | `fixtures.test.ts`                                                                      | T-15       |
| F-38     | `session.test.ts`                                                                       | T-15       |
| F-39     | `ci.yml` (`actionlint`)                                                                 | T-18       |
| F-40     | Revisión del PR                                                                         | T-19       |

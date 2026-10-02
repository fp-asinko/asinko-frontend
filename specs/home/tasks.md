# Home — Tasks

> **Spec:** `home` · **Rama:** `feature/home-feed` · **Estado:** ✅ aprobado (2026-10-02)
> **Fase:** 3 de 3 · Requirements ✅ · Design ✅

Todo el Home consume los **mocks del contrato** (`src/mocks/`) a través de `apiRequest`, igual que consumirá el backend real: con `API_MOCKS=true` (default de `.env.example`) responden los mocks; cuando el backend implemente cada endpoint, se apaga su mock sin tocar las vistas.

Cada tarea deja todo en verde (formato, lint, tipos, tests, build) y tiene sus tests. Complejidad: **S** < 1 h · **M** 1–3 h · **L** > 3 h o con riesgo.

## Orden

```
T-01 ─ T-02 ─ T-03 ─ T-04 ─ T-05
                  └─ T-06 ─ T-07 ─ T-08 ─ T-09 ─ T-10 ─ T-11 ─ T-12 ─ T-13
```

## Tareas

- [x] **T-01 · Sistema visual del prototipo** · M · H-01, H-02, H-03, H-04
  - Tokens de `design.md` §2 en `globals.css` (claro y oscuro), sin sombras, radios, utilidades de tipografía.
  - Figtree con `next/font/google` en el layout.
  - **Tests:** `tokens-contrast.test.ts` con los pares nuevos (`--faint` e `--interesting` como no-texto).
  - Docs: `design-system.md`, `overview.md § Estilo`, nota en `specs/foundation/design.md` (D-01 y F-17/F-18 reemplazadas).

- [ ] **T-02 · Mocks que faltan** · S · H-07, H-15
  - `GET /users/:userId/following`, `PUT`/`DELETE /posts/:id/vote`, `PUT /polls/:id/vote`.
  - Usuario demo: miembro también de `eth` y `sol`; moderador de `trading-on-chain`.
  - **Tests:** handlers nuevos en `handlers.test.ts`; el test de fixtures los valida contra el contrato.

- [ ] **T-03 · Átomos y moléculas compartidas** · S · H-26, H-21
  - `avatar` (shadcn) con iniciales; molécula `coming-soon` (`aria-disabled`, burbuja "Próximamente" con `role="status"`); molécula `delta` (variación con flecha y color).
  - **Tests:** uno por componente.

- [ ] **T-04 · Shell como el prototipo** · M · H-05, H-06, H-08, H-26
  - `AppShell` de 3 columnas con slot izquierdo; columna derecha vacía (`div`).
  - `SiteHeader`: buscador centrado (desktop) e ícono (mobile), tokens, campana y perfil deshabilitados, toggle de tema.
  - `BottomNav` de 5 ítems (solo Home activo).
  - **Tests:** actualizados (header, bottom nav, app shell, panel mobile).

- [ ] **T-05 · Columna "Tus intereses"** · M · H-07, H-19, H-21
  - Feature `interests`: `interests-api.ts` + mappers + `interests-sidebar` (Activos, Personas, Grupos, Sugeridas) en `<details>`; errores por sección.
  - Inyectada en el layout (desktop y panel mobile).
  - **Tests:** mappers (cobertura de `lib/`), componentes de cada sección, sección con error.

- [ ] **T-06 · Datos del feed** · M · H-10, H-11, H-14, H-20, H-25
  - `feed-params.schema.ts` (`feed`, `filtro`, `comunidad`), `feed-api.ts` (`getFeed` con `keepValidItems`), `mappers.ts` (post, encuesta, comunidad resuelta), `mentions.ts` (marcado de `entities`).
  - **Tests:** esquema de parámetros (valores inválidos → default), mappers, menciones (offsets, activo sin comunidad, `@` sin link), filtro _Polls_.

- [ ] **T-07 · Markdown seguro** · S · H-12, H-14
  - `react-markdown` (server) con lista blanca, sin HTML crudo, links solo http/https con `rel="noopener noreferrer nofollow ugc"`, menciones `asinko:`.
  - `libraries.md` actualizado (D-H1).
  - **Tests:** HTML crudo escapado, `javascript:` bloqueado, títulos bajados a negrita, menciones renderizadas.

- [ ] **T-08 · Feed visible** · L · H-09, H-10, H-11, H-12, H-13, H-14, H-17, H-18
  - `composer-placeholder`, `feed-tabs`, `feed-filters`, `community-filter-chip`, `feed-list`, `post-card`, `poll-card` (sin votar todavía), `feed-empty`.
  - Página `(main)/page.tsx` con los `searchParams` validados; `loading.tsx` con skeletons de tarjetas.
  - **Tests:** cada componente (post normal, imagen, link, editado, borrado, sistema; encuesta visible, oculta, cerrada, votada), pestañas y filtros con `aria-current`.
  - Revisión visual contra el prototipo (capturas a 360 y 1440 px, claro y oscuro).

- [ ] **T-09 · Votar** · M · H-15, H-23
  - Actions `vote-post` y `vote-poll` (zod, `getViewer`, `ActionResult`); `vote-control` y `poll-voting` con `useOptimistic`.
  - **Tests:** actions con el cliente mockeado (éxito, sin viewer, error), componentes (aria-pressed, optimista, revertir).

- [ ] **T-10 · Cargar más** · L · H-16
  - **Riesgo:** Server Action que devuelve JSX. Si no funciona, **parar y consultar** el plan B (paginación por URL).
  - `load-more-feed.action.ts` + `load-more` (IntersectionObserver + botón).
  - **Tests:** action (siguiente página, fin de páginas), componente (agrega ítems, desaparece al final, teclado).

- [ ] **T-11 · i18n completo** · S · H-22
  - Namespaces `feed` e `interests` en `en`, `es`, `pt`; tiempo relativo y números compactos.
  - **Tests:** paridad de claves (existente), formato de números y fechas en los tres idiomas.

- [ ] **T-12 · E2E del Home** · M · H-06, H-10, H-11, H-14, H-15, H-16, H-23, H-24, H-26
  - `e2e/home.spec.ts`: el feed muestra los mocks; _Siguiendo_; filtro _Polls_; mención `$BTC` filtra por comunidad; votar; cargar más; elemento deshabilitado avisa "Próximamente"; axe; sin scroll horizontal a 360 / 800 / 1440.
  - `performance.spec.ts`: Home con y sin filtros ≤ 230 KB.

- [ ] **T-13 · Propuestas, guías y Definition of Done** · S
  - `proposals.md`: P-004 y P-005.
  - Todos los gates; `ui-reviewer` sin bloqueantes; revisión visual final contra el prototipo.

## Mapeo de criterios

| Criterio         | Verificación                                         | Tarea            |
| ---------------- | ---------------------------------------------------- | ---------------- |
| H-01, H-04       | `tokens-contrast.test.ts` + revisión visual          | T-01             |
| H-02             | Fuente autoalojada (sin requests a Google en e2e)    | T-01, T-12       |
| H-03             | `theme.spec.ts` (existente) + revisión visual oscura | T-01, T-08       |
| H-05, H-06, H-08 | Tests del shell + `home.spec.ts` (anchos)            | T-04, T-12       |
| H-07             | Tests de `interests`                                 | T-05             |
| H-09, H-12, H-13 | Tests de tarjetas                                    | T-08             |
| H-10, H-11       | Tests de pestañas/filtros + `home.spec.ts`           | T-06, T-08, T-12 |
| H-14             | Tests de menciones y Markdown + `home.spec.ts`       | T-06, T-07, T-12 |
| H-15             | Tests de votos + `home.spec.ts`                      | T-09, T-12       |
| H-16             | Tests de cargar más + `home.spec.ts`                 | T-10, T-12       |
| H-17, H-18       | `loading.tsx` + test de estado vacío                 | T-08             |
| H-19             | Test de sección con error + `error.tsx` (existente)  | T-05, T-06       |
| H-20             | Test de `getFeed` con ítem inválido                  | T-06             |
| H-21             | Test de mosaico con precio desactualizado            | T-05             |
| H-22             | Paridad de claves + formato                          | T-11             |
| H-23             | Tests de componentes + axe                           | T-08, T-09, T-12 |
| H-24             | `performance.spec.ts`                                | T-12             |
| H-25             | Revisión: datos solo desde `lib/` del feature        | T-06, T-13       |
| H-26             | Test de `coming-soon` + `home.spec.ts`               | T-03, T-12       |

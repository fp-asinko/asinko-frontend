# Filtro por tipo en el feed — Tasks

Rama: `feature/feed-type-filter`, desde `feature/thesis-ticket-card` (comparten `features/feed`). Aprobado por el PO el 2026-11-05.

- [ ] **T-01 (S)** `type` en `feedParamsSchema`, la compatibilidad de `?filter=polls` y `feedHref`. Tests. → FT-05, FT-10
- [ ] **T-02 (S)** `kind` por tipo en `feed-api.ts`. Tests. → FT-06
- [ ] **T-03 (M)** `FeedTypeMenu` y `FeedSort`, con sus tests y los textos en en, es y pt. → FT-04, FT-07, FT-09, FT-13
- [ ] **T-04 (M)** La barra del Home: `FeedTabs` con New y el selector a la derecha; el chip de comunidad debajo, solo si hay uno. Los vacíos por tipo. Tests. → FT-01 a FT-03, FT-08
- [ ] **T-05 (S)** Las páginas de comunidad y activo con New y el selector. → FT-11
- [ ] **T-06 (S)** e2e (elegir Theses, 360 px, axe en claro y oscuro), presupuesto de JS y `ui-reviewer`. → FT-02, FT-12, FT-14

## Criterios → tests

| Criterio     | Test                                              |
| ------------ | ------------------------------------------------- |
| FT-01–FT-03  | `feed-view.test.tsx`, `feed-tabs.test.tsx`, e2e   |
| FT-04, FT-07 | `feed-type-menu.test.tsx`                         |
| FT-05, FT-10 | `feed-params.schema.test.ts`, `feed-href.test.ts` |
| FT-06        | `feed-api.test.ts`                                |
| FT-08        | `feed-view.test.tsx`                              |
| FT-09        | `feed-sort.test.tsx`                              |
| FT-11        | `community-feed` e2e (`community-pages.spec.ts`)  |
| FT-12        | `e2e/feed-type-filter.spec.ts`                    |
| FT-13        | `messages.test.ts`                                |
| FT-14        | `performance.spec.ts`                             |

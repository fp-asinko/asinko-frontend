# Explore v1: "por qué ves esto" e impresiones — Tasks

Rama: `feature/explore-v1-reason-impressions`, desde `develop`.

- [x] **T-01 (S)** Contrato: `feedReasonSchema`, `reason` en `feedItemSchema`, `requestId` en la lista, `impressionsSchema`. El snapshot de `docs/references/api/` y los mocks (Explore con `reason` y `requestId`; Following y grupo con `requestId`; `POST /feed/impressions`). Tests de esquema y de fixtures. → EX-02, EX-13
- [x] **T-02 (S)** Dominio: `FeedReason`, `toFeedReason`, `reason` y `requestId` en `getFeed` (y `null` fuera del Explore del Home). Tests. → EX-02, EX-03
- [x] **T-03 (S)** `FeedReasonLine` en `PostCard` y `PollCard`, con los textos en en, es y pt. Tests. → EX-01, EX-04
- [ ] **T-04 (M)** Ruta `POST /api/impressions` e `impressions-api.ts`: Origin, tamaño, zod, `userId` de la sesión, siempre `204`. Tests. → EX-08, EX-09, EX-10
- [ ] **T-05 (M)** `impression-queue.ts` e `ImpressionTracker`: visto, abierto, lotes, vaciar al ocultar. `data-content-id` y `data-content-path` en las tarjetas; `OWN_CLICK` exportado. Tests con un `IntersectionObserver` falso y relojes falsos. → EX-05, EX-06, EX-07, EX-09
- [ ] **T-06 (S)** El tracker en `FeedListView` y en `loadMoreFeed`. Tests. → EX-07
- [ ] **T-07 (M)** e2e (Home, grupo, "Cargar más", salir de la página), 360 px, axe en claro y oscuro, presupuesto de JS, `pnpm api:smoke` contra `dev`, `ui-reviewer`. → EX-11, EX-12, EX-13

Orden: T-01 → T-03 entrega la etiqueta sola (se puede mergear antes del cierre del sprint); T-04 → T-07, las impresiones. Commit al cerrar T-03 y T-07.

## Mapa de criterios a tests

| Criterio | Test                                                                     |
| -------- | ------------------------------------------------------------------------ |
| EX-01    | `feed-reason-line.test.tsx`, `post-card.test.tsx`, e2e `explore.spec.ts` |
| EX-02    | `content.test.ts`, `mappers.test.ts`                                     |
| EX-03    | `feed-api.test.ts`, e2e (Following y grupo sin línea)                    |
| EX-04    | `feed-reason-line.test.tsx` (es y pt, país desconocido), axe             |
| EX-05    | `impression-tracker.test.tsx`                                            |
| EX-06    | `impression-tracker.test.tsx` (título, tarjeta, voto, mención)           |
| EX-07    | `impression-queue.test.ts`, e2e (beacon al navegar)                      |
| EX-08    | `route.test.ts` (sesión, sin sesión, `userId` del cuerpo ignorado)       |
| EX-09    | `route.test.ts`, `impression-queue.test.ts`                              |
| EX-10    | `impressions-api.test.ts`                                                |
| EX-11    | e2e (axe, 360 px)                                                        |
| EX-12    | `performance.spec.ts`                                                    |
| EX-13    | `fixtures.test.ts`, `pnpm api:smoke`                                     |

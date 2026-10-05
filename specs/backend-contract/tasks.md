# Front adaptado al contrato nuevo del backend — Tasks

> **Estado:** aprobado el 2026-10-04.

```
T-01 ─┬─ T-02 ─┐
      ├─ T-03 ─┼─ T-05
      └─ T-04 ─┘
```

## Tareas

- [x] **T-01 · Esquemas y mocks** · M · BC-05
  - `communitySummarySchema`, `community` en `postSchema`/`pollSchema` y `commentCount` en `pollSchema`.
  - En los fixtures: `community` y `commentCount`, y `body: ""` en lo borrado.
  - En los handlers de comentarios: `limit` y `replies`.
  - **Tests:** `fixtures.test.ts` con los ejemplos nuevos; unitario de los handlers (`limit` inválido ignorado, `replies=false` sin respuestas).

- [x] **T-02 · Comunidad desde el contenido** · M · BC-01, BC-02
  - Mappers con `post.community` y `poll.community`.
  - `MentionIndex` solo cuando hay entidades. `getFeed` sin el request fijo a `/communities`.
  - **Tests:** `mappers.test.ts` y `feed-api.test.ts` (los tres casos de § 6).

- [x] **T-03 · Comentarios de la encuesta** · S · BC-03
  - `commentCount` en `PollItem` y el botón con la cantidad.
  - **Tests:** `poll-card.test.tsx` y un caso en `e2e/home.spec.ts`.

- [x] **T-04 · Vista previa con `limit`** · S · BC-04
  - `?limit=6&replies=false` en `getCommentsPreview`.
  - **Tests:** `comments-api.test.ts` verifica la query y que sigue filtrando borrados y respuestas.

- [ ] **T-05 · Documentación y verificación** · S · BC-06, BC-07, BC-08
  - Snapshot del contrato, `proposals.md`, `specs/home` y `api-integration.md`.
  - `pnpm api:smoke` contra el backend local; el Home con `API_MOCKS=missing`.
  - e2e completo y presupuesto de JS.

## Criterios → tests

| Criterio | Test                                                      |
| -------- | --------------------------------------------------------- |
| BC-01    | `mappers.test.ts`, `feed-api.test.ts`                     |
| BC-02    | `feed-api.test.ts` (sin entidades no pide `/communities`) |
| BC-03    | `poll-card.test.tsx`, `e2e/home.spec.ts`                  |
| BC-04    | `comments-api.test.ts`                                    |
| BC-05    | `src/mocks/fixtures.test.ts`, test de handlers            |
| BC-06    | Revisión del PR                                           |
| BC-07    | `pnpm api:smoke`                                          |
| BC-08    | e2e existentes, `e2e/performance.spec.ts`                 |

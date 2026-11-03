# Una tesis en el feed y en su página — Tasks

Rama: `feature/thesis-detail-lifecycle`, desde `feature/thesis-create`. Requirements (Q1 a Q5), design y tasks aprobados por el PO el 2026-11-03 ("dale").

- [x] **T-01 (M)** El organismo `components/organisms/thesis-summary/`: `ThesisState` (movido de `features/communities`) y `ThesisSummary`, con sus textos en `thesisSummary`. La tarjeta del perfil y la destacada pasan a usarlo sin cambiar cómo se ven. Tests. → TD-03, TD-17
- [x] **T-02 (M)** `ThesisItem` en `feed.types.ts`, el mapper de `THESIS` y `THESIS` en `KNOWN_KINDS`. Mocks: tesis en los feeds, `GET /theses/:id` con `liveExample`, y cancelar y votar con sus errores. Tests y `fixtures.test.ts`. → TD-01, TD-20
- [x] **T-03 (M)** La tarjeta del feed (`features/feed/components/thesis-card.tsx`): la cabecera con la píldora Tesis, el cuerpo, cuánto falta, las acciones y el link. La rama en `FeedItems`. Textos en en, es y pt. Tests. → TD-02 a TD-05, TD-21
- [x] **T-04 (S)** Votar: `kind="thesis"` en `VoteControl`, `vote-thesis.action.ts` y `voteThesisAs`. Tests. → TD-16
- [ ] **T-05 (L)** La página `/thesis/[id]`:
  - `getThesis`, `ThesisDetail`, el bloque de la apuesta y el de estado, y los argumentos con "Próximamente";
  - la columna derecha, la metadata, la imagen para compartir, el 404 y el error.
    Tests. → TD-06 a TD-11
- [ ] **T-06 (M)** Cancelar: `ThesisMenu`, `CancelThesisDialog` (diferida), `cancel-thesis.schema.ts`, `cancel-thesis.action.ts` y `cancelThesisAs`, con sus errores. Tests. → TD-12 a TD-15
- [ ] **T-07 (S)** La tarjeta del perfil como link a la página. Tests. → TD-17
- [ ] **T-08 (M)** E2E (`e2e/thesis-detail.spec.ts`): ver en el feed, abrir, votar, cancelar, 404, 360 px y axe en claro y oscuro. `performance.spec.ts` con `/thesis/{id}`. `ui-reviewer`. → TD-18, TD-19
- [ ] **T-09 (S)** A mano contra `dev` con la cuenta del PO: ver las dos tesis de prueba en su grupo y en el Home, abrir su página y votar. Cancelar solo con una tesis nueva, si el PO lo pide: las de prueba se quedan.

Orden: T-01 → T-02 → T-03 → T-04 → T-05 → T-06 → T-07 → T-08 → T-09. T-04 y T-07 no dependen de T-05.

| Criterio | Test                                                                                |
| -------- | ----------------------------------------------------------------------------------- |
| TD-01    | `mappers.test.ts`, `feed-api.test.ts`, e2e (tesis en el Home, el grupo y el activo) |
| TD-02    | `thesis-card.test.tsx` (feed: cabecera y píldora)                                   |
| TD-03    | `thesis-summary.test.tsx`, `thesis-card.test.tsx` (cuánto falta, resolución)        |
| TD-04    | `thesis-card.test.tsx` (acciones)                                                   |
| TD-05    | `thesis-card.test.tsx` (link), e2e (abrir desde el feed)                            |
| TD-06    | e2e (la página, Volver, el razonamiento)                                            |
| TD-07    | `thesis-bet.test.tsx`                                                               |
| TD-08    | `thesis-bet.test.tsx` (cada estado)                                                 |
| TD-09    | e2e (contadores y "Próximamente")                                                   |
| TD-10    | `thesis-api.test.ts` (id inválido), e2e (404)                                       |
| TD-11    | e2e (título, canonical, `hreflang`, `og:image`)                                     |
| TD-12    | `thesis-card.test.tsx` (⋯ solo con `canCancel`)                                     |
| TD-13    | `cancel-thesis-dialog.test.tsx` (motivo obligatorio, contador)                      |
| TD-14    | `cancel-thesis.action.test.ts` (`userId` de la sesión), e2e (pasa a Cancelada)      |
| TD-15    | `cancel-thesis.action.test.ts` (cada error), `cancel-thesis-dialog.test.tsx`        |
| TD-16    | `vote.action.test.ts`, `votes-api.test.ts`, e2e (votar)                             |
| TD-17    | `thesis-card.test.tsx` (perfil: link)                                               |
| TD-18    | e2e (360 px, teclado, axe)                                                          |
| TD-19    | `performance.spec.ts`                                                               |
| TD-20    | `fixtures.test.ts`                                                                  |
| TD-21    | `messages.test.ts`                                                                  |

# Argumentos y actualizaciones de una tesis — Tasks

Rama: `feature/thesis-arguments`, desde `feature/thesis-detail-lifecycle`. Requirements con Q1 a Q6 resueltas por el PO el 2026-11-03; design pendiente de aprobación.

- [ ] **T-01 (M)** El destino de los comentarios (`CommentTarget`): `comments-api.ts`, la acción y su esquema, `CommentTree`, `CommentItem`, `CommentReply` y `CommentComposer`. El post pasa a usarlo sin cambiar su comportamiento. Tests. → TA-02, TA-05
- [ ] **T-02 (M)** Mocks: argumentos de los dos lados con respuestas y anuncios, `GET`/`POST` de comentarios de una tesis con `side`, y `GET`/`POST` de actualizaciones con sus errores. `fixtures.test.ts`. → TA-15
- [ ] **T-03 (M)** `ThesisArguments`: las pestañas como links en la URL, el orden, la caja de cada lado, la lista, los vacíos y el contador que sube. El link del feed al lado que tiene más. Textos. Tests. → TA-01 a TA-08, TA-16
- [ ] **T-04 (M)** Actualizaciones: `thesis-updates-api.ts`, `create-thesis-update.action.ts`, `ThesisUpdates` y `ThesisUpdateComposer` (diferida). Textos. Tests. → TA-09 a TA-12, TA-16
- [ ] **T-05 (S)** `proposals.md` P-039 para Eugenio (lado de una respuesta, largo de una actualización, anuncios, forma de `/updates`) y el snapshot de E11. → Q2, Q4, Q5, Q6
- [ ] **T-06 (M)** E2E (`e2e/thesis-arguments.spec.ts`): argumentar de cada lado, responder, publicar una actualización, 360 px y axe en claro y oscuro. `performance.spec.ts`. `ui-reviewer`. → TA-13, TA-14
- [ ] **T-07 (S)** A mano contra `dev` con la cuenta del PO: un argumento de cada lado en la tesis de `#chile`, una respuesta y una actualización.

Orden: T-01 → T-02 → T-03 → T-04 → T-05 → T-06 → T-07. T-05 puede ir en cualquier momento.

| Criterio | Test                                                                                  |
| -------- | ------------------------------------------------------------------------------------- |
| TA-01    | `thesis-arguments-query.schema.test.ts` (lado por defecto y desconocido), e2e         |
| TA-02    | `comment-tree.test.tsx` (destino de tesis), e2e                                       |
| TA-03    | e2e (orden en la URL)                                                                 |
| TA-04    | `comment-composer.test.tsx` (texto del lado), `comment.action.test.ts` (`side`)       |
| TA-05    | `comment.action.test.ts` (el `side` sale del destino), e2e (responder)                |
| TA-06    | `thesis-arguments.test.tsx` (vacío), e2e                                              |
| TA-07    | `comment-composer.test.tsx` (contador)                                                |
| TA-08    | `thesis-card.test.tsx` (link al lado que tiene más)                                   |
| TA-09    | `thesis-updates.test.tsx`, `thesis-updates-api.test.ts`                               |
| TA-10    | `create-thesis-update.action.test.ts`, `thesis-update-composer.test.tsx`, e2e         |
| TA-11    | `create-thesis-update.action.test.ts` (cada error), `thesis-update-composer.test.tsx` |
| TA-12    | `thesis-update-composer.test.tsx` (aviso)                                             |
| TA-13    | e2e (360 px, axe)                                                                     |
| TA-14    | `performance.spec.ts`                                                                 |
| TA-15    | `fixtures.test.ts`                                                                    |
| TA-16    | `messages.test.ts`                                                                    |

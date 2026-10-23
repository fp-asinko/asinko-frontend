# Comentar desde la tarjeta — Tasks

Rama: `feature/card-comment-quick`, desde `develop`.

- [x] **T-01 (S)** `cardCommentSchema`, `createCommentAs` con destino post o encuesta, `commentFromCard`, el mock de `POST /polls/:id/comments` si falta. Tests. → CC-04, CC-05
- [x] **T-02 (M)** `CommentComposer` con `send`, `onSent({ id, body })` y `boxId`; `CardComments`; `loadCommentsPreview` lo usa. Tests. → CC-01, CC-02, CC-04, CC-06
- [x] **T-03 (S)** `CommentCount` y el contexto de `CommentsToggle`; post y encuesta lo usan. Tests. → CC-03
- [x] **T-04 (M)** e2e (comentar un post y una encuesta desde el Home, sin sesión, teclado, 360 px, axe), presupuesto de JS; merge a `develop`. → CC-01 a CC-07

| Criterio     | Test                                                                           |
| ------------ | ------------------------------------------------------------------------------ |
| CC-01, CC-02 | `card-comments.test.tsx`, e2e `card-comment.spec.ts`                           |
| CC-03        | `comment-count.test.tsx`, e2e                                                  |
| CC-04        | `comment-from-card.action.test.ts`, `card-comments.test.tsx`, e2e (sin sesión) |
| CC-05        | `comment-from-card.action.test.ts`                                             |
| CC-06        | e2e (axe, teclado, 360 px)                                                     |
| CC-07        | `performance.spec.ts`                                                          |

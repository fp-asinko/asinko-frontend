# Thoughts y posts sin cuerpo — Tasks

Rama: `feature/thoughts-and-bodyless-posts`, desde `develop`. **Solo local: no se pushea ni se mergea hasta que el PO lo diga.**

- [x] **T-01 (M)** Contrato (`THOUGHT` en post, feed y borrador; cuerpo opcional), snapshot, mocks (fixtures, filtro por `kind`, `POST /posts`). Tests. → TH-09, TH-11
- [x] **T-02 (S)** Dominio: `thought` en `PostItem`, `toFeedItem`, el slug y la descripción. Tests. → TH-02, TH-08
- [x] **T-03 (M)** `PostCard` con el thought (cita, marca, nombre del artículo) y sin cuerpo vacío; su página. Textos. Tests. → TH-02, TH-06 a TH-08
- [x] **T-04 (M)** Crear: esquema, pestaña Thought en el editor, `?type=thought`, el ícono de la caja habilitado, borradores y vista previa. Tests. → TH-01, TH-03 a TH-05
- [x] **T-05 (M)** e2e (crear un post sin cuerpo y un thought, verlos en el Home y en su página, el ícono), 360 px, axe, presupuesto, `api:smoke`. Commit en la rama, **sin push**. → TH-10, TH-11

| Criterio     | Test                                                                         |
| ------------ | ---------------------------------------------------------------------------- |
| TH-01, TH-03 | `create-post.schema.test.ts`, `post-editor.test.tsx`, e2e `thoughts.spec.ts` |
| TH-02        | `post-card.test.tsx`, `mappers.test.ts`                                      |
| TH-04        | `composer-placeholder.test.tsx`, e2e                                         |
| TH-05        | `composer.action.test.ts`, e2e                                               |
| TH-06, TH-07 | `post-card.test.tsx`, e2e                                                    |
| TH-08        | `paths.test.ts`, e2e                                                         |
| TH-09        | `feed-api.test.ts`, `handlers.test.ts`                                       |
| TH-10        | e2e (axe, 360 px), `performance.spec.ts`                                     |
| TH-11        | `fixtures.test.ts`, `pnpm api:smoke`                                         |

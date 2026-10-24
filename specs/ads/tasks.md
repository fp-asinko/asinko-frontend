# Anuncios en los feeds y en el detalle — Tasks

Rama: `feature/ads-in-feed-and-detail`, desde `develop`.

- [x] **T-01 (M)** P-031 en `proposals.md`; `adSchema`; `AD` en el feed y `ads` en los comentarios; mocks con las seis piezas. Tests de esquema y de mocks. → AD-01, AD-04, AD-05, AD-08
- [x] **T-02 (S)** `AdItem`, `toAdItem` (solo `http(s)`, dominio), `getFeed` y `getCommentTree` con anuncios. Tests. → AD-01, AD-04, AD-06, AD-08
- [x] **T-03 (M)** `FeedAd`, `CommentAd` y dónde va cada uno; textos en en, es y pt. Tests. → AD-02, AD-03, AD-04, AD-06, AD-07
- [x] **T-04 (M)** e2e (Home, cargar más, grupo, detalle, búsqueda sin anuncios), 360 px, axe, presupuesto; `ui-reviewer`; merge a `develop`. → AD-01 a AD-09

| Criterio     | Test                                                             |
| ------------ | ---------------------------------------------------------------- |
| AD-01        | `handlers.test.ts`, `feed-api.test.ts`, e2e `ads.spec.ts`        |
| AD-02, AD-03 | `feed-ad.test.tsx`, e2e (alto de la vertical, sin salto)         |
| AD-04, AD-05 | `comments-api.test.ts`, `comment-tree.test.tsx`, e2e             |
| AD-06        | `mappers.test.ts` (esquemas que no son http), `feed-ad.test.tsx` |
| AD-07        | `feed-ad.test.tsx`, `comment-ad.test.tsx`, axe                   |
| AD-08        | `feed-api.test.ts`                                               |
| AD-09        | e2e (360 px, axe), `performance.spec.ts`                         |

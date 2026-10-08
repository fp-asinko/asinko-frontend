# Detalle de post, segunda vuelta — Tasks

> Se empiezan cuando el PO apruebe `requirements.md` (Q1 y Q2).

- [ ] **T-01 (S)** `BackButton` a `components/molecules` con las variantes `overlay` y `plain`; el detalle lo usa. Tests. → PD-01, PD-12
- [ ] **T-02 (S)** La caja de comentario cerrada y abierta. Tests. → PD-02, PD-12
- [ ] **T-03 (M)** Contrato y mocks: P-014 (orden y búsqueda) y P-015 (anuncios) en `proposals.md`, los mocks y sus fixtures (más de 20 comentarios en un post para ver anuncios), con `fixtures.test.ts`. → PD-03, PD-05, PD-08, PD-11
- [ ] **T-04 (M)** Orden: esquema, `getCommentTree` con `sort`, `CommentsSort` y la página leyendo `searchParams`. Tests. → PD-03, PD-04
- [ ] **T-05 (M)** Búsqueda: `searchComments`, `CommentsSearch` y `CommentSearchResults`. Tests. → PD-05, PD-06
- [ ] **T-06 (M)** Anuncios: mapper, `withAds`, `CommentAd` en el árbol. Tests. → PD-07 a PD-10
- [ ] **T-07 (S)** Textos en en, es y pt; e2e (mobile y desktop, axe en los dos temas, 360 px) y presupuesto de JS; `ui-reviewer`. → PD-12 a PD-14

Orden: T-01 → T-02 → T-03 → T-04 → T-05 → T-06 → T-07.

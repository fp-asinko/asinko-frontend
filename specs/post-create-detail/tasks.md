# Crear post y detalle de post — Tasks

## Parte 1: detalle

- [x] **T-01 (S)** Contrato y mocks:
  - Respuestas de crear post, crear comentario y votar comentario.
  - Mocks de `POST /posts`, `POST /posts/:id/comments` y `PUT/DELETE /comments/:id/vote`.
  - Tests: `fixtures.test.ts` y `handlers.test.ts`. → PC-10, PC-15, PC-16
- [x] **T-02 (S)** `postPath` y el slug en `lib/posts/`, con sus tests. → PC-12
- [x] **T-03 (M)** Ruta `/post/[id]/[[...slug]]`:
  - El post completo, reusando las piezas de la tarjeta.
  - 308 al slug canónico y 404.
  - Metadata.
  - Tests. → PC-12, PC-13
- [x] **T-04 (M)** Comentarios del detalle:
  - Árbol completo con plegado desde el nivel 4.
  - Comentar y responder (`createComment`, al instante y después `refresh`).
  - Votar comentarios (`voteComment`).
  - Tests. → PC-14 a PC-16
- [ ] **T-05 (S)** Del feed al detalle: el título de la tarjeta y "Ver todos los comentarios". Tests. → PC-17

## Parte 2: crear

- [ ] **T-06 (S)** Componentes de shadcn (`field`, `input`, `textarea`, `tabs`, `combobox`) y `react-hook-form` con `@hookform/resolvers`. Se suman a `libraries.md` si cambia algo. → PC-08
- [ ] **T-07 (M)** Contexto `compose` (organismo), `ComposerRoot` y `ComposeScope` (feature), y los accesos: "+ Crear" en la barra superior, "Crear" en la barra inferior y la caja de arriba. Sin sesión, el modal. Tests. → PC-01 a PC-04
- [ ] **T-08 (L)** El editor:
  - Esquema, comunidad (combobox con tus comunidades y búsqueda), pestañas (Imagen Próximamente), campos con contador y errores, y descartar con confirmación.
  - `createPost`, y al publicar, el detalle.
  - Tests. → PC-05 a PC-11
- [ ] **T-09 (M)** E2E `post-create-detail.spec.ts` (mobile + desktop, axe, 360 px), presupuesto de JS y guías. → PC-18 a PC-20

Orden: T-01 → T-02 → T-03 → T-04 → T-05 → (parte 2) T-06 → T-07 → T-08 → T-09.

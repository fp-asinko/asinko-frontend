# Crear un grupo — Tasks

> Basado en `requirements.md` y `design.md` (2026-11-06). Rama `feature/community-create`, desde `develop`. Cada tarea lleva sus tests.

## Tareas

- [x] **T1 — Contrato y mocks (M).**
  - En `src/mocks`: `POST /communities`, con `409` y `422`, y `PATCH /communities/:slug`, solo para `avatarUrl` y `bannerUrl` (design § 8).
  - Los dos se agregan a `handlers.test.ts` y `fixtures.test.ts`, y a la tabla de `src/mocks/README.md`.
  - P-048 va a `proposals.md`.
  - Tests: `handlers.test.ts`.
  - Depende de: —.
- [x] **T2 — Esquema y `slugify` (S).** `schemas/create-group.schema.ts` y `lib/slugify.ts` (design § 2 y § 3).
  - Tests: los bordes de cada campo; para `slugify`, acentos, símbolos, guiones repetidos, el corte en 30 y la entrada vacía.
  - Depende de: —.
- [x] **T3 — Disponibilidad del handle (S).** `lib/group-slug.ts` y `check-group-slug.action.ts`, y el hook `use-slug-availability.ts` con debounce y descarte de respuestas viejas.
  - Tests: de la acción con `lib` mockeado; del hook con timers falsos.
  - Depende de: T1, T2.
- [x] **T4 — Crear y subir imágenes, del lado del servidor (M).**
  - `lib/create-group.ts` y `create-group.action.ts`;
  - `lib/update-group-images.ts` y `upload-group-image.action.ts`.
  - Tests: de las acciones, con input inválido, sin sesión, el `userId` de la sesión, los `409` y `422` mapeados al campo, y el `PATCH` con la URL de la respuesta.
  - Depende de: T1, T2.
- [x] **T5 — Piezas compartidas (S).**
  - `FIELD_BOX` pasa de `composer` a `components/` (`field-styles.ts`), y `composer` lo importa de ahí.
  - `ProfileImages` suma `shape` y cambia `username` por `colorKey`.
  - Tests: los de `ProfileImages` siguen pasando, más uno con `square`.
  - Depende de: —.
- [x] **T6 — `GroupPreview` (S).** Organismo sin negocio (design § 4).
  - Tests: con y sin imágenes, el `#your-group` sin handle, la descripción recortada.
  - Depende de: —.
- [x] **T7 — `GroupImageCropper` (S).** Recorta sin subir y devuelve el `Blob`.
  - Tests: aplicar, volver, un error de imagen.
  - Depende de: T5.
- [x] **T8 — El formulario (L).**
  - `CreateGroupForm` con los pasos, el handle que sigue al nombre, los contadores, la vista previa (en línea y con portal), las imágenes y `use-create-group.ts`: crear, subir, navegar, el aviso si falla una imagen, el foco en el error y `beforeunload`.
  - Tests: CG-03 a CG-12 con las acciones mockeadas.
  - Depende de: T2 a T7.
- [x] **T9 — Ruta, columna y entrada (M).**
  - `create-group/page.tsx` con metadata y `noindex`, `@right/create-group/page.tsx`, la vista sin sesión y el formulario diferido.
  - El link "Create group" en la columna izquierda.
  - Los textos `createGroup` en en, es y pt, y `CLIENT_NAMESPACES`.
  - Tests: los de `interests-sections` actualizados, más el de `client-messages`.
  - Depende de: T8.
- [x] **T10 — E2E (M).** `e2e/community-create.spec.ts`, en mobile y desktop:
  - crear un grupo con nombre y handle automático y llegar a `/hub/{slug}` como moderador, con el grupo en la columna izquierda;
  - el aviso de handle tomado;
  - un `409` al enviar;
  - el aviso para entrar sin sesión (cookie `asinko-mock-guest=1`);
  - 360 px sin scroll horizontal;
  - axe en claro y oscuro.

  Se suma la ruta a `performance.spec.ts`.
  - Depende de: T9.

- [ ] **T11 — Cierre (S).**
  - Pasar `ui-reviewer`.
  - Actualizar `libraries.md` si hiciera falta (no se esperan dependencias nuevas).
  - Medir el JS de la ruta y anotarlo en `seo.md`.
  - `pnpm lint`, `typecheck`, `test:coverage` y `test:e2e` en verde.
  - Depende de: T10.

## Criterios → tests

| Criterio     | Test                                                                            |
| ------------ | ------------------------------------------------------------------------------- |
| CG-01, CG-02 | `interests-sections.test.tsx`; e2e: entrada y vista sin sesión                  |
| CG-03, CG-04 | `create-group.schema.test.ts`, `create-group-form.test.tsx`                     |
| CG-05        | `slugify.test.ts`, `create-group-form.test.tsx`                                 |
| CG-06, CG-07 | `use-slug-availability.test.ts`, `check-group-slug.action.test.ts`; e2e: tomado |
| CG-08        | `group-preview.test.tsx`, `create-group-form.test.tsx`                          |
| CG-09, CG-10 | `create-group.action.test.ts`; e2e: crear y llegar al grupo                     |
| CG-11        | `create-group.action.test.ts`, `upload-group-image.action.test.ts`, form; e2e   |
| CG-12        | `create-group-form.test.tsx`                                                    |
| CG-13        | e2e: 360 px y axe                                                               |
| CG-14        | `performance.spec.ts`                                                           |
| CG-15        | `handlers.test.ts`, `fixtures.test.ts`, `messages` (mismas claves)              |

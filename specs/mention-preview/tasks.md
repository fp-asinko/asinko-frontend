# Vista previa de menciones — Tasks

> Aprobado por el PO el 2026-10-08.

- [x] ~~**T-01 (S)** Mover las llamadas de comunidad y perfil a `lib/communities/`.~~ No hizo falta: todo vive en `features/communities` y el layout monta el escucha (design.md, ajustes).
- [x] **T-02 (M)** `getPreview` (Server Action, zod, DTO mínimo), `getPreviewData` y el atributo `data-preview`, con tests. Ancla externa del `HoverCard` verificada. → MP-03 a MP-05, MP-08, MP-12
- [x] **T-03 (M)** `PreviewCard` y `PreviewPopover` (grupo, activo, persona, esqueleto) con unirse y seguir, y textos en en, es y pt, con tests. → MP-03 a MP-06, MP-13
- [x] **T-04 (M)** `MentionPreviews` en el layout (escucha delegado, pausa, margen, Esc, foco, caché) y los atributos en `post-markdown`, `CardByline` y el autor del comentario, con tests. → MP-01, MP-02, MP-07 a MP-10
- [x] **T-05 (S)** E2E (desktop y mobile, axe en los dos temas) y presupuesto de JS. → MP-01, MP-02, MP-10, MP-11, MP-13

Orden: T-02 → T-03 → T-04 → T-05.

# Vista previa de menciones — Tasks

> Aprobado por el PO el 2026-10-08.

- [ ] **T-01 (S)** Mover las llamadas de comunidad y perfil y sus mappers de `features/communities/lib` a `lib/communities/` (sin cambio de comportamiento). Los tests existentes siguen pasando. → base de MP-12
- [ ] **T-02 (M)** `getPreview` (Server Action, zod, DTO mínimo) y el esquema de `data-preview`, con tests. Verificar el ancla externa de Base UI (`HoverCard` o `Popover`). → MP-03 a MP-05, MP-08, MP-12
- [ ] **T-03 (M)** `PreviewCard` (grupo, activo, persona, esqueleto) con unirse y seguir, y textos en en, es y pt, con tests. → MP-03 a MP-06, MP-13
- [ ] **T-04 (M)** `PreviewHost` en el shell (escucha delegado, pausa, margen, Esc, foco, caché) y los atributos en `post-markdown`, `CardByline` y el autor del comentario, con tests. → MP-01, MP-02, MP-07 a MP-10
- [ ] **T-05 (S)** E2E (desktop y mobile, axe en los dos temas) y presupuesto de JS; `ui-reviewer`. → MP-01, MP-02, MP-10, MP-11, MP-13

Orden: T-01 → T-02 → T-03 → T-04 → T-05.

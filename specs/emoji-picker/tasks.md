# Selector de emojis — Tasks

> Aprobado por el PO el 2026-10-08.

- [x] **T-01 (S)** `insertText` sale de `mention-assist` a `lib/insert-text.ts`, la usan los dos. Tests. → EP-03
- [x] **T-02 (M)** `emoji-data.ts` (~280 emojis, categorías, nombres en en, es y pt) y la búsqueda; `recent-emojis.ts`. Tests. → EP-04 a EP-06
- [x] **T-03 (M)** `Popover` de shadcn; `EmojiPanel` (buscador, categorías, grilla con teclado, resultados anunciados) y `EmojiButton` con la carga diferida; textos en en, es y pt. Tests. → EP-02, EP-03, EP-07 a EP-09, EP-11
- [x] **T-04 (S)** El botón en el editor de posts y en comentar y responder. Tests. → EP-01
- [x] **T-05 (S)** E2E (mobile y desktop, axe en los dos temas, 360 px), presupuesto de JS y `ui-reviewer`. → EP-08 a EP-10

Orden: T-01 → T-02 → T-03 → T-04 → T-05.

# Columna derecha — Tasks

> **Estado:** aprobado el 2026-10-04 y cerrado el 2026-10-05.
>
> **Cierre:**
>
> - Tests: 522 unitarios y 115 e2e en verde (mobile y desktop, con axe).
> - JS del Home: 228,1 KB de 230 (+0,2 KB).
> - Revisión con `ui-reviewer` aplicada; los detalles, en `design.md § 6`.

```
T-01 ─┬─ T-02 ─┐
      └─ T-03 ─┴─ T-04
```

## Tareas

- [x] **T-01 · Slot en `AppShell`** · S · RC-01, RC-04, RC-05
  - Prop `right`, el `aside` con nombre, sticky con scroll propio y oculto debajo de `lg`.
  - **Tests:** `app-shell.test.tsx` (con y sin `right`).
- [x] **T-02 · Tarjeta de tokens** · S · RC-02, RC-06
  - `SeasonTokensTeaser` y sus mensajes en en, es y pt.
  - **Tests:** `season-tokens-teaser.test.tsx`.
- [x] **T-03 · Pie** · S · RC-03, RC-06
  - `SiteFooter` con `ComingSoon` y el copyright.
  - **Tests:** `site-footer.test.tsx`.
- [x] **T-04 · Layout, e2e y cierre** · S · RC-01, RC-04, RC-05, RC-07
  - `app/[locale]/layout.tsx` pasa la columna. H-08 de `specs/home` apunta a este spec.
  - **Tests:** `e2e/right-column.spec.ts`, axe y presupuesto de JS. Revisión con `ui-reviewer`.

## Criterios → tests

| Criterio | Test                                                      |
| -------- | --------------------------------------------------------- |
| RC-01    | `app-shell.test.tsx`, `e2e/right-column.spec.ts` (sticky) |
| RC-02    | `season-tokens-teaser.test.tsx`                           |
| RC-03    | `site-footer.test.tsx`, e2e ("Coming soon")               |
| RC-04    | `app-shell.test.tsx`, axe en e2e                          |
| RC-05    | e2e (no se ve a 360 px)                                   |
| RC-06    | Test de claves de `messages/`                             |
| RC-07    | `e2e/performance.spec.ts`                                 |

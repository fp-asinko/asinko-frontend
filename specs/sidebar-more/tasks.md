# "more" de la columna izquierda — Tasks

Rama: `feature/sidebar-more-expand`, desde `develop`.

- [x] **T-01 (M)** `MoreToggle` y su test; `SidebarSection` lo usa; las tres listas leen `data-more`; textos. → SM-01 a SM-04
- [x] **T-02 (S)** e2e (aparece solo con algo escondido, despliega y repliega, teclado, panel del teléfono), axe en claro y oscuro, presupuesto; merge a `develop`. → SM-01 a SM-05

| Criterio     | Test                                                                           |
| ------------ | ------------------------------------------------------------------------------ |
| SM-01        | `more-toggle.test.tsx`, e2e `sidebar-more.spec.ts` (alto bajo y alto de sobra) |
| SM-02, SM-04 | e2e                                                                            |
| SM-03        | `more-toggle.test.tsx`, e2e (teclado)                                          |
| SM-05        | e2e (axe, 360 px), `performance.spec.ts`                                       |

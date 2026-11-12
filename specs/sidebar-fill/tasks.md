# La columna izquierda llena su alto — Tasks

- [x] **T-01 (S)** El orden nuevo y 8 sugerencias con sesión. Tests. → SF-01
- [x] **T-02 (M)** La columna como contenedor de tamaño; Sugeridos llena el resto; los escalones por alto en cada lista. Tests. → SF-02 a SF-06
- [x] **T-03 (S)** E2E con tres altos, axe, presupuesto de JS; `ui-reviewer`; commit. → SF-04 a SF-06
- [ ] **T-04 (S)** Mínimos de 3 grupos, 3 personas y 3 activos (PO, 2026-11-12): escalones nuevos en `globals.css` y en las listas, esqueleto con 3 personas, tests y e2e. → SF-03

Orden: T-01 → T-03 → T-04.

## Mapa de criterios a tests

| Criterio     | Test                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| SF-01        | `interests-sections.test.tsx`                                                                                             |
| SF-02, SF-03 | `group-list.test.tsx`, `people-list.test.tsx`, `asset-list.test.tsx`, `e2e/sidebar-fill.spec.ts`, `interests-api.test.ts` |
| SF-04        | `e2e/sidebar-fill.spec.ts` (420 px)                                                                                       |
| SF-05        | `e2e/sidebar-fill.spec.ts` (cambia el alto sin recargar)                                                                  |
| SF-06        | e2e (axe; lo escondido fuera del orden del teclado)                                                                       |

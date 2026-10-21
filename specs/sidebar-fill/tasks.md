# La columna izquierda llena su alto — Tasks

- [ ] **T-01 (S)** El orden nuevo y 8 sugerencias con sesión. Tests. → SF-01
- [ ] **T-02 (M)** La columna como contenedor de tamaño; Sugeridos llena el resto; los escalones por alto en cada lista. Tests. → SF-02 a SF-06
- [ ] **T-03 (S)** E2E con tres altos, axe, presupuesto de JS; `ui-reviewer`; commit. → SF-04 a SF-06

Orden: T-01 → T-03.

## Mapa de criterios a tests

| Criterio     | Test                                                                |
| ------------ | ------------------------------------------------------------------- |
| SF-01        | `interests-sections.test.tsx`                                       |
| SF-02, SF-03 | `e2e/sidebar-fill.spec.ts` (1100 y 620 px), `interests-api.test.ts` |
| SF-04        | `e2e/sidebar-fill.spec.ts` (420 px)                                 |
| SF-05        | `e2e/sidebar-fill.spec.ts` (cambia el alto sin recargar)            |
| SF-06        | e2e (axe; lo escondido fuera del orden del teclado)                 |

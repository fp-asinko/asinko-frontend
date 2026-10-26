# Resultados de encuesta en pie 3D — Tasks

Rama: `feature/poll-pie`, desde `develop`. Se subió a `develop` el 2026-10-26 (PO: "pushea todo a develop").

- [x] **T-01 (M)** `poll-pie.ts`: la geometría (porciones, caras, lados) y los tonos por puesto, como funciones puras, con sus tests. → PP-01, PP-02
- [x] **T-02 (M)** `PollPie` (SVG, resaltar, entrada) y `PollVoting` con el pie, la leyenda y sin barras. `animate-pie-in`. Tests. → PP-03 a PP-06
- [x] **T-03 (S)** `design-system.md`. e2e: el pie con resultados, ninguno sin ellos, 360 px, axe en claro y oscuro, presupuesto. Ajustar los e2e de las barras. → PP-03, PP-06, PP-07

| Criterio     | Test                                                       |
| ------------ | ---------------------------------------------------------- |
| PP-01, PP-02 | `poll-pie.test.ts`                                         |
| PP-03, PP-04 | `poll-voting.test.tsx`, e2e `poll-pie.spec.ts`             |
| PP-05        | `poll-pie.test.tsx` (la clase), e2e con reducir movimiento |
| PP-06, PP-07 | e2e (axe, 360 px), `performance.spec.ts`                   |

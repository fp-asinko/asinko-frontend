# Identidad de la tesis — Tasks

> Rama: `feature/thesis-identity-ticket`. Cada tarea lleva sus tests (`testing.md`).

- [x] **T-01 (S)** Propuestas P-044 (precio de hoy en `thesis.asset`) y P-045 (`creator.resolvedCount`) en `docs/references/api/proposals.md`. → TI-20
- [x] **T-02 (S)** Contrato: los campos opcionales en `thesisSchema` y tests del esquema (con y sin ellos). → TI-06, TI-20
- [x] **T-03 (M)** `thesisProgress` en `src/lib/theses/progress.ts` con tests: va hacia el objetivo, lo pasó, en contra, `below`, `equals`, sin entrada, sin precio, cerrada con precio de resolución, cancelada. → TI-02 a TI-07
- [x] **T-04 (S)** Mapper: `current` en `toThesisTicket`; regla de las 3 resueltas en `toThesisItem`; tests. → TI-06, TI-09
- [x] **T-05 (M)** Mocks: `extendWithIdentity` encadenado en el feed y `GET /theses/:id`; fixtures con los cuatro casos; `handlers.test.ts` y `README.md`. → TI-20
- [x] **T-06 (M)** `ThesisProgress` con su test (textos de cada caso, la pista `aria-hidden`, nada con `equals`) y montaje en el ticket. → TI-01 a TI-07, TI-16
- [x] **T-07 (M)** Troquel: utilidades `ticket-stub-top/bottom` en `globals.css`, el ticket en dos talones; test de los dos talones y la línea punteada. → TI-12, TI-13
- [x] **T-08 (S)** `ThesisStamp` con su test (cada estado, `aria-hidden`, sin sello abierta) y montaje en el talón de abajo. → TI-14, TI-15
- [x] **T-09 (S)** `CardByline` con `accuracyWords` en la tarjeta de tesis; test. → TI-08, TI-10, TI-11
- [x] **T-10 (S)** Textos en en, es y pt; `client-messages` no cambia (todo es de servidor). → TI-19
- [x] **T-11 (M)** e2e en `thesis-detail.spec.ts`: la barra y el sello en el feed y en la página, a 360 px y desktop, axe en claro y oscuro; `performance.spec.ts` sin cambios de peso. `ui-reviewer`. → TI-16, TI-17, TI-18

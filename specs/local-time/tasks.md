# Fechas en la zona de quien mira — Tasks

Rama: `feature/local-time`, desde `develop`. Requirements y design aprobados por el PO el 2026-11-02.

- [ ] **T-01 (S)** `lib/time-zone.ts` y la zona en `i18n/request.ts`. Tests. → LT-02
- [ ] **T-02 (S)** `TimeZoneSync` en el layout. Tests. → LT-01, LT-03
- [ ] **T-03 (S)** `LocalTime` con la zona configurada; se va `utcWhen`. Tests. → LT-04
- [ ] **T-04 (S)** E2E en otra zona y el presupuesto de JS. → LT-04, LT-06
- [ ] **T-05 (S)** Con `specs/thesis-create`: la fecha límite se ve el día elegido. → LT-05

| Criterio | Test                                                     |
| -------- | -------------------------------------------------------- |
| LT-01    | `time-zone-sync.test.tsx`, `e2e/local-time.spec.ts`      |
| LT-02    | `time-zone.test.ts`                                      |
| LT-03    | `time-zone-sync.test.tsx`                                |
| LT-04    | `local-time.test.tsx`, `e2e/local-time.spec.ts`          |
| LT-05    | `e2e/thesis-create.spec.ts` (en `feature/thesis-create`) |
| LT-06    | `performance.spec.ts`                                    |

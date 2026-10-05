# Navegación del feed sin esperas a ciegas — Tasks

> **Estado:** aprobado el 2026-10-05.

- [x] **T-01 · P-009 al backend** · S · FN-07
- [ ] **T-02 · Streaming de la lista** · M · FN-01, FN-02, FN-03, FN-05
  - `FeedTop`, `FeedList`, `FeedListSkeleton` y la página con el `Suspense` atado a los filtros. El 404 de comunidad se resuelve antes del streaming.
  - **Tests:** unitarios, y e2e con demora.
- [ ] **T-03 · Caché del router** · S · FN-04
  - `staleTimes.dynamic: 30`.
  - **Tests:** e2e de volver a una pestaña sin request nuevo.
- [ ] **T-04 · Cierre** · S · FN-06
  - Presupuesto de JS, axe, la medición en tu `next dev` con datos reales, y `ui-reviewer`.

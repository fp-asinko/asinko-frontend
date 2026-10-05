# Navegación del feed sin esperas a ciegas — Tasks

> **Estado:** aprobado y cerrado el 2026-10-05.
>
> **Cierre:**
>
> - Tests: 545 unitarios y 163 e2e en verde. Los de este spec usan un backend lento simulado (`x-mock-delay`), con axe y el anuncio de carga.
> - JS del Home: 226,2 KB, sin cambios.
> - **Medido con datos reales:** un clic en "Polls" pasó de 6,4 s congelado a **0,19 s** (URL, filtro y esqueleto). La lista llega cuando responde el backend (6,5 s).
> - Revisión con `ui-reviewer` aplicada; los detalles, en `design.md § 6`.

- [x] **T-01 · P-009 al backend** · S · FN-07
- [x] **T-02 · Streaming de la lista** · M · FN-01, FN-02, FN-03, FN-05
  - `FeedTop`, `FeedList`, `FeedListSkeleton` y la página con el `Suspense` atado a los filtros. El 404 de comunidad se resuelve antes del streaming.
  - **Tests:** unitarios, y e2e con demora.
- [x] **T-03 · Caché del router** · S · FN-04
  - `staleTimes.dynamic: 30`.
  - **Tests:** e2e de volver a una pestaña sin request nuevo.
- [x] **T-04 · Cierre** · S · FN-06
  - Presupuesto de JS, axe, la medición en tu `next dev` con datos reales, y `ui-reviewer`.

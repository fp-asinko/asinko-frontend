# API — E12 Track Record y reputación

**Spec:** `product/specs/E12-track-record-y-reputacion.md` · **Schema:** campos cacheados en `Profile` (`plan/schema-v1.prisma`)

No hay `POST`/`PATCH` en este archivo.

---

## Track record de un usuario

Los campos ya viven en el recurso `Profile` (`accuracyRate`, `currentStreak`, `correctCount`, `incorrectCount`, `cancelledCount` — ver `E01-identidad-y-cuenta.md`).

### `GET /api/v1/users/{userId}/theses`
**Público** (sujeto a `isPublic` del perfil, mismo criterio que el resto de E01).

**Query params:** `state?` (filtra por `ThesisState` — ej. solo `CORRECT,INCORRECT` para el historial resuelto, o `OPEN` para lo que tiene en curso)
**Respuesta:** lista estándar de `Thesis` (forma completa en `E11-contenido-finanzas.md`).
**Errores:** `404`.

### `internalRating` — no expuesto
No tiene endpoint, ni siquiera de solo lectura para el propio usuario.

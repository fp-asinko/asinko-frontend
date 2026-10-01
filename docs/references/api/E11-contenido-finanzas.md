# API — E11 Thesis

**Spec:** `product/specs/E11-contenido-finanzas.md` · **Schema:** `Content`, `Thesis`, `ThesisUpdate`, `ThesisResolutionVote` (`plan/schema-v1.prisma`)

---

## Recurso `Thesis`

```
{
  "id": "uuid",
  "communityId": "uuid",
  "asset": { "id", "symbol", "name" } | null,
  "claim": "string",
  "reasoning": "string",
  "conviction": "LOW | MEDIUM | HIGH | EXTREME",
  "deadline": "ISO 8601",
  "referencePrice": "number | null",
  "referencePriceAt": "ISO 8601 | null",
  "targetPrice": "number",
  "targetDirection": "ABOVE | BELOW | EQUALS",
  "state": "OPEN | EXPIRED | CORRECT | INCORRECT | DISPUTED | CANCELLED",
  "resolvedAt": "ISO 8601 | null",
  "resolutionPrice": "number | null",
  "resolutionSource": "AUTOMATIC | COMMUNITY | ADMIN | null",
  "cancelledAt": "ISO 8601 | null",
  "cancellationReason": "string | null",
  "disclaimerAcceptedAt": "ISO 8601",
  "creator": { "id", "username", "avatarUrl", "accuracyRate" } | null,
  "creatorType": "USER | SYSTEM",
  "score": "number",
  "viewerVote": "1 | -1 | null",
  "argumentCounts": { "pro": "number", "contra": "number" },
  "canCancel": "boolean",
  "publishedAt": "ISO 8601",
  "createdAt": "ISO 8601"
}
```

### `POST /api/v1/theses` — Crear thesis
**Auth:** requerida.
**Usuario:** sin ownership, `userId` explícito — `userId` (body) debe coincidir con la sesión.

**Request body:**
- `userId` (uuid, requerido)
- `communityId` (uuid, requerido)
- `assetSymbol` (string, requerido)
- `claim` (string, ≤280, requerido)
- `reasoning` (string, requerido)
- `conviction` (`LOW|MEDIUM|HIGH|EXTREME`, requerido)
- `deadline` (ISO 8601, requerido — entre 24h y 5 años desde ahora)
- `targetPrice` (number, requerido)
- `targetDirection` (`ABOVE|BELOW|EQUALS`, requerido)
- `disclaimerAccepted` (boolean, requerido, debe ser `true`)

**Respuesta `201`:** la `Thesis` creada.
**Errores:** `403 USER_MISMATCH` · `422 DEADLINE_OUT_OF_RANGE` · `422 CLAIM_TOO_LONG` · `422 DISCLAIMER_NOT_ACCEPTED` · `404 ASSET_NOT_FOUND` · `429 RATE_LIMITED`

### `GET /api/v1/theses/{id}` — Detalle
**Público.**

**Respuesta `200`:** la `Thesis` (forma completa, § Recurso `Thesis`).
**Errores:** `404`

### `PUT /api/v1/theses/{id}/cancel` — Cancelar
**Auth:** requerida.
**Usuario:** debe ser igual a `Content.creatorId` **y** `userId` (body) debe coincidir con la sesión.

**Request body:** `{ "userId": "uuid", "reason": "string" }`
**Respuesta `200`:** la `Thesis` (forma completa, § Recurso `Thesis`), con `state: "CANCELLED"`, `cancelledAt`/`cancellationReason` seteados.
**Errores:** `403 USER_MISMATCH` · `409 THESIS_NOT_CANCELLABLE` — si `state != OPEN`, o dentro del 10% final de la ventana publicación→deadline.

---

## Actualizaciones del creador

### `GET /api/v1/theses/{id}/updates` — Lista de actualizaciones
**Público.**

**Respuesta `200`:** lista (no paginada) de `{ "id", "body", "createdAt", "author": { "id", "username", "avatarUrl" } }`.

### `POST /api/v1/theses/{id}/updates` — Publicar actualización
**Auth:** requerida.
**Usuario:** debe ser igual a `Content.creatorId` **y** `userId` (body) debe coincidir con la sesión.

**Request body:** `{ "userId": "uuid", "body": "string" }`
**Respuesta `201`:** `{ "id", "body", "createdAt", "author": { "id", "username", "avatarUrl" } }`
**Errores:** `403 USER_MISMATCH` · `409 THESIS_NOT_OPEN` — si `state != OPEN`.

---

## Voto de resolución comunitaria

### `PUT /api/v1/theses/{id}/resolution-vote`
**Auth:** requerida.
**Usuario:** sin ownership, `userId` explícito — `userId` (body) debe coincidir con la sesión.

**Request body:** `{ "userId": "uuid", "choice": "YES" | "NO" | "DISPUTED" }`
**Respuesta `200`:** `{ "choice": "YES" | "NO" | "DISPUTED" }`
**Errores:** `403 USER_MISMATCH` · `409 THESIS_NOT_PENDING_RESOLUTION` — si `state != EXPIRED` o la thesis es cualitativa.

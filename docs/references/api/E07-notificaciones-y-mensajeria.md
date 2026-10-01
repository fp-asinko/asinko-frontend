# API — E07 Notificaciones

**Spec:** `product/specs/E07-notificaciones-y-mensajeria.md` · **Schema:** `Notification` (`plan/schema-v1.prisma`)

---

## Recurso `Notification`

```
{
  "id": "uuid",
  "type": "THESIS_UPDATE | THESIS_RESOLVED | PRICE_ALERT_TRIGGERED | MENTION | COMMENT_REPLY",
  "payload": { },      // forma distinta por type, ver tabla abajo
  "readAt": "ISO 8601 | null",
  "createdAt": "ISO 8601"
}
```

Forma de `payload` por `type`:

| `type` | `payload` |
|---|---|
| `THESIS_UPDATE` | `{ "thesisId", "authorUsername" }` |
| `THESIS_RESOLVED` | `{ "thesisId", "state": "CORRECT"\|"INCORRECT"\|"DISPUTED"\|"CANCELLED" }` |
| `PRICE_ALERT_TRIGGERED` | `{ "priceAlertId", "assetSymbol", "triggeredPrice" }` |
| `MENTION` | `{ "contentType": "post"\|"thesis"\|"comment", "contentId", "byUsername" }` |
| `COMMENT_REPLY` | `{ "commentId", "parentContentType", "parentContentId", "byUsername" }` |

### `GET /api/v1/notifications`
**Auth:** requerida.
**Usuario:** sin comparación — implícitamente filtra por el propio usuario, no hay parámetro de usuario en esta ruta.
Paginado por cursor, más reciente primero.

**Query params:** `unreadOnly?` (boolean)

### `GET /api/v1/notifications/unread-count`
**Auth:** requerida.
**Usuario:** sin comparación — mismo criterio que el listado.

**Respuesta `200`:** `{ "count": "number" }`

### `PUT /api/v1/notifications/{id}/read`
**Auth:** requerida.
**Usuario:** debe ser igual a `Notification.profileId` (el destinatario) **y** `userId` (body) debe coincidir con la sesión.
Idempotente.

**Request body:** `{ "userId": "uuid" }`
**Respuesta `200`:** `Notification` (forma completa, § Recurso `Notification`), con `readAt` seteado.
**Errores:** `403 USER_MISMATCH`

### `PUT /api/v1/notifications/read-all`
**Auth:** requerida.
**Usuario:** sin ownership, `userId` explícito — `userId` (body) debe coincidir con la sesión.
Marca todas como leídas.

**Request body:** `{ "userId": "uuid" }`
**Respuesta `200`:** `{ "updatedCount": "number" }`
**Errores:** `403 USER_MISMATCH`

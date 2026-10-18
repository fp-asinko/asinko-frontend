# API — E01 Identidad y cuenta

**Spec:** `product/specs/E01-identidad-y-cuenta.md` · **Schema:** `Profile`, `UserBlock`, `SlugHistory` (`plan/schema-v1.prisma`)

---

## Recurso `User`

```
{
  "id": "uuid",
  "username": "string",         // mutable
  "usernameChangedAt": "ISO 8601 | null", // último cambio; null = nunca cambiado
  "avatarUrl": "string | null", // imagen original
  "bio": "string | null",
  "email": "string",              // solo si el viewer es el propio usuario
  "countryCode": "string | null", // ISO 3166-1 alpha-2
  "countrySource": "IP | MANUAL | null",
  "language": "string | null",    // ISO 639-1
  "isPublic": "boolean",
  "status": "ACTIVE | INACTIVE | BANNED | DELETED",
  "createdAt": "ISO 8601"
}
```

## Recurso `Profile`

`Profile` extiende `User` con lo que se muestra en la página de perfil — no repetimos los campos de `User` acá, se asume que la respuesta los incluye todos más estos:

```
User & {
  "points": "number",
  "badgeStatus": "NONE | IDENTITY_VERIFIED | INSTITUTIONAL",
  "accuracyRate": "number | null",     // null hasta la primera thesis resuelta
  "currentStreak": "number",
  "correctCount": "number",
  "incorrectCount": "number",
  "cancelledCount": "number",
  "isFollowedByViewer": "boolean | null", // null si no hay sesión
  "followerCount": "number",
  "followingCount": "number"
}
```

---

## Crear cuenta

### `POST /api/v1/users` — Crear usuario tras registro
**Auth:** requerida (usuario recién creado en `auth.users`, sin fila de producto todavía).
**Usuario:** sin comparación — el usuario de la sesión es quien se convierte en el `User` creado.

**Request body:**
- `username` (string, 3-30 caracteres, único) — requerido
- `ageConfirmed` (boolean, debe ser `true`) — requerido
- `termsAccepted` (boolean, debe ser `true`) — requerido
- `countryCode?`, `language?`, `avatarUrl?`, `bio?`, `isPublic?` — opcionales
- cualquier otro campo *client-safe* de `User`/`Profile` no listado arriba — también aceptado, opcional

**Respuesta `201`:** el `User` creado (no el `Profile` extendido).
**Errores:** `409 USERNAME_TAKEN` · `422` si `ageConfirmed`/`termsAccepted` no son `true`.

---

## Leer y editar

### `GET /api/v1/profiles/{identifier}`
**Público**, con más campos (`email`) si el viewer es el dueño del perfil. `{identifier}` acepta un `userId` (uuid) o un `username` indistintamente. Resuelve también `username` viejos dentro de la ventana de reserva de 1 año (`SlugHistory`); la respuesta trae siempre el `username` **actual**.

**Errores:** `404` — si `isPublic: false` y el viewer no es el dueño, o si `{identifier}` no resuelve a ningún usuario.

### `PATCH /api/v1/users/{userId}`
**Auth:** requerida.
**Usuario:** debe ser igual a `{userId}` — comparado contra la sesión.

**Request body — todos opcionales:**
- `bio?` (string, ≤160 caracteres)
- `avatarUrl?` (string)
- `isPublic?` (boolean)
- `language?` (string, ISO 639-1)
- `countryCode?` (string, ISO 3166-1 alpha-2 — setea `countrySource: MANUAL`)
- `username?` (string, 3-30 caracteres, único — ver política de cambio abajo)

**Política de cambio de `username`:** el valor viejo queda reservado 1 año; un segundo cambio exige 2 años desde el anterior (`usernameChangedAt`).

**Respuesta `200`:** el `User` actualizado (no la forma extendida `Profile`).
**Errores:** `409 USERNAME_TAKEN` (incluye un `username` reservado por otro usuario dentro de su ventana de 1 año) · `429 USERNAME_CHANGE_TOO_SOON` con `retryAfter` (ISO 8601) si todavía no pasaron los 2 años del cambio anterior — ambos solo si se mandó `username`.

### `DELETE /api/v1/users/{userId}`
**Auth:** requerida.
**Usuario:** debe ser igual a `{userId}` — mismo chequeo.

Soft-delete — no borra la fila; pasa a `status: DELETED`, `username`/`avatarUrl`/`bio` se scrubbean.
**Respuesta:** `204 No Content` — sin body.
**Errores:** `403`.

---

## Actividad del perfil (P-012, implementado el 2026-10-13)

### `GET /api/v1/users/{userId}/content`
**Público.** Lo que publicó la persona, en cualquier comunidad, del más nuevo al más viejo. Lista estándar (`{ items: FeedItem[], nextCursor }`), con el mismo `FeedItem`, cursor y filtro `?kind=POST,POLL,THESIS` que el feed (E04). Sin borrados ni programados.

**Errores:** `404` — perfil privado para quien no es su dueño, o usuario inexistente.

### `GET /api/v1/users/{userId}/comments`
**Público.** Sus comentarios, del más nuevo al más viejo (`{ items, nextCursor }`). Cada uno es un `Comment` sin hilo, más dónde está:

```jsonc
"content": { "kind": "POST | POLL | THESIS", "id": "uuid", "title": "string", "community": { /* CommunitySummary */ } }
```

`title` es el título del post, la pregunta de la encuesta o el claim de la tesis. Sin comentarios borrados ni en contenido borrado o programado.

**Errores:** `404` — perfil privado para quien no es su dueño, o usuario inexistente.

## Follow

### `PUT /api/v1/users/{userId}/follow/{targetUserId}` · `DELETE /api/v1/users/{userId}/follow/{targetUserId}`
**Auth:** requerida.
**Usuario:** debe ser igual a `{userId}` — comparado contra la sesión.

Idempotente.

**Respuesta `200`** (`PUT`):

| Campo | Tipo |
|---|---|
| `isFollowedByViewer` | `true` |
| `followerCount` | number |

`DELETE` → `204 No Content`.
**Errores:** `403` · `422 CANNOT_FOLLOW_SELF` — si `{userId}` === `{targetUserId}`.

### `GET /api/v1/users/{userId}/followers` · `GET /api/v1/users/{userId}/following`
**Público** (sujeto a `isPublic` del perfil consultado).

- **`followers`** = miembros de la `PERSONAL_CHANNEL` de `{userId}`.
- **`following`** = otras `PERSONAL_CHANNEL` de las que `{userId}` es miembro (excluye la propia).

Lista paginada por cursor, forma resumida de `User`: `id`, `username`, `avatarUrl`, `accuracyRate`.

---

## Bloqueo

### `PUT /api/v1/users/{userId}/block/{targetUserId}` · `DELETE /api/v1/users/{userId}/block/{targetUserId}`
**Auth:** requerida.
**Usuario:** debe ser igual a `{userId}` — comparado contra la sesión. `{targetUserId}` es a quién se bloquea/desbloquea.

Idempotente.

**Respuesta `200`** (`PUT`): `{ "blocked": true }`. `DELETE` → `204 No Content`.
**Errores:** `403`.

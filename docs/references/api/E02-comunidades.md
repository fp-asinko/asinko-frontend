# API — E02 Comunidades

**Spec:** `product/specs/E02-comunidades.md` · **Schema:** `Community`, `CommunityMembership`, `SlugHistory` (`plan/schema-v1.prisma`)

---

## Recurso `Community`

```
{
  "id": "uuid",
  "slug": "string",              // mutable
  "slugChangedAt": "ISO 8601 | null", // último cambio de slug; null = nunca cambiado
  "name": "string",
  "description": "string | null",
  "avatarUrl": "string | null",
  "bannerUrl": "string | null",
  "type": "SYSTEM_ASSET | SYSTEM_GEO | SYSTEM_CATEGORY | USER_PUBLIC | PERSONAL_CHANNEL",
  "assetId": "uuid | null",      // solo SYSTEM_ASSET
  "mainUrl": "string | null",    // link externo opcional (sitio del proyecto/activo)
  "rules": "string | null",
  "memberCount": "number",
  "createdByProfileId": "uuid | null", // null = comunidad del sistema
  "createdAt": "ISO 8601",
  "viewerMembership": "MEMBER | MODERATOR | PRINCIPAL_MODERATOR | null" // null si no hay sesión o no es miembro
}
```

### `GET /api/v1/communities` — Listado
**Público.** Paginado por cursor. Query params: `type` (filtra por `CommunityType`), `search` (matchea `name`/`slug`).

### `GET /api/v1/communities/{slug}`
**Público.** Resuelve también `slug` viejos dentro de la ventana de reserva de 1 año (`SlugHistory`); la respuesta trae el `slug` **actual**.

**Errores:** `404`.

### `POST /api/v1/communities` — Crear comunidad de usuario
**Auth:** requerida.
**Usuario:** sin ownership, `userId` explícito — `userId` (body) debe coincidir con la sesión.

Solo produce `type: USER_PUBLIC`.

**Request body:** `userId` (uuid, quien crea — debe coincidir con la sesión), `slug`, `name`, `description?`, `avatarUrl?`, `bannerUrl?`, `mainUrl?`, `rules?`
**Errores:** `403 USER_MISMATCH` · `409 SLUG_TAKEN` (incluye un `slug` reservado por otra comunidad dentro de su ventana de 1 año) · `422` si `slug` no matchea el formato permitido (minúsculas, guiones, sin espacios)

### `PATCH /api/v1/communities/{slug}`
**Auth:** requerida.
**Usuario:** debe tener rol `MODERATOR` o `PRINCIPAL_MODERATOR` en la `CommunityMembership` de esa comunidad, **y** `userId` (body) debe coincidir con la sesión. Excepción: cambiar `slug` exige `PRINCIPAL_MODERATOR`.

**Request body:** `userId` (uuid, requerido) + campos editables. Edita `name`, `description`, `avatarUrl`, `bannerUrl`, `mainUrl`, `rules`. No permite cambiar `type`.

**`slug?` — mutable, con restricciones por tipo:**
- `USER_PUBLIC`: editable acá, requiere rol `PRINCIPAL_MODERATOR`. El valor viejo se reserva 1 año en `SlugHistory`, segundo cambio exige 2 años desde el anterior (`slugChangedAt`).
- `PERSONAL_CHANNEL`: no editable acá — cambia vía `PATCH /users/{userId}` (E01). Un `slug?` en el body de un `PATCH` sobre una `PERSONAL_CHANNEL` es ignorado.
- `SYSTEM_ASSET` / `SYSTEM_GEO` / `SYSTEM_CATEGORY`: no editable — `422` si se intenta.

**Errores (además de los de arriba):** `403 USER_MISMATCH` · `409 SLUG_TAKEN` · `429 SLUG_CHANGE_TOO_SOON` con `retryAfter` — estos dos últimos solo si se mandó `slug`.

---

## Membresía

### `PUT /api/v1/communities/{slug}/members/{targetUserId}` — Unirse / agregar miembro (= seguir, si `{slug}` es una `PERSONAL_CHANNEL`)
**Auth:** requerida.
**Usuario:** `userId` (body) === `{targetUserId}` (se une a sí mismo) **o** quien llama tiene rol `MODERATOR`/`PRINCIPAL_MODERATOR` en esa comunidad (agrega a un tercero); en cualquier caso `userId` debe coincidir con la sesión. Excepción `PERSONAL_CHANNEL`: solo `userId` === `{targetUserId}`.
`{targetUserId}` es el miembro que se agrega (no necesariamente quien llama); `userId` identifica a quien llama y se compara contra la sesión.

Idempotente.

**Request body:** `{ "userId": "uuid" }` — requerido.
**Errores:** `403 USER_MISMATCH`.

### `DELETE /api/v1/communities/{slug}/members/{targetUserId}` — Dejar / quitar miembro (= dejar de seguir / sacarse un seguidor, si `{slug}` es una `PERSONAL_CHANNEL`)
**Auth:** requerida.
**Usuario:** `userId` (query) === `{targetUserId}` (deja su propia membresía) **o** quien llama tiene rol `MODERATOR`/`PRINCIPAL_MODERATOR` en esa comunidad (remueve a un tercero); en cualquier caso `userId` debe coincidir con la sesión.
`{targetUserId}` es el miembro que se remueve, no necesariamente quien llama.

Restricciones de estado, no de identidad:
- `403 CANNOT_LEAVE_AS_PRINCIPAL_MODERATOR` — quien llama es el único `PRINCIPAL_MODERATOR` y se está removiendo a sí mismo (tiene que transferir el rol primero). Aplica solo a self-removal. Sobre una `PERSONAL_CHANNEL` este error es permanente — el dueño nunca puede dejar su propia `PERSONAL_CHANNEL`.
- `403 CANNOT_REMOVE_MODERATOR` — un `MODERATOR` (no `PRINCIPAL_MODERATOR`) intenta remover a un tercero que tiene rol `MODERATOR` o `PRINCIPAL_MODERATOR`.
- `403 USER_MISMATCH` — el `userId` del query param no coincide con la sesión.

Idempotente.

### `GET /api/v1/communities/{slug}/members`
**Público.** Lista paginada, forma resumida de `Profile` + `role`.

### `PATCH /api/v1/communities/{slug}/members/{targetUserId}` — Cambiar rol
**Auth:** requerida.
**Usuario:** debe tener rol `PRINCIPAL_MODERATOR` en la `CommunityMembership` de esa comunidad, **y** `userId` (body) debe coincidir con la sesión. No disponible en `PERSONAL_CHANNEL`: `422` siempre.

**Request body:** `{ "userId": "uuid", "role": "MEMBER | MODERATOR | PRINCIPAL_MODERATOR" }` — `userId` identifica a quien hace el cambio, distinto de `{targetUserId}` en la URL (el miembro objetivo cuyo rol cambia).
**Respuesta `200`:** `{ "targetUserId": "uuid", "role": "MEMBER | MODERATOR | PRINCIPAL_MODERATOR" }` — `targetUserId` es el miembro objetivo, nunca quien llama.
**Errores:** `403 USER_MISMATCH` · `422` si la comunidad es `PERSONAL_CHANNEL`.

# API — E04 Feed y descubrimiento

**Spec:** `product/specs/E04-feed-y-descubrimiento.md` · **Schema:** sin tablas propias — deriva de `Post`/`Thesis`/`Poll` + `CommunityMembership` (ver nota en `plan/schema-v1.md`)

---

## Recurso `FeedItem`

Union discriminada por `kind`:

```
{
  "kind": "POST" | "THESIS" | "POLL" | "THOUGHT" | "AD",   // THOUGHT: un post de tipo THOUGHT (2026-10-23); AD: propuesta P-031
  "content": Post | Thesis | Poll
}
```

**`reason`** (respuesta del backend del 2026-10-20, adoptada en `specs/explore-v1`): por qué Explore muestra el ítem. Solo en `GET /feed/explore` sin `?community`; en los demás feeds viene `null`.

```
"reason": {
  "type": "FOLLOWING" | "SIMILAR" | "COUNTRY" | "TRENDING",
  "via": { "id", "slug", "name", "type", "avatarUrl" } | null,  // solo SIMILAR: la comunidad seguida que lo trajo
  "countryCode": "AR" | null                                     // solo COUNTRY
} | null
```

### `GET /api/v1/feed/following`
**Auth:** requerida.
**Usuario:** sin comparación — el feed es implícitamente el del propio usuario, no hay parámetro de usuario en esta ruta.

**Query params:** `cursor?` (paginación estándar, ver `README.md`)
**Respuesta `200`:** lista estándar de `FeedItem` más `requestId` (`{ "items": FeedItem[], "nextCursor": "string | null", "requestId": "uuid | null" }`). Si el usuario no sigue ninguna comunidad todavía, responde `200` con `items: []` y `requestId: null`.

### `GET /api/v1/feed/explore`
**Público.** Mismo shape de respuesta que Following. Sin `?community` es el feed rankeado (lo popular de lo que seguís, comunidades parecidas, tu país y lo popular), con `reason` en cada ítem; con `?community`, la pestaña de una comunidad, cronológica.

**Query params:** `cursor?`, `community?` (slug, filtra Explore a una sola comunidad), `kind?` (`POST`, `POLL`, `THESIS`, `THOUGHT`, separados por coma). `kind=POST` no incluye los thoughts: hay que pedir `THOUGHT` (2026-10-23).

### `POST /api/v1/feed/impressions`
**Auth:** opcional. Con sesión, `userId` tiene que ser el de la sesión; sin sesión, `null`.

**Request body:**
```
{
  "userId": "uuid | null",
  "requestId": "uuid",            // el de la página del feed
  "events": [{ "contentId": "uuid", "type": "SEEN" | "OPEN", "dwellMs?": 0..3600000 }]   // 1 a 100
}
```
- `SEEN`: la tarjeta estuvo visible al menos al 50 % durante 1 s o más. `OPEN`: se abrió el detalle.
- Lo que no corresponde a ese `requestId` (o a ese usuario) se ignora sin error.

**Respuesta `204`.**

---

## Búsqueda

### `GET /api/v1/search`
**Público.**

**Query params:** `q` (string, requerido), `type?` (`user | post | thesis | community` — sin filtro, busca en los cuatro)

**Respuesta `200`:**
```
{
  "users": [{ "id", "username", "avatarUrl", "accuracyRate" }],
  "communities": [{ "id", "slug", "name", "avatarUrl", "memberCount" }],
  "content": FeedItem[]   // posts y theses que matchean, mismo shape que el feed
}
```
Cada arreglo trae como máximo ~10 resultados.

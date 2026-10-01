# API — E04 Feed y descubrimiento

**Spec:** `product/specs/E04-feed-y-descubrimiento.md` · **Schema:** sin tablas propias — deriva de `Post`/`Thesis`/`Poll` + `CommunityMembership` (ver nota en `plan/schema-v1.md`)

---

## Recurso `FeedItem`

Union discriminada por `kind`:

```
{
  "kind": "POST" | "THESIS" | "POLL",
  "content": Post | Thesis | Poll
}
```

### `GET /api/v1/feed/following`
**Auth:** requerida.
**Usuario:** sin comparación — el feed es implícitamente el del propio usuario, no hay parámetro de usuario en esta ruta.

**Query params:** `cursor?` (paginación estándar, ver `README.md`)
**Respuesta `200`:** lista estándar de `FeedItem` (`{ "items": FeedItem[], "nextCursor": "string | null" }`). Si el usuario no sigue ninguna comunidad todavía, responde `200` con `items: []`.

### `GET /api/v1/feed/explore`
**Público.** Mismo shape de respuesta que Following.

**Query params:** `cursor?`, `community?` (slug, filtra Explore a una sola comunidad)

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

# Propuestas de cambios al contrato

> Lo que el front necesita y el contrato de la API no tiene. Cada propuesta se mockea en `src/mocks/` con esta forma exacta (ver [`api-integration.md`](../../ai-guidelines/api-integration.md)) y se le pasa al backend para implementarla. Cuando el backend la implementa y el front la adopta, sale de este archivo (queda en el historial de git) y pasa al snapshot del contrato.

**Actualizado el 2026-10-18**, después de adoptar en el front lo que respondió el backend el 2026-10-13 ([`responses/2026-10-13-backend.md`](responses/2026-10-13-backend.md)). **No se verificó todavía contra el deploy** (`pnpm api:smoke`): lo adoptado se probó con los mocks, que siguen la forma de esa respuesta.

## Adoptado por el front (sale de este archivo)

| Propuesta                     | Qué hizo el front                                                                                                  | Spec                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| P-001 menciones               | Se muestran desde `entities` en posts y comentarios. El feed de lo que menciona algo no se hace (`overview.md`).   | `backend-answer-1013`   |
| P-003 precios                 | La página del activo muestra el precio y la variación, "desactualizado" con su fecha, o "Sin datos de mercado".    | `backend-adoption`      |
| P-011 nombre visible          | El perfil se titula con él y se edita en "Editar perfil".                                                         | `profile-presentation`  |
| P-012 contenido y comentarios | La pestaña Posts usa `GET /users/{id}/content`; la pestaña nueva Respuestas, `GET /users/{id}/comments`.           | `backend-adoption`      |
| P-013 imágenes                | Subida por URL firmada (`POST /uploads/post-image`) e `imageAlt`.                                                  | `backend-answer-1013`   |
| P-014 orden y búsqueda        | Orden por `sort` y búsqueda por `?q=` contra el backend (el mock de `?q=` se apagó con `API_MOCKS=missing`).       | `backend-adoption`      |
| P-015 anuncios                | Sin intercalado propio; el feed ignora los `kind` que no conoce, para cuando lleguen.                             | `backend-answer-1013`   |
| P-016 post principal          | La columna "Tus intereses" muestra `topPost`.                                                                      | `backend-adoption`      |
| Catálogo                      | Rutas y menciones con `.` y `/` (`BRK.B`, `XAU/USD`); un activo sin comunidad tiene su página.                     | `backend-answer-1013`   |

## Pendientes, en orden de prioridad para el front

1. **P-019 a P-021: el perfil, como LinkedIn.** Titular, ciudad, links, banner y la subida de foto y banner. El front ya lo tiene hecho contra mocks: sin esto, nada de eso se guarda con el backend real.
2. **Comunidades de los activos del catálogo.** Solo 5 de los 100 tienen la suya (BTC, ETH, AAPL, NVDA, VOO). `GET /communities/TSLA` (y SPY, MSFT, EURUSD, SQM-B, BRK.B, XAU/USD…) da `404`, y `GET /assets/{symbol}` trae `linkedCommunity: null`. **Pedido:** crear la comunidad de cada activo (slug = símbolo). Mientras tanto, el front muestra la página del activo con su precio, sin feed ni Unirse, y no se puede publicar ni etiquetar en ellos.
3. **P-024 a P-027: el perfil como vidriera**, como LinkedIn (`specs/profile-showcase`): "Acerca de" de 2000, destacados, "Abierto a" y dónde publica cada persona (`specs/profile-aside`). Hechos contra mocks.
4. **P-022 y P-023: borradores en la cuenta y marcas por comunidad**, como Reddit (`specs/drafts-tags`). Hechos contra mocks.
5. **P-018: comunidades y activos relacionados de un post.** Hoy viajan como menciones al final del cuerpo.
6. **P-017: "lo seguís" en las listas de seguidores, seguidos y miembros.** Sin respuesta desde el 2026-10-09.
7. **P-005: `sort=hot|top` del feed.** Fórmulas en definición.
8. **`best` de los comentarios (P-014).** Hoy es cronológico; el mock usa la fórmula propuesta (abajo). El front ya manda `sort=best`.
9. **`GET /assets` sin `?q=` devuelve 20, sin `nextCursor`.** No bloquea (el front busca con `?q=`), pero hace falta para listar el catálogo.
10. **Imágenes huérfanas.** Una imagen subida con la URL firmada y nunca publicada queda en Storage, y no hay cómo borrarla. ¿Se limpian del lado del backend? Aplica también a la foto y el banner (P-021).

### P-019: Titular, ciudad y links del perfil

**Estado:** propuesta (2026-10-16), mockeada (`PATCH /users` con estos campos va al mock; el resto, al backend).

**Endpoint:** `PATCH /api/v1/users/{userId}`, el `User` y el `Profile` (`GET /profiles/{identifier}`).

**Motivo:** el perfil, como LinkedIn (`specs/profile-presentation`): un titular bajo el nombre ("Analista macro | Renta fija | LatAm"), la ciudad junto al país (`countryCode` ya existe) y hasta 5 links externos (Substack, X, YouTube…) con su ícono.

**Cambio:** tres campos opcionales en el `User` y el `Profile`, editables como `bio`:

```json
{ "headline": "Analista macro | Renta fija", "city": "La Plata", "links": ["https://example.substack.com"] }
```

- `headline`: hasta 100 caracteres; `""` o `null` lo borran. `422 HEADLINE_TOO_LONG`.
- `city`: hasta 60, texto libre; `""` o `null` la borran. `422 CITY_TOO_LONG`.
- `links`: hasta 5 URLs `http(s)`, en el orden del usuario; `[]` los borra. `422 INVALID_LINK` (otro esquema o mal formada), `422 TOO_MANY_LINKS`.

### P-020: Banner del perfil

**Estado:** propuesta (2026-10-16), mockeada.

**Endpoint:** `PATCH /api/v1/users/{userId}` y el `Profile`.

**Motivo:** hoy el banner del perfil es el de su canal personal (`Community.bannerUrl`), que el usuario no puede editar desde su perfil. `specs/profile-presentation` deja subir el banner como la foto.

**Cambio:** `"bannerUrl": string | null` en el `Profile`, editable con `PATCH /users/{userId}` como `avatarUrl`. Si conviene que sea el mismo dato que el banner del canal personal, mejor: el front lo lee de los dos lados.

### P-021: Subida de foto y banner del perfil

**Estado:** propuesta (2026-10-16), mockeada.

**Endpoint:** `POST /api/v1/uploads/avatar` y `POST /api/v1/uploads/profile-banner`.

**Motivo:** `PATCH /users` acepta `avatarUrl`, pero no hay dónde subir la imagen. El front ya recorta y prepara la imagen (WebP, foto de 400×400 y banner de 1500×375).

**Cambio:** el mismo flujo de URL firmada que `POST /uploads/post-image` (P-013): `{ userId, contentType, size }` → `{ uploadUrl, imageUrl, path }`, JPEG, PNG, WebP o GIF (nunca SVG), hasta 5 MB. El `imageUrl` es el que se manda en `PATCH /users` (`avatarUrl` o `bannerUrl`).

### P-024: "Acerca de" de 2000 caracteres

**Estado:** propuesta (2026-10-19), mockeada (un `PATCH /users` con una `bio` de más de 160 va al mock).

**Endpoint:** `PATCH /api/v1/users/{userId}`, el `User` y el `Profile`.

**Motivo:** "Acerca de", como LinkedIn (`specs/profile-showcase`): contar tu estrategia en más de una línea. La bio pasa a ser ese texto (no se suma otro campo: el titular ya es la frase corta).

**Cambio:** `bio` acepta hasta **2000** caracteres (hoy 160), con saltos de línea. `422 BIO_TOO_LONG` más allá.

### P-025: Destacados del perfil

**Estado:** propuesta (2026-10-19), mockeada.

**Endpoints:** `GET /api/v1/users/{userId}/featured` (público), `POST /api/v1/users/{userId}/featured` y `DELETE /api/v1/users/{userId}/featured/{kind}/{id}?userId=` (solo el dueño, `403 USER_MISMATCH`).

**Motivo:** "Destacado", como LinkedIn (`specs/profile-showcase`): hasta 3 posts o tesis propios al frente del perfil. Se destacan desde el menú "⋯" de cada uno.

**Cambio:**

```jsonc
// GET /users/{userId}/featured → a lo sumo 3, del último destacado al primero; lo borrado no viene
{
  "items": [
    { "kind": "thesis", "thesis": { /* Thesis (E11) */ }, "featuredAt": "ISO 8601" },
    { "kind": "post", "post": { /* Post */ }, "featuredAt": "ISO 8601" }
  ]
}
```

- `POST /users/{userId}/featured` `{ userId, kind: "post" | "thesis", id }` → `201 { items }`; si ya estaba, `200 { items }`. Con 3, `409 FEATURED_LIMIT`. Contenido de otra persona, `403 NOT_OWNER`; inexistente o borrado, `404`.
- `DELETE /users/{userId}/featured/{kind}/{id}?userId=` → `204`, también si no estaba.
- Más adelante, reordenarlos (`PUT` con la lista); no hace falta para el MVP.

### P-026: "Abierto a"

**Estado:** propuesta (2026-10-19), mockeada (un `PATCH /users` con `openTo` va al mock).

**Endpoint:** `PATCH /api/v1/users/{userId}`, el `User` y el `Profile`.

**Motivo:** "Tengo interés en…", como LinkedIn (`specs/profile-showcase`): para qué está disponible la persona. Valores fijos, para traducirlos y, más adelante, filtrar por ellos.

**Cambio:** `"openTo": string[]` con valores de `QUESTIONS`, `COLLABORATIONS`, `MENTORING`, `AMAS`, `COMMISSIONED_ANALYSIS`, sin repetir; `[]` lo borra. `422 INVALID_OPEN_TO` con otro valor o repetido.

### P-027: Dónde publica una persona

**Estado:** propuesta (2026-10-19), mockeada.

**Endpoint:** `GET /api/v1/users/{userId}/active-communities?days=90&limit=20` (público).

**Motivo:** "Participa en", como la tarjeta del perfil de Reddit (`specs/profile-aside`): las comunidades y activos donde la persona más publicó últimamente, para saber de qué habla. Armarlo en el front con los posts sería compensar con lógica algo que el backend resuelve con una consulta.

**Cambio:**

```jsonc
{ "items": [{ "community": { /* CommunitySummary */ }, "postCount": 12 }] }
```

- De más posts a menos; a igual cantidad, el último publicado primero. Solo posts y encuestas no borrados publicados en los últimos `days` días.
- `days` de 1 a 365 (por defecto 90); `limit` de 1 a 20 (por defecto 5). Fuera de rango, `422 VALIDATION_ERROR`. Usuario inexistente, `404`.

### P-022: Borradores en la cuenta

**Estado:** propuesta (2026-10-19), mockeada.

**Endpoints:** `GET /api/v1/users/{userId}/drafts`, `POST /api/v1/drafts`, `PATCH /api/v1/drafts/{draftId}` y `DELETE /api/v1/drafts/{draftId}?userId=`. Todos con sesión: el `userId` (cuerpo o query) se compara con ella, `403 USER_MISMATCH`.

**Motivo:** "Guardar borrador" y "Borradores" de la página de crear post, como Reddit (`specs/drafts-tags`): guardar un post a medias y terminarlo después, desde cualquier dispositivo. El borrador automático que el front guarda en el navegador sigue como red de seguridad, pero no viaja entre dispositivos.

**Cambio:**

```jsonc
// Draft
{
  "id": "uuid",
  "type": "TEXT | LINK | IMAGE",
  "title": "string",     // "" si no hay
  "body": "string",
  "url": "string",
  "imageUrl": "string | null",
  "imageAlt": "string",
  "tag": "string | null",
  "community": { /* CommunitySummary */ } | null,
  "updatedAt": "ISO 8601"
}
```

- `GET /users/{userId}/drafts` → `{ items: Draft[], nextCursor: null }`, a lo sumo 20, del más reciente (`updatedAt`) al más viejo.
- `POST /drafts` `{ userId, communityId?, type, title?, body?, url?, imageUrl?, imageAlt?, tag? }` → `201 Draft`. Con 20 guardados, `409 DRAFT_LIMIT`. Un borrador no exige título ni cuerpo.
- `PATCH /drafts/{draftId}` con los mismos campos → `200 Draft` (lo pasa primero en la lista). `404` si no existe o no es del usuario.
- `DELETE /drafts/{draftId}?userId=` → `204`.
- Publicar un borrador es `POST /posts` y después `DELETE /drafts/{id}`, que hace el servidor del front. Si el backend prefiere `POST /posts` con `draftId` y borrarlo él, mejor: es un cambio de una línea en el front.

### P-023: Marcas por comunidad

**Estado:** propuesta (2026-10-19), mockeada.

**Endpoint:** el recurso `Community` (`GET /communities`, `GET /communities/{slug}`) y `POST /posts`.

**Motivo:** "Añadir marca" al crear un post, como el flair de Reddit (`specs/drafts-tags`): cada comunidad tiene sus marcas ("Análisis", "Noticia", "Pregunta"…) y el post lleva una, opcional, que se ve junto al título. El `Post` ya tiene `tag` y `POST /posts` lo acepta, pero no hay de dónde sacar las marcas de cada comunidad.

**Cambio:**

- `"tags": string[]` en el `Community`: hasta 20, de 1 a 24 caracteres; `[]` si no tiene. Las definen sus moderadores (más adelante, con `PATCH /communities`); mientras tanto, del seed.
- `POST /posts` con un `tag` que no está en las de su comunidad: `422 INVALID_TAG`.

### P-018: Comunidades y activos relacionados de un post

**Estado:** propuesta (2026-10-16). Sin mock: mientras tanto el front los manda como menciones.

**Endpoint:** `POST /api/v1/posts` (y el recurso `Post`).

**Motivo:** al crear un post (`specs/related-tags`), además de la comunidad donde se publica se pueden sumar hasta 3 comunidades o activos relacionados, como un post en `#argentina` sobre `$GGAL` y `#macro`. Hoy el front los agrega al final del cuerpo como menciones (`\n\n$GGAL #macro`): se ven como links y notifican, pero ensucian el cuerpo y el post no aparece en esos feeds (decisión del 2026-10-13).

**Cambio:** un campo opcional `relatedCommunityIds: string[]` (hasta 3, distintos de `communityId`, sin canales personales; `422` si no se cumple) en el body de `POST /posts`, y `related: [{ id, slug, type, name }]` en el `Post`. Que el post aparezca también en el feed de cada relacionada (`GET /feed/explore?community=`). Si se acepta, el front deja de escribir la línea de menciones y muestra los relacionados en la tarjeta.

### P-017: Si seguís a cada persona de una lista

**Estado:** propuesta (2026-10-09), mockeada; **sin respuesta** en la del 2026-10-13. La usan las listas de seguidores y seguidos del perfil (`specs/follow-lists`) y, desde el 2026-10-10, la de miembros de una comunidad (`specs/community-members`).

**Endpoints:** `GET /api/v1/users/{userId}/followers`, `GET /api/v1/users/{userId}/following` y `GET /api/v1/communities/{slug}/members`.

**Motivo:** cada fila de las listas lleva "Seguir" o "Siguiendo", como Instagram y X. Hoy los ítems traen solo `id`, `username`, `avatarUrl` y `accuracyRate`: el front no sabe si el viewer ya sigue a cada persona, y sin ese dato no muestra el botón.

**Cambio:** sumar a cada ítem `"isFollowedByViewer": boolean | null`, igual que en el `Profile`: `null` sin sesión o en la fila del propio viewer. El front ya lo lee como opcional: mientras no llegue, las listas se ven sin botones.

### P-005: Orden del feed

**Estado:** pendiente (backend, 2026-10-13: fórmulas en definición; hoy los feeds son `new`). El filtro por tipo (`?kind=POST,POLL`) ya está y está en el contrato. **Falta:** `sort=hot|new|top`, para los filtros _Hot_ y _Top_ del prototipo. ¿Cuándo?

### `best` de los comentarios (P-014)

**Estado:** el backend acepta `sort=best` y por ahora responde cronológico; la fórmula está en definición.

**Propuesta del front** (decisión del PO, 2026-10-08), la de Hacker News: `score / (horas desde createdAt + 2) ^ 1,5`, de mayor a menor; un comentario nuevo y votado sube, y uno viejo baja de a poco. El mock la usa. Reddit usa el intervalo de Wilson sobre votos a favor y en contra por separado, y el contrato solo tiene `score`. Si el backend prefiere otra (o guardar votos a favor y en contra para usar Wilson), el front no cambia: solo manda `sort=best`.

## Por verificar con datos reales

Lo adoptado se probó contra mocks con la forma de la respuesta del 2026-10-13. Falta correr `pnpm api:smoke` y revisar a mano, contra el deploy de `dev`:

- Que las menciones lleguen como `entities` en posts **y comentarios** y se vean como links.
- `GET /users/{id}/content` y `GET /users/{id}/comments` (la forma de `content.community` en un comentario).
- La subida de imágenes por URL firmada (el bucket `post-images` existe desde el 2026-10-13).
- Los precios y `priceStale` en la página de un activo.

## Formato de una propuesta

```
### P-NNN: Título corto
**Estado:** propuesta | acordada | implementada
**Endpoint:** MÉTODO /api/v1/...
**Motivo:** qué vista o flujo del front lo necesita.
**Cambio:** forma exacta (campos nuevos, request, response, errores).
```

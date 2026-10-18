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
3. **P-018: comunidades y activos relacionados de un post.** Hoy viajan como menciones al final del cuerpo.
4. **P-017: "lo seguís" en las listas de seguidores, seguidos y miembros.** Sin respuesta desde el 2026-10-09.
5. **P-005: `sort=hot|top` del feed.** Fórmulas en definición.
6. **`best` de los comentarios (P-014).** Hoy es cronológico; el mock usa la fórmula propuesta (abajo). El front ya manda `sort=best`.
7. **`GET /assets` sin `?q=` devuelve 20, sin `nextCursor`.** No bloquea (el front busca con `?q=`), pero hace falta para listar el catálogo.
8. **Imágenes huérfanas.** Una imagen subida con la URL firmada y nunca publicada queda en Storage, y no hay cómo borrarla. ¿Se limpian del lado del backend? Aplica también a la foto y el banner (P-021).

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

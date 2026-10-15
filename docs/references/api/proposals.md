# Propuestas de cambios al contrato

> Lo que el front necesita y el contrato de la API no tiene. Cada propuesta se mockea en `src/mocks/` con esta forma exacta (ver [`api-integration.md`](../../ai-guidelines/api-integration.md)) y se le pasa al backend para implementarla. Cuando el backend la implementa, sale de este archivo (queda en el historial de git) y pasa al snapshot del contrato.

**Revisado el 2026-10-08** contra el deploy de `asinko-app` en Vercel (`https://asinko-app-web.vercel.app`) y el código de la rama `dev` (sigue en `bd91e4b`, sin cambios desde el 2026-10-07), con `pnpm api:smoke` (sin diferencias con el contrato) y llamadas directas. Ninguna propuesta pendiente está implementada todavía; las que sí lo estaban (P-002, P-004, P-007, P-008 y P-010) ya salieron de este archivo.

## Respuesta del backend (2026-10-13)

Respondida en [`responses/2026-10-13-backend.md`](responses/2026-10-13-backend.md) (copia del documento del backend). Lo implementado está en `dev` y en el deploy de Vercel; el contrato al día, en `financeshowoff-design-docs/api/` (`openapi.yaml`, `CHANGELOG.md`). **Todavía no se verificó contra el deploy** (`pnpm api:smoke`), ni se actualizó el snapshot de `docs/references/api/`: cada propuesta sale de este archivo cuando el front la adopta.

| Propuesta                       | Backend                                                                   | Qué cambia en el front                                                                         |
| ------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| P-012 contenido de un usuario   | Implementado: `GET /users/{userId}/content`                               | La pestaña Posts del perfil pasa a ese endpoint (hoy usa el canal personal)                    |
| P-012 comentarios de un usuario | Implementado: `GET /users/{userId}/comments`                              | Pestaña nueva "Respuestas" en el perfil (spec nueva)                                           |
| P-001 menciones                 | Implementado, en posts **y comentarios**                                  | Verificar el render con datos reales; los comentarios también las traen                        |
| P-001 feed de menciones         | No se hace                                                                | `overview.md` actualizado (2026-10-14)                                                         |
| P-011 nombre visible            | Implementado, opcional                                                    | Apagar el mock; editarlo en "Editar perfil"                                                    |
| Catálogo                        | Acciones, ETFs, índices, commodities y monedas                            | **Adoptado (2026-10-14, `specs/backend-answer-1013`)**: rutas y menciones con `.` y `/`; un activo sin comunidad tiene su página |
| P-014 orden y búsqueda          | Implementado; `best` es cronológico por ahora                             | Apagar el mock de `?q=`                                                                        |
| P-005 `hot` y `top` del feed    | Pendiente                                                                 | Nada todavía                                                                                   |
| P-016 post principal            | Implementado                                                              | Apagar el mock                                                                                 |
| P-013 imágenes                  | **URL firmada** (`POST /uploads/post-image`), no subida directa; `imageAlt` | **Adoptado (2026-10-14, `specs/backend-answer-1013`)**: subida por URL firmada e `imageAlt` |
| P-015 anuncios                  | **Vendrán dentro del feed; no habrá `GET /ads`**                          | **Adoptado (2026-10-14, `specs/backend-answer-1013`)**: sin intercalado; el feed ignora los `kind` desconocidos |
| P-003 precios                   | Twelve Data; 61 de 100 activos con precio viejo                           | Mostrar el precio, "desactualizado" y la fecha; "Sin datos de mercado" si es `null`            |
| P-017 "lo seguís" en listas     | **Sin respuesta**                                                         | Sigue mockeado                                                                                 |

## Pedidos nuevos (2026-10-14)

Encontrados al verificar contra el deploy (solo lecturas) mientras el front adoptaba la respuesta (`specs/backend-answer-1013`):

- **Comunidades de los activos nuevos.** De los 100 activos, solo los del seed anterior (BTC, ETH, AAPL, NVDA, VOO) tienen su comunidad `SYSTEM_ASSET`: `GET /communities/TSLA` (y SPY, MSFT, EURUSD, SQM-B, BRK.B, XAU/USD…) da `404`, y `GET /assets/{symbol}` trae `linkedCommunity: null`. El documento de entregables define la página de activo como esa comunidad. **Pedido:** crear la comunidad de cada activo del catálogo (slug = símbolo). Mientras tanto, el front muestra la página del activo sin feed ni Unirse.
- **`GET /assets` sin `?q=` devuelve 20, sin `nextCursor`:** el catálogo no se puede recorrer entero. No bloquea al front (busca con `?q=`), pero hace falta para un listado de activos.
- **Imágenes huérfanas:** una imagen subida con la URL firmada y nunca publicada queda en Storage, y el backend no ofrece borrarla. ¿Se limpian del lado del backend?

## Pendientes

En orden de prioridad para el front: P-012, P-001, P-014, P-016, P-013, P-011, P-015, P-003 y P-005.

### P-012: Todo lo que publica un usuario

**Estado:** implementada (backend, 2026-10-13): `GET /users/{userId}/content`, más `GET /users/{userId}/comments` para la pestaña de respuestas. Falta adoptarla en el front.

**Endpoint:** nuevo, por ejemplo `GET /api/v1/users/{userId}/content?kind=POST,POLL&cursor=`, o un filtro `?creator={userId}` en `GET /feed/explore`.

**Motivo:** el perfil (`/user/{username}`, `specs/community-pages`) muestra lo que publica la persona, como el prototipo (pestañas All, Theses, Posts y Replies). Hoy solo existe el feed de su canal personal (`/feed/explore?community={username}`), y en la base de dev ese feed está vacío para todos: el seed publica en grupos. El overview del producto también lo pide así: seguir a un usuario suma "todo lo que publica". Las tesis ya tienen el suyo (`GET /users/{userId}/theses`).

**Cambio:** una lista estándar (`{ "items": FeedItem[], "nextCursor": string | null }`) con el contenido que creó el usuario, en cualquier comunidad, del más nuevo al más viejo, con el mismo `FeedItem` y el mismo filtro `kind` que el feed. Respeta `isPublic` del perfil, igual que el resto de E01.

### P-001: Menciones detectadas al publicar y resueltas al leer

**Estado:** implementada en posts y comentarios (backend, 2026-10-13); el feed de lo que menciona algo **no se hace**. Antes: la detección se postergó en el backend (E3-06, 21/09): `POST /posts` devuelve `entities: []`, y `GET /posts/{id}` y el feed no traen `entities`. **Ampliada el 2026-10-08:** el front ya autocompleta `$`, `#` y `@` al escribir posts y comentarios (`specs/mention-autocomplete`); sin la detección, esas menciones se publican como texto.

**Endpoint:**

- Al escribir: `POST /posts`, `PATCH /posts/{id}` y `POST /posts/{id}/comments` detectan las menciones del cuerpo (`$TICKER` del catálogo, `#slug` de comunidad, `@username`) y guardan las que resuelven.
- Al leer: `GET /posts/{id}`, `GET /feed/following`, `GET /feed/explore` y los comentarios las devuelven.

**Motivo:** las menciones `$ # @` son links a las páginas de activo, grupo y perfil (`specs/community-pages`). Sin `entities`, se ven como texto plano. El front no reparsea el texto para adivinar a qué apunta cada mención.

**Cambio:** el recurso `Post` incluye siempre el mismo campo que ya devuelve `POST /posts`:

```json
"entities": [{ "type": "TICKER | MENTION | COMMUNITY", "raw": "$BTC", "resolvedId": "…", "position": [5, 9] }]
```

**Ampliada el 2026-10-08: el feed de lo que menciona algo.** La página de un activo, de una comunidad o de un perfil muestra hoy solo lo publicado **dentro** de esa comunidad (`GET /feed/explore?community=BTC`). El producto pide que muestre **todo el contenido que lo menciona** (`docs/product/overview.md § Menciones` y `§ Seguir`: seguir `$BTC` suma "todo el contenido que menciona el activo"). Caso real del 2026-10-08: un post de `@qa_uno` en su canal personal que dice `$BTC` no aparece en `/asset/BTC`.

- **Endpoint:** un filtro en el feed, por ejemplo `GET /feed/explore?mentions=BTC` (el `slug` de la comunidad del activo, de la comunidad o el canal de la persona), con el mismo `FeedItem`, cursor y `kind` que hoy. Responde lo publicado en esa comunidad **más** lo que la menciona en cualquier otra, sin repetidos, del más nuevo al más viejo.
- **Alternativa:** que `?community=` ya sume las menciones, si el backend prefiere no agregar un parámetro (el front no cambia nada).
- **Depende de** la detección de arriba: sin `entities` guardadas no hay a qué filtrar.
- **El feed "Siguiendo"** (`GET /feed/following`) también tendría que sumar lo que menciona a los activos y personas que sigue el usuario (`overview.md § Seguir`).

### P-013: Subida de imágenes de posts

**Estado:** implementada con **URL firmada** (backend, 2026-10-13): `POST /uploads/post-image`, después el `PUT` del navegador, después `POST /posts` con el `imageUrl` limpio (sin EXIF) que devuelve la respuesta; `imageAlt` opcional. Reemplaza la decisión del 01/10/2026 (subida directa al bucket con la sesión del usuario), que es lo que hoy hace `specs/post-image`.

**Cómo lo hace el front:** la sesión del front es un Bearer en una cookie `HttpOnly` del servidor, así que sube **el servidor de la app** con el token del usuario (`PUT /storage/v1/object/post-images/{userId}/{uuid}.webp`): la política "subir en la carpeta propia" aplica igual y el token no llega al navegador. Antes, el navegador achica la imagen a 2048 px en WebP, lo que borra los metadatos EXIF.

**Preguntas al backend:**

- **Falta crear el bucket `post-images` en el Supabase de `dev`** (verificado el 2026-10-09: Storage responde `404 Bucket not found`). Público, 5 MB, JPEG/PNG/WebP y las dos políticas de `INFRA-PENDIENTES.md § Storage`. Sin él, publicar con imagen contra el backend real falla en la subida; con `API_MOCKS=true` funciona.
- **Texto alternativo (para una próxima versión):** un campo `imageAlt` (string, ≤ 1000, opcional) en `POST /posts` y en el `Post`, para que la persona describa la imagen a quien usa lector de pantalla, como X. Hoy el front usa "Imagen del post".
- El front borra la imagen si la persona la quita o descarta el post (política "borrar lo propio"); las que queden huérfanas por otros motivos (cerrar la pestaña) quedarían para una limpieza del backend.

### P-011: Nombre visible en el perfil

**Estado:** implementada, opcional (backend, 2026-10-13); se edita con `PATCH /users/{userId}`. **Tier y rating quedan para después del MVP** (respuesta del backend, 2026-10-07): el front no los muestra.

**Endpoint:** `GET /profiles/{identifier}`.

**Motivo:** el perfil del prototipo se titula con el nombre de la persona ("Federico Piva") y pone `@usuario` debajo. Hoy el perfil solo tiene `username`, así que el título es `@usuario`.

**Cambio:** `"displayName": "Federico Piva"`, texto libre o `null`. ¿Entra en el MVP?

### P-003: Precios de los activos

**Estado (2026-10-13):** proveedor Twelve Data; 61 de los 100 activos tienen precio de una corrida manual (viejo hasta el plan pago); los de Santiago, índices y commodities, sin precio. Mostrar el precio siempre, marcado si `priceStale`, con `priceUpdatedAt`; `null` da "Sin datos de mercado todavía". **Antes:** el endpoint está (`GET /assets`, `GET /assets/{symbol}`, con logo y sentimiento). **Novedad (2026-10-08):** los 10 activos ya traen `price` y `priceChangePct` reales, todos con `priceUpdatedAt` de 2026-10-08 17:15 UTC, pero llegan con `priceStale: true` y en `dev` no hay un proveedor que los actualice: parecen cargados a mano, una vez.

**Efecto:** la columna de activos sigue con precios de prueba, y la página de activo muestra "Sin datos de mercado todavía": el front no muestra un precio marcado como viejo. **Pregunta:** ¿de dónde salen esos precios y cada cuánto se van a actualizar? Con un proveedor que los mantenga frescos (`priceStale: false`), el front los muestra.

### P-005: Orden del feed

**Estado:** pendiente (backend, 2026-10-13: fórmulas en definición; hoy los feeds son `new`). El filtro por tipo (`?kind=POST,POLL`) ya está y está en el contrato. **Falta:** `sort=hot|new|top`, para los filtros _Hot_ y _Top_ del prototipo. ¿Cuándo?

### P-014: Ordenar y buscar comentarios

**Estado:** implementada salvo `best`, que por ahora es cronológico (backend, 2026-10-13). El mock de `?q=` se apaga cuando el front la adopte.

**Endpoint:** `GET /api/v1/{posts|polls}/{id}/comments`, dos parámetros nuevos:

- `?sort=best|top|new|old` (por defecto `best`): ordena el primer nivel y las respuestas de cada comentario. `top`: por `score`, de mayor a menor. `new` y `old`: por `createdAt`.
- `?q=texto` (2 a 100 caracteres, sin distinguir mayúsculas ni acentos): los comentarios que contienen el texto, de cualquier nivel, en una lista plana (`replies: []`, con `parentCommentId`), del que más coincide al que menos. Sin borrados.

**Motivo:** el detalle de un post ordena los comentarios (Mejores, Top, Nuevos, Antiguos) y los busca, como Reddit. El front no ordena ni filtra el árbol: en un post con miles de comentarios tiene que hacerlo la base.

**Para revisar (decisión del PO, 2026-10-08): cómo se calcula `best`.** Reddit usa el intervalo de Wilson sobre votos a favor y en contra por separado, y el contrato solo tiene `score`. Propuesta, la de Hacker News: `score / (horas desde createdAt + 2) ^ 1,5`, de mayor a menor; un comentario nuevo y votado sube, y uno viejo baja de a poco. El mock usa esta fórmula. Si el backend prefiere otra (o guardar votos a favor y en contra para usar Wilson), el front no cambia: solo manda `sort=best`.

### P-015: Anuncios de la casa

**Estado:** decidida distinto (backend, 2026-10-13): los anuncios **vendrán dentro de la lista del feed**, cuando exista su algoritmo; no habrá `GET /ads` y el front no decide dónde va cada uno. Por ahora no hay anuncios. El intercalado que hace el front (`specs/post-detail-refresh` PD-07 a PD-16) hay que sacarlo, y el feed tiene que ignorar los `kind` que no conoce.

**Endpoint:** nuevo, `GET /api/v1/ads?placement=comments|feed` (público). `comments`: el anuncio dentro de un post y los de sus comentarios; `feed`: los de los feeds.

**Motivo:** como Reddit, el detalle de un post muestra un anuncio debajo del post y uno cada 10 comentarios, y los feeds uno cada 10 posts (ampliada el 2026-10-08). Por decisión del PO son anuncios propios (de la casa o cargados por Asinko), sin redes de anuncios ni scripts de terceros.

**Cambio:** una lista `{ "items": Ad[] }`, en el orden en que se muestran (el front los rota):

```json
{
  "id": "uuid",
  "advertiser": { "name": "string", "logoUrl": "string | null" },
  "body": "string (texto plano, hasta 280)",
  "url": "https://…",
  "imageUrl": "string | null"
}
```

Las imágenes, en el mismo Storage que los avatares. Medir impresiones y clics queda para después.

### P-017: Si seguís a cada persona de una lista

**Estado:** propuesta (2026-10-09), mockeada; **sin respuesta** en la del 2026-10-13. La usan las listas de seguidores y seguidos del perfil (`specs/follow-lists`). **Ampliada el 2026-10-10** a la lista de miembros de una comunidad (`specs/community-members`).

**Endpoints:** `GET /api/v1/users/{userId}/followers`, `GET /api/v1/users/{userId}/following` y `GET /api/v1/communities/{slug}/members`.

**Motivo:** cada fila de las listas lleva "Seguir" o "Siguiendo", como Instagram y X. Hoy los ítems traen solo `id`, `username`, `avatarUrl` y `accuracyRate`: el front no sabe si el viewer ya sigue a cada persona, y sin ese dato no muestra el botón.

**Cambio:** sumar a cada ítem `"isFollowedByViewer": boolean | null`, igual que en el `Profile`: `null` sin sesión o en la fila del propio viewer. El front ya lo lee como opcional: mientras no llegue, las listas se ven sin botones.

### P-016: El post principal de cada comunidad

**Estado:** implementada (backend, 2026-10-13): `topPost: { id, title } | null` en `GET /communities` y `GET /communities/{slug}`. El mock se apaga cuando el front la adopte.

**Endpoint:** `GET /api/v1/communities` (con y sin `?mine=true`) y `GET /api/v1/communities/{slug}`: el recurso `Community` suma un campo.

**Motivo:** en la columna "Tus intereses", debajo de cada grupo y de cada comunidad sugerida va de qué se está hablando ahí, como en el prototipo: el título de su post principal. Hoy se muestra la descripción, y en el seed casi ninguna comunidad la tiene. Pedirlo con `/feed/explore?community=` por cada comunidad serían varios pedidos de 20 ítems por página para usar uno.

**Cambio:**

```json
"topPost": { "id": "uuid", "title": "0DTE SPY calls into FOMC — degenerate or genius?" } | null
```

El más votado de los últimos 7 días; si no hubo, el más reciente; `null` si la comunidad no tiene posts. Solo posts visibles para quien pide (sin borrados). Mientras no esté, el front muestra la descripción.

## Pedidos operativos

- **Hecho (backend, 2026-10-13): todas las comunidades con avatar, banner, descripción y reglas; los 100 activos con logo; bio en 9 de 10 perfiles, verificado en 2 y nombre visible en 5.** Antes: **Datos de las páginas en el seed:** las páginas de grupo, activo y perfil ya muestran banner, avatar, descripción, reglas y bio, pero el seed casi no los tiene. Revisado el 2026-10-08: de las 20 comunidades de la primera página de `GET /communities`, ninguna tiene avatar, banner ni reglas, y solo una tiene descripción; 6 de los 10 activos tienen logo. Ningún usuario tiene bio ni verificado. **Pedido:** sumar al seed avatar y banner (en Storage, como los avatares de usuario), descripción y reglas para los grupos, logo para todos los activos y bio para los usuarios, así las páginas se pueden probar con datos reales. Si se acepta P-011, también `displayName`.

## Preguntas sobre el contrato

- **Respondida (2026-10-13): entran en el MVP, sin filtrar el catálogo.** Antes: **Acciones y ETFs en el catálogo (2026-10-08):** `GET /assets` ya devuelve AAPL, NVDA, GME y VOO junto a las criptos. El producto dice "por ahora, solo criptomonedas" y deja las acciones para después (`docs/product/overview.md`). El front las sugiere al escribir `$` y les arma página. ¿Entran ya en el MVP o se filtran del catálogo por ahora?
- **Respondida (2026-10-13): OK; cuando se muestren, sumar `THESIS` al `kind`.** Antes: **Tesis en el feed:** el feed ya devuelve `kind: "THESIS"`. El front las muestra en la fase 2 y mientras tanto pide `?kind=POST,POLL`. ¿OK?
- **Respondida (2026-10-13): ya hay acceso a `financeshowoff-design-docs`.** Antes: **Documentos del contrato:** queda pedido el acceso al repo `financeshowoff-design-docs`, para refrescar `docs/references/api/` sin depender de copias.

## Formato de una propuesta

```
### P-NNN: Título corto
**Estado:** propuesta | acordada | implementada
**Endpoint:** MÉTODO /api/v1/...
**Motivo:** qué vista o flujo del front lo necesita.
**Cambio:** forma exacta (campos nuevos, request, response, errores).
```

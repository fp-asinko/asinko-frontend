# Propuestas de cambios al contrato

> Lo que el front necesita y el contrato de la API no tiene. Cada propuesta se mockea en `src/mocks/` con esta forma exacta (ver [`api-integration.md`](../../ai-guidelines/api-integration.md)) y se le pasa al backend para implementarla. Cuando el backend la implementa, sale de este archivo (queda en el historial de git) y pasa al snapshot del contrato.

**Revisado el 2026-10-08** contra el deploy de `asinko-app` en Vercel (`https://asinko-app-web.vercel.app`) y el código de la rama `dev` (sigue en `bd91e4b`, sin cambios desde el 2026-10-07), con `pnpm api:smoke` (sin diferencias con el contrato) y llamadas directas. Ninguna propuesta pendiente está implementada todavía; las que sí lo estaban (P-002, P-004, P-007, P-008 y P-010) ya salieron de este archivo.

## Pendientes

En orden de prioridad para el front: P-012, P-001, P-014, P-013, P-011, P-015, P-003 y P-005.

### P-012: Todo lo que publica un usuario

**Estado:** propuesta (2026-10-07).

**Endpoint:** nuevo, por ejemplo `GET /api/v1/users/{userId}/content?kind=POST,POLL&cursor=`, o un filtro `?creator={userId}` en `GET /feed/explore`.

**Motivo:** el perfil (`/user/{username}`, `specs/community-pages`) muestra lo que publica la persona, como el prototipo (pestañas All, Theses, Posts y Replies). Hoy solo existe el feed de su canal personal (`/feed/explore?community={username}`), y en la base de dev ese feed está vacío para todos: el seed publica en grupos. El overview del producto también lo pide así: seguir a un usuario suma "todo lo que publica". Las tesis ya tienen el suyo (`GET /users/{userId}/theses`).

**Cambio:** una lista estándar (`{ "items": FeedItem[], "nextCursor": string | null }`) con el contenido que creó el usuario, en cualquier comunidad, del más nuevo al más viejo, con el mismo `FeedItem` y el mismo filtro `kind` que el feed. Respeta `isPublic` del perfil, igual que el resto de E01.

### P-001: Menciones detectadas al publicar y resueltas al leer

**Estado:** propuesta. La detección se postergó en el backend (E3-06, 21/09): `POST /posts` devuelve `entities: []`, y `GET /posts/{id}` y el feed no traen `entities`. **Ampliada el 2026-10-08:** el front ya autocompleta `$`, `#` y `@` al escribir posts y comentarios (`specs/mention-autocomplete`); sin la detección, esas menciones se publican como texto.

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

**Estado:** propuesta (2026-10-07). Bloquea los posts de tipo Imagen (`specs/post-create-detail`).

**Endpoint:** `POST /posts` con `type: "IMAGE"` ya existe y exige que `imageUrl` sea un archivo del bucket `post-images` de Supabase Storage. Falta definir **quién sube el archivo**.

**Motivo:** el editor de posts del front ya tiene Texto y Link. Imagen queda como "Próximamente" hasta saber cómo llega el archivo al bucket. El front no llama a la API desde el navegador: todo pasa por su servidor (`api-integration.md`).

**Opciones** (a elegir con el backend):

1. **URL firmada desde el backend (preferida por el front):** un endpoint, por ejemplo `POST /api/v1/uploads/post-image` con `{ userId, contentType, size }`, que valida tipo (JPEG, PNG, WebP o GIF; nunca SVG) y tamaño, y devuelve `{ uploadUrl, imageUrl }` firmada y de un solo uso (`createSignedUploadUrl` de Supabase). El servidor del front la pide en una Server Action, el navegador sube el archivo directo a esa URL y después se publica el post con `imageUrl`. Las reglas quedan en el backend.
2. **Subida directa del navegador a Storage** con la sesión del usuario y una política de RLS en `post-images` (solo su propia carpeta, tipos y tamaño máximo). No suma un endpoint, pero las reglas viven en las políticas de Storage, y hoy la sesión del front es un Bearer del servidor, no una sesión de Supabase en el navegador.

**También:** borrar los metadatos EXIF (pueden incluir la ubicación, `security.md § 6`) y el tamaño máximo aceptado.

### P-011: Nombre visible en el perfil

**Estado:** propuesta (2026-10-07), mockeada. **Tier y rating quedan para después del MVP** (respuesta del backend, 2026-10-07): el front no los muestra.

**Endpoint:** `GET /profiles/{identifier}`.

**Motivo:** el perfil del prototipo se titula con el nombre de la persona ("Federico Piva") y pone `@usuario` debajo. Hoy el perfil solo tiene `username`, así que el título es `@usuario`.

**Cambio:** `"displayName": "Federico Piva"`, texto libre o `null`. ¿Entra en el MVP?

### P-003: Precios de los activos

**Estado:** el endpoint está (`GET /assets`, `GET /assets/{symbol}`, con logo y sentimiento). **Novedad (2026-10-08):** los 10 activos ya traen `price` y `priceChangePct` reales, todos con `priceUpdatedAt` de 2026-10-08 17:15 UTC, pero llegan con `priceStale: true` y en `dev` no hay un proveedor que los actualice: parecen cargados a mano, una vez.

**Efecto:** la columna de activos sigue con precios de prueba, y la página de activo muestra "Sin datos de mercado todavía": el front no muestra un precio marcado como viejo. **Pregunta:** ¿de dónde salen esos precios y cada cuánto se van a actualizar? Con un proveedor que los mantenga frescos (`priceStale: false`), el front los muestra.

### P-005: Orden del feed

**Estado:** el filtro por tipo (`?kind=POST,POLL`) ya está y está en el contrato. **Falta:** `sort=hot|new|top`, para los filtros _Hot_ y _Top_ del prototipo. ¿Cuándo?

### P-014: Ordenar y buscar comentarios

**Estado:** propuesta (2026-10-08), mockeada en el front (`specs/post-detail-refresh`).

**Endpoint:** `GET /api/v1/{posts|polls}/{id}/comments`, dos parámetros nuevos:

- `?sort=best|top|new|old` (por defecto `best`): ordena el primer nivel y las respuestas de cada comentario. `top`: por `score`, de mayor a menor. `new` y `old`: por `createdAt`.
- `?q=texto` (2 a 100 caracteres, sin distinguir mayúsculas ni acentos): los comentarios que contienen el texto, de cualquier nivel, en una lista plana (`replies: []`, con `parentCommentId`), del que más coincide al que menos. Sin borrados.

**Motivo:** el detalle de un post ordena los comentarios (Mejores, Top, Nuevos, Antiguos) y los busca, como Reddit. El front no ordena ni filtra el árbol: en un post con miles de comentarios tiene que hacerlo la base.

**Para revisar (decisión del PO, 2026-10-08): cómo se calcula `best`.** Reddit usa el intervalo de Wilson sobre votos a favor y en contra por separado, y el contrato solo tiene `score`. Propuesta, la de Hacker News: `score / (horas desde createdAt + 2) ^ 1,5`, de mayor a menor; un comentario nuevo y votado sube, y uno viejo baja de a poco. El mock usa esta fórmula. Si el backend prefiere otra (o guardar votos a favor y en contra para usar Wilson), el front no cambia: solo manda `sort=best`.

### P-015: Anuncios de la casa

**Estado:** propuesta (2026-10-08), mockeada en el front (`specs/post-detail-refresh`).

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

## Pedidos operativos

- **Datos de las páginas en el seed:** las páginas de grupo, activo y perfil ya muestran banner, avatar, descripción, reglas y bio, pero el seed casi no los tiene. Revisado el 2026-10-08: de las 20 comunidades de la primera página de `GET /communities`, ninguna tiene avatar, banner ni reglas, y solo una tiene descripción; 6 de los 10 activos tienen logo. Ningún usuario tiene bio ni verificado. **Pedido:** sumar al seed avatar y banner (en Storage, como los avatares de usuario), descripción y reglas para los grupos, logo para todos los activos y bio para los usuarios, así las páginas se pueden probar con datos reales. Si se acepta P-011, también `displayName`.

## Preguntas sobre el contrato

- **Acciones y ETFs en el catálogo (2026-10-08):** `GET /assets` ya devuelve AAPL, NVDA, GME y VOO junto a las criptos. El producto dice "por ahora, solo criptomonedas" y deja las acciones para después (`docs/product/overview.md`). El front las sugiere al escribir `$` y les arma página. ¿Entran ya en el MVP o se filtran del catálogo por ahora?
- **Tesis en el feed:** el feed ya devuelve `kind: "THESIS"`. El front las muestra en la fase 2 y mientras tanto pide `?kind=POST,POLL`. ¿OK?
- **Documentos del contrato:** queda pedido el acceso al repo `financeshowoff-design-docs`, para refrescar `docs/references/api/` sin depender de copias.

## Formato de una propuesta

```
### P-NNN: Título corto
**Estado:** propuesta | acordada | implementada
**Endpoint:** MÉTODO /api/v1/...
**Motivo:** qué vista o flujo del front lo necesita.
**Cambio:** forma exacta (campos nuevos, request, response, errores).
```

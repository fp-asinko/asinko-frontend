# Propuestas de cambios al contrato

> Lo que el front necesita y el contrato de la API no tiene. Cada propuesta se mockea en `src/mocks/` con esta forma exacta (ver [`api-integration.md`](../../ai-guidelines/api-integration.md)) y se le pasa al backend para implementarla. Cuando el backend la implementa, sale de este archivo (queda en el historial de git) y pasa al snapshot del contrato.

**Revisado el 2026-10-07** contra el deploy de `asinko-app` en Vercel (`https://asinko-app-web.vercel.app`, rama `dev` en `bd91e4b`), con `pnpm api:smoke`, llamadas directas y la respuesta del backend del mismo día.

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

**Estado:** el endpoint está (`GET /assets`, `GET /assets/{symbol}`, con logo y sentimiento), pero **sin precios**: `price`, `priceChangePct` y `priceUpdatedAt` llegan en `null` y `priceStale` en `true`. Falta el proveedor de precios, que es una decisión abierta del producto.

**Efecto:** la columna de activos sigue con precios de prueba, y la página de activo muestra "Sin datos de mercado todavía". **Pedido:** avisar cuando haya precios.

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

**Endpoint:** nuevo, `GET /api/v1/ads?placement=comments` (público).

**Motivo:** el detalle de un post muestra un anuncio cada 10 comentarios, como Reddit. Por decisión del PO son anuncios propios (de la casa o cargados por Asinko), sin redes de anuncios ni scripts de terceros.

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

- **Datos de las páginas en el seed:** las páginas de grupo, activo y perfil ya muestran banner, avatar, descripción, reglas y bio, pero el seed casi no los tiene. De los 7 grupos y activos de la primera página, ninguno tiene avatar, banner ni reglas, y solo uno tiene descripción. Ningún usuario tiene bio ni verificado. **Pedido:** sumar al seed avatar y banner (en Storage, como los avatares de usuario), descripción y reglas para los grupos, logo para todos los activos y bio para los usuarios, así las páginas se pueden probar con datos reales. Si se acepta P-011, también `displayName`.


## Preguntas sobre el contrato

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

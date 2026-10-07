# Propuestas de cambios al contrato

> Lo que el front necesita y el contrato de la API no tiene. Cada propuesta se mockea en `src/mocks/` con esta forma exacta (ver [`api-integration.md`](../../ai-guidelines/api-integration.md)) y se le pasa al backend para implementarla. Cuando el backend la implementa, pasa a "Resueltas" y al snapshot del contrato.

**Revisado el 2026-10-07** contra el deploy de `asinko-app` en Vercel (`https://asinko-app-web.vercel.app`, rama `dev` en `bd91e4b`), con `pnpm api:smoke`, llamadas directas y la respuesta del backend del mismo día.

## Pendientes

En orden de prioridad para el front: P-012, P-001, P-011, P-003 y P-005.

### P-011: Nombre visible en el perfil

**Estado:** propuesta (2026-10-07), mockeada. **Tier y rating quedan para después del MVP** (respuesta del backend, 2026-10-07): el front no los muestra.

**Endpoint:** `GET /profiles/{identifier}`.

**Motivo:** el perfil del prototipo se titula con el nombre de la persona ("Federico Piva") y pone `@usuario` debajo. Hoy el perfil solo tiene `username`, así que el título es `@usuario`.

**Cambio:** `"displayName": "Federico Piva"`, texto libre o `null`. ¿Entra en el MVP?

### P-012: Todo lo que publica un usuario

**Estado:** propuesta (2026-10-07).

**Endpoint:** nuevo, por ejemplo `GET /api/v1/users/{userId}/content?kind=POST,POLL&cursor=`, o un filtro `?creator={userId}` en `GET /feed/explore`.

**Motivo:** el perfil (`/user/{username}`, `specs/community-pages`) muestra lo que publica la persona, como el prototipo (pestañas All, Theses, Posts y Replies). Hoy solo existe el feed de su canal personal (`/feed/explore?community={username}`), y en la base de dev ese feed está vacío para todos: el seed publica en grupos. El overview del producto también lo pide así: seguir a un usuario suma "todo lo que publica". Las tesis ya tienen el suyo (`GET /users/{userId}/theses`).

**Cambio:** una lista estándar (`{ "items": FeedItem[], "nextCursor": string | null }`) con el contenido que creó el usuario, en cualquier comunidad, del más nuevo al más viejo, con el mismo `FeedItem` y el mismo filtro `kind` que el feed. Respeta `isPublic` del perfil, igual que el resto de E01.

### P-001: Menciones resueltas en la lectura de posts

**Estado:** propuesta. La detección se postergó en el backend (21/09). Sigue pendiente: `GET /posts/{id}` y el feed no traen `entities`.

**Endpoint:** `GET /posts/{id}`, `GET /feed/following`, `GET /feed/explore` (y los comentarios, si van a tener menciones).

**Motivo:** las menciones `$ # @` son links a las páginas de activo, grupo y perfil (`specs/community-pages`). Sin `entities`, se ven como texto plano. El front no reparsea el texto para adivinar a qué apunta cada mención.

**Cambio:** el recurso `Post` incluye siempre el mismo campo que ya devuelve `POST /posts`:

```json
"entities": [{ "type": "TICKER | MENTION | COMMUNITY", "raw": "$BTC", "resolvedId": "…", "position": [5, 9] }]
```

### P-003: Precios de los activos

**Estado:** el endpoint está (`GET /assets`, `GET /assets/{symbol}`, con logo y sentimiento), pero **sin precios**: `price`, `priceChangePct` y `priceUpdatedAt` llegan en `null` y `priceStale` en `true`. Falta el proveedor de precios, que es una decisión abierta del producto.

**Efecto:** la columna de activos sigue con precios de prueba, y la página de activo muestra "Sin datos de mercado todavía". **Pedido:** avisar cuando haya precios.

### P-005: Orden del feed

**Estado:** el filtro por tipo (`?kind=POST,POLL`) ya está y está en el contrato. **Falta:** `sort=hot|new|top`, para los filtros _Hot_ y _Top_ del prototipo. ¿Cuándo?

## Pedidos operativos

- **Datos de las páginas en el seed:** las páginas de grupo, activo y perfil ya muestran banner, avatar, descripción, reglas y bio, pero el seed casi no los tiene. De los 7 grupos y activos de la primera página, ninguno tiene avatar, banner ni reglas, y solo uno tiene descripción. Ningún usuario tiene bio ni verificado. **Pedido:** sumar al seed avatar y banner (en Storage, como los avatares de usuario), descripción y reglas para los grupos, logo para todos los activos y bio para los usuarios, así las páginas se pueden probar con datos reales. Si se acepta P-011, también `displayName`, `tier` y `rating`.


## Preguntas sobre el contrato

- **Tesis en el feed:** el feed ya devuelve `kind: "THESIS"`. El front las muestra en la fase 2 y mientras tanto pide `?kind=POST,POLL`. ¿OK?
- **Códigos de error para crear post:** el front va a tener mensajes propios para `PERSONAL_CHANNEL_OWNER_ONLY` y `CONTENT_DELETED` (`NOT_COMMUNITY_MEMBER` ya no existe, confirmado el 2026-10-07).
- **Documentos del contrato:** queda pedido el acceso al repo `financeshowoff-design-docs`, para refrescar `docs/references/api/` sin depender de copias.

## Resueltas

| Propuesta | Qué se pidió | Cuándo |
| --- | --- | --- |
| P-002 | `Authorization: Bearer` en `/api/v1`, sin refrescar la sesión en la API | `3c5676c`, 2026-10-02 |
| P-004 | La comunidad resumida (`id`, `slug`, `name`, `type`) en cada contenido | `3cfff41`, 2026-10-02 |
| P-006 | `commentCount` en `Poll` | `3cfff41` |
| P-007 | Primeros comentarios sin el árbol (`?limit=&replies=false`) | `3cfff41` |
| P-008 | `body: ""` en contenido borrado, sin textos en español | `3cfff41` |
| P-009 | Feed y listados con los conteos en lote, y backend en la región de la base (Vercel) | `2784c74`, 2026-10-06 |
| P-010 | `avatarUrl` y `viewerMembership` en la comunidad de cada contenido | `e3fc57b`, 2026-10-07 |
| Cuentas de prueba y seed | El seed conserva las cuentas reales de Auth (`qa_uno`…) | `33e81b3`, 2026-10-07 |
| Contrato | `kind` en el feed, `email: null`, `totalVotes` numérico; `NOT_COMMUNITY_MEMBER` ya no existe | Confirmado 2026-10-07 |
| Migraciones de dev | Las 6 pendientes (2026-10-03) y `asset_logo` (2026-10-06) | Aplicadas |
| Explore con comunidad inexistente | Respondía `200` vacío. El front ya consulta `GET /communities/{slug}` antes (páginas de comunidad y filtro del Home), así que no hace falta cambiarlo | Cerrada |
| Imágenes de Storage | Bucket público de Supabase Storage | El front permite ese host (`next.config.ts`) |
| CORS | El front llama a `/api/v1` solo desde su servidor: no hace falta sumarlo a `API_ALLOWED_ORIGINS` | Cerrada |

## Formato de una propuesta

```
### P-NNN: Título corto
**Estado:** propuesta | acordada | implementada
**Endpoint:** MÉTODO /api/v1/...
**Motivo:** qué vista o flujo del front lo necesita.
**Cambio:** forma exacta (campos nuevos, request, response, errores).
```

# Propuestas de cambios al contrato

> Lo que el front necesita y el contrato de la API no tiene. Cada propuesta se mockea en `src/mocks/` con esta forma exacta (ver [`api-integration.md`](../../ai-guidelines/api-integration.md)) y se le pasa al backend para implementarla.
> Cuando el backend la implementa, se mueve al snapshot del contrato y se marca como resuelta acá.

**Revisado contra `asinko-app` rama `dev` (`0cdf243`, 2026-10-01)** y sus notas `HANDOFF-frontend.md` y `API-IMPLEMENTATION-NOTES.md`. En `main` solo está E01; en `dev` están 33 de los 43 paths: E01 a E05, búsqueda y tesis. E07 (notificaciones) y E14 (activos) no están. El contrato vigente vive en `financeshowoff-design-docs/api/` (con `openapi.yaml`) y en el artefacto _ASINKO Endpoint Spec_.

## Bloqueo para usar datos reales

Probado el 2026-10-02 con `dev` corriendo en local contra la Supabase de dev: **todas las lecturas públicas responden `500`** (`/communities`, `/communities/{slug}`, `/feed/explore`, `/profiles/{id}`). A la base le faltan **6 migraciones** de `dev` (`HANDOFF-frontend.md` § 3 habla de 3; faltan también las 3 de agosto):

```
20260817161500_remove_min_points_to_join
20260817161600_slug_mutability            → communities.slugChangedAt
20260817161700_personal_channels_replace_follow
20260921115338_poll_results_visibility    → polls.resultsVisibility
20260922152054_vote_thesis
20260922152554_community_favorites
```

Las aplica el backend (el front no corre migraciones). Alternativa del propio handoff: Postgres local con el seed.

## Formato

```
### P-NNN — Título corto
**Estado:** propuesta | acordada | implementada
**Endpoint:** MÉTODO /api/v1/...
**Motivo:** qué vista o flujo del front lo necesita.
**Cambio:** forma exacta (campos nuevos, request, response, errores).
```

## Propuestas

### P-001 — Menciones resueltas en la lectura de posts

**Estado:** propuesta. La detección de menciones se **postergó** en el backend (decisión del 21/09): `POST /posts` devuelve `entities: []` y las lecturas no traen el campo. Pedido: priorizarla, porque las menciones son centrales en el Home.
**Endpoint:** `GET /api/v1/posts/{id}`, `GET /api/v1/feed/following`, `GET /api/v1/feed/explore` (y los comentarios, si van a tener menciones)
**Motivo:** el Home y el Detalle de post renderizan menciones `$ # @` como links. Hoy `entities` solo viene en la respuesta de `POST /posts`; sin eso, el front tendría que reparsear el texto y adivinar a qué entidad apunta cada mención.
**Cambio:** el recurso `Post` incluye siempre el mismo campo que ya devuelve `POST /posts`:

```
"entities": [{ "type": "TICKER" | "MENTION" | "COMMUNITY", "raw": string, "resolvedId": string, "position": [number, number] }]
```

### P-002 — Autenticación con Bearer en `/api/v1`

**Estado:** propuesta. En `dev`, la sesión sigue siendo solo por cookie (`lib/api/session.ts`).
**Endpoint:** todos los de `/api/v1`
**Motivo:** el front corre en otro dominio y reenvía la cookie de Supabase. El `proxy.ts` del backend puede refrescar la sesión con esa cookie y consumir el refresh token, dejando al usuario deslogueado (ver "Riesgo conocido" en `api-integration.md`). Bloquea el login del front.
**Cambio:** aceptar `Authorization: Bearer <access_token>` (validado con `supabase.auth.getUser(token)`) y excluir `/api/v1` del refresh de sesión del `proxy.ts`. Las cookies pueden seguir funcionando para la UI propia del backend.

### P-003 — Catálogo de activos (E14)

**Estado:** propuesta. E14 está **postergado** en el backend (falta proveedor de precios). Pedido: al menos `GET /assets/{symbol}` con precio y variación, o confirmar que la columna de activos sigue con datos de prueba.
**Endpoint:** `GET /api/v1/assets?q=`, `GET /api/v1/assets/{symbol}`
**Motivo:** la columna "Tus intereses" muestra precio y variación de los activos (hoy mockeado) y el autocompletado de `$` necesita el catálogo.
**Cambio:** implementar E14. Para `GET /assets?q=`, confirmar que responde la lista estándar, `{ "items": Asset[], "nextCursor": string | null }`, con el recurso `Asset` de E14. El mock del front ya asume esa forma.

### P-004 — Comunidad resumida en cada contenido

**Estado:** propuesta. La otra mitad (filtrar por membresía) ya está en `dev` como `GET /communities?mine=true`.
**Endpoint:** `Post`, `Poll` y `Thesis` en el feed y en sus `GET /{id}`
**Motivo:** cada tarjeta muestra `$BTC` o `#defi` con link. Hoy el contenido solo trae `communityId`, así que el front pide `GET /communities` aparte y solo resuelve las de la primera página (las demás quedan sin nombre).
**Cambio:** agregar al contenido:

```
"community": { "id": uuid, "slug": string, "name": string, "type": CommunityType }
```

### P-005 — Filtro por tipo en el feed

**Estado:** implementada en `dev` (`?kind=POST,POLL`, 2026-10-01). Falta sumarla al contrato (E04).
**Pendiente:** orden `sort=hot|new|top`, para los filtros _Hot_ y _Top_ del prototipo. ¿Cuándo?

### P-006 — `commentCount` en `Poll`

**Estado:** propuesta
**Endpoint:** recurso `Poll` (feed y `GET /polls/{id}`)
**Motivo:** la tarjeta de encuesta muestra la cantidad de comentarios, igual que la de post (H-28).
**Cambio:** `"commentCount": number`, con el mismo criterio que en `Post` (sin borrados).

### P-007 — Primeros comentarios sin el árbol completo

**Estado:** propuesta (depende de H-28 en `specs/home`)
**Endpoint:** `GET /api/v1/posts/{id}/comments`, `GET /api/v1/polls/{id}/comments`
**Motivo:** la tarjeta del feed muestra los 3 primeros comentarios. Hoy la respuesta trae todo el árbol con las respuestas anidadas.
**Cambio:** `?limit=3&replies=false`: solo los primeros N de primer nivel, sin `replies`. Sin parámetros, igual que hoy.

### P-008 — Sin textos en español en las respuestas

**Estado:** propuesta (baja prioridad)
**Endpoint:** `Post` y `Comment` borrados
**Motivo:** un contenido borrado trae `body: "[contenido eliminado]"`. El front es multi-idioma (inglés por defecto) y muestra su propio texto según `deleted: true`.
**Cambio:** `body: ""` cuando `deleted` es `true`. El front ya no lee el `body` de un borrado, así que no es bloqueante.

## Preguntas sobre el contrato

- **Explore con comunidad inexistente**: `GET /feed/explore?community=nope` responde `200` con `items: []`. El front prefería `404` para mostrar "no existe" en lugar de "no hay posts". ¿Se cambia, o el front consulta `GET /communities/{slug}` aparte?
- **Tesis en el feed**: el feed ya devuelve `kind: "THESIS"`. El front las muestra en la fase 2; mientras tanto pide `?kind=POST,POLL`. ¿OK?
- **`Poll.totalVotes`**: el contrato lo tipa `number | null`; en `dev` siempre es un número, aun con los resultados ocultos. El front acepta las dos cosas; conviene alinear el contrato.
- **Documentos del contrato**: viven en `financeshowoff-design-docs/api/` (ese repo tiene cambios sin commitear según el handoff). Pedido: acceso al repo o el `openapi.yaml` actualizado, para refrescar `docs/references/api/`.
- **Imágenes**: van al bucket público `post-images` de Supabase Storage (`HANDOFF-frontend.md` § 8). El front agrega ese dominio a `remotePatterns` y a `img-src` de la CSP cuando se active.
- **Usuarios del seed**: no son cuentas de Supabase Auth, no se puede entrar con ellos. Para probar Following y votos con login hace falta crear cuentas reales.

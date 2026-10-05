# Propuestas de cambios al contrato

> Lo que el front necesita y el contrato de la API no tiene. Cada propuesta se mockea en `src/mocks/` con esta forma exacta (ver [`api-integration.md`](../../ai-guidelines/api-integration.md)) y se le pasa al backend para implementarla.
> Cuando el backend la implementa, se mueve al snapshot del contrato y se marca como resuelta acá.

**Revisado contra `asinko-app` rama `dev` (`0bb6325`, 2026-10-04)**. Antes, contra `0cdf243` (2026-10-01) y sus notas `HANDOFF-frontend.md` y `API-IMPLEMENTATION-NOTES.md`. En `main` solo está E01; en `dev` están 33 de los 43 paths: E01 a E05, búsqueda y tesis. E07 (notificaciones) y E14 (activos) no están. El contrato vigente vive en `financeshowoff-design-docs/api/` (con `openapi.yaml`) y en el artefacto _ASINKO Endpoint Spec_.

## Bloqueo para usar datos reales — resuelto

Las 6 migraciones que faltaban en la Supabase de dev se aplicaron el 2026-10-03, y desde entonces el Home corre con datos reales (`API_MOCKS=missing`). El rol de solo lectura `juan_readonly` alcanza para todo lo que se lee sin login.

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

**Estado:** implementada en `dev` (`3c5676c`, 2026-10-02). El front la va a usar con el login; mientras tanto, el riesgo de rotación de `api-integration.md` sigue.
**Endpoint:** todos los de `/api/v1`
**Motivo:** el front corre en otro dominio y reenvía la cookie de Supabase. El `proxy.ts` del backend puede refrescar la sesión con esa cookie y consumir el refresh token, dejando al usuario deslogueado (ver "Riesgo conocido" en `api-integration.md`). Bloquea el login del front.
**Cambio:** aceptar `Authorization: Bearer <access_token>` (validado con `supabase.auth.getUser(token)`) y excluir `/api/v1` del refresh de sesión del `proxy.ts`. Las cookies pueden seguir funcionando para la UI propia del backend.

### P-003 — Catálogo de activos (E14)

**Estado:** propuesta. E14 está **postergado** en el backend (falta proveedor de precios). Pedido: al menos `GET /assets/{symbol}` con precio y variación, o confirmar que la columna de activos sigue con datos de prueba.
**Endpoint:** `GET /api/v1/assets?q=`, `GET /api/v1/assets/{symbol}`
**Motivo:** la columna "Tus intereses" muestra precio y variación de los activos (hoy mockeado) y el autocompletado de `$` necesita el catálogo.
**Cambio:** implementar E14. Para `GET /assets?q=`, confirmar que responde la lista estándar, `{ "items": Asset[], "nextCursor": string | null }`, con el recurso `Asset` de E14. El mock del front ya asume esa forma.

### P-004 — Comunidad resumida en cada contenido

**Estado:** implementada en `dev` (`3cfff41`, 2026-10-02) y adoptada por el front (`specs/backend-contract`). La otra mitad (filtrar por membresía) ya estaba como `GET /communities?mine=true`.
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

**Estado:** implementada en `dev` (`3cfff41`) y adoptada por el front (`specs/backend-contract`)
**Endpoint:** recurso `Poll` (feed y `GET /polls/{id}`)
**Motivo:** la tarjeta de encuesta muestra la cantidad de comentarios, igual que la de post (H-28).
**Cambio:** `"commentCount": number`, con el mismo criterio que en `Post` (sin borrados).

### P-007 — Primeros comentarios sin el árbol completo

**Estado:** implementada en `dev` (`3cfff41`) y adoptada por el front: la vista previa pide `?limit=6&replies=false` (`specs/backend-contract`). `limit` acota el primer nivel e incluye los borrados; por eso se piden 6 para mostrar 3
**Endpoint:** `GET /api/v1/posts/{id}/comments`, `GET /api/v1/polls/{id}/comments`
**Motivo:** la tarjeta del feed muestra los 3 primeros comentarios. Hoy la respuesta trae todo el árbol con las respuestas anidadas.
**Cambio:** `?limit=3&replies=false`: solo los primeros N de primer nivel, sin `replies`. Sin parámetros, igual que hoy.

### P-008 — Sin textos en español en las respuestas

**Estado:** implementada en `dev` (`3cfff41`). El front ya no leía el `body` de un borrado
**Endpoint:** `Post` y `Comment` borrados
**Motivo:** un contenido borrado trae `body: "[contenido eliminado]"`. El front es multi-idioma (inglés por defecto) y muestra su propio texto según `deleted: true`.
**Cambio:** `body: ""` cuando `deleted` es `true`. El front ya no lee el `body` de un borrado, así que no es bloqueante.

### P-009 — Feed en pocas consultas, y backend en la región de la base

**Estado:** propuesta (2026-10-05). Es lo que más afecta a la experiencia hoy.
**Endpoint:** `GET /api/v1/feed/explore` y `GET /api/v1/feed/following` (y en general, toda lista)
**Motivo:** medido el 2026-10-05 contra `dev` local, con la Supabase de `eu-west-1`:

| Request | Tiempo |
| --- | --- |
| `/feed/explore?kind=POST,POLL` (20 ítems) | **12 s** |
| `/feed/explore?kind=POLL` | **6 s** |
| Una consulta trivial a la base (pooler 6543) | ~1,3 s |

La página del front con mocks tarda 0,04 s: casi todo el tiempo es esta espera. Hoy la serialización hace aproximadamente **una consulta por ítem y por dato**: autor, comunidad, votos, `commentCount`, voto del viewer y opciones de encuesta. Son unas 60 por página. Con ~1 s de ida y vuelta cada una, el feed no puede bajar de varios segundos.
**Cambio:**

1. **Armar la página en 2 o 3 consultas:**
   - Contenido con `include` de `creator`, `community`, `post` y `poll.options`.
   - Un `groupBy` para los conteos (votos, comentarios y votos por opción) de todos los ids de la página juntos.
   - Una consulta con los votos del viewer para esos ids.
   
   El mismo patrón sirve para `/communities` y para los comentarios.
2. **Desplegar el backend en la misma región que la base** (Vercel en `eu-west-1`, o mover la base a la región del backend). Cada consulta pasa de ~1 s a pocos ms. Junto con el punto 1, el feed debería quedar por debajo de 300 ms.
3. **Opcional:** subir `CONNECTION LIMIT` del rol `juan_readonly` (hoy 5), porque el front pide feed, comunidades e intereses en paralelo.

**Mientras tanto, en el front:** `specs/feed-navigation` hace que cambiar de pestaña responda al instante (streaming y esqueleto) y que volver a una pestaña reciente no espere. Eso esconde parte de la espera, pero no la resuelve.

## Preguntas sobre el contrato

- **Explore con comunidad inexistente**: `GET /feed/explore?community=nope` responde `200` con `items: []`. El front prefería `404` para mostrar "no existe" en lugar de "no hay posts". ¿Se cambia, o el front consulta `GET /communities/{slug}` aparte?
- **Tesis en el feed**: el feed ya devuelve `kind: "THESIS"`. El front las muestra en la fase 2; mientras tanto pide `?kind=POST,POLL`. ¿OK?
- **`Poll.totalVotes`**: el contrato lo tipa `number | null`; en `dev` siempre es un número, aun con los resultados ocultos. El front acepta las dos cosas; conviene alinear el contrato.
- **Documentos del contrato**: viven en `financeshowoff-design-docs/api/` (ese repo tiene cambios sin commitear según el handoff). Pedido: acceso al repo o el `openapi.yaml` actualizado, para refrescar `docs/references/api/`.
- **Imágenes**: van al bucket público `post-images` de Supabase Storage (`HANDOFF-frontend.md` § 8). El front agrega ese dominio a `remotePatterns` y a `img-src` de la CSP cuando se active.
- **Usuarios del seed**: no son cuentas de Supabase Auth, no se puede entrar con ellos. Para probar Following y votos con login hace falta crear cuentas reales.

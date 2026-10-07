# Propuestas de cambios al contrato

> Lo que el front necesita y el contrato de la API no tiene. Cada propuesta se mockea en `src/mocks/` con esta forma exacta (ver [`api-integration.md`](../../ai-guidelines/api-integration.md)) y se le pasa al backend para implementarla.
> Cuando el backend la implementa, se mueve al snapshot del contrato y se marca como resuelta acá.

**Revisado contra `asinko-app` rama `dev` (`c669972`, 2026-10-05)** y contra su deploy en Vercel (`https://asinko-app-web.vercel.app`, 2026-10-07, con `pnpm api:smoke`), con su `API-IMPLEMENTATION-NOTES.md` y el `openapi.yaml` del 2026-10-02. Antes, contra `0bb6325` (2026-10-04) y `0cdf243` (2026-10-01).

`dev` ya tiene:
- E01 a E05, búsqueda, tesis (sin `resolution-vote`) y E12.
- **E14** (activos y sentiment, `6e2d05b`).
- **E07** (notificaciones, `cb6ee2b`).
- Alertas de precio (`c56d7ba`).
- Seed con imágenes en Storage.

El contrato vigente vive en `financeshowoff-design-docs/api/` (con `openapi.yaml`) y en el artefacto _ASINKO Endpoint Spec_.

## Migración `asset_logo` — resuelta

La migración `20261005130156_asset_logo` faltaba en la base de dev y hacía que todo lo que lee activos respondiera `500` (pedido del 2026-10-05). Se aplicó el 2026-10-06: `GET /assets/BTC` responde `200`, con logo y sentimiento.

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

**Estado:** implementada en `dev` (`6e2d05b`, 2026-10-04) y desbloqueada (la migración `asset_logo` se aplicó el 2026-10-06). **Sin precios:** los 10 activos llegan con `price`, `priceChangePct` y `priceUpdatedAt` en `null` y `priceStale: true` (falta el proveedor de precios). Por eso el front sigue con los activos en mocks: los mosaicos de la columna muestran justamente precio y variación. Pedido: avisar cuando haya precios.
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

**Estado:** resuelta en parte (2026-10-07). Con el backend desplegado en Vercel (`https://asinko-app-web.vercel.app`), el feed responde en **0,7 s** (`/feed/explore?kind=POST,POLL`), comunidades en ~3 s la primera vez y perfiles en 0,5 s: el punto 2 (misma región) se cumple. Queda el punto 1 (pocas consultas por página) para el backend local y para cuando crezca el feed. Antes: propuesta (2026-10-05), lo que más afectaba a la experiencia. `API-IMPLEMENTATION-NOTES.md` lo anota como hueco conocido ("~3 queries por contenido. Alcanza para MVP; si molesta, el paso siguiente es batchear por tipo"). **Molesta:** con la base en otra región, el feed tarda 12 a 16 s. Medido de nuevo el 2026-10-05 con `c669972`: 15,8 s.
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

### P-010 — Avatar y membresía en la comunidad de cada contenido

**Estado:** propuesta (2026-10-05). Mockeada (`specs/community-first`).
**Endpoint:** `GET /api/v1/feed/explore`, `GET /api/v1/feed/following` y todo lo que devuelva la comunidad resumida de P-004.
**Motivo:** las tarjetas del feed pasan a mostrar el grupo como protagonista, como Reddit: su avatar arriba y un botón "Unirse" si el usuario no es miembro. Hoy el resumen trae solo `id`, `slug`, `name` y `type`. Para no esperar, el front pide en paralelo `GET /communities` y `GET /communities?mine=true` y cruza los datos. Son dos requests más por página, y no alcanza para grupos fuera de la primera página de esas listas.
**Cambio:** sumar dos campos al resumen de comunidad de cada contenido:

```json
"community": {
  "id": "…",
  "slug": "acciones",
  "name": "Acciones",
  "type": "USER_PUBLIC",
  "avatarUrl": "https://…/storage/v1/object/public/…" ,
  "viewerMembership": "MEMBER"
}
```

- `avatarUrl`: el mismo de `GET /communities/{slug}`, o `null`.
- `viewerMembership`: el rol del viewer (`MEMBER`, `MODERATOR`, `PRINCIPAL_MODERATOR`), o `null` si no es miembro o no hay sesión. Es el mismo campo de `GET /communities`.

Con eso el front borra los dos requests extra.

## Preguntas sobre el contrato

- **`email` en el perfil** (`GET /profiles/{identifier}`, detectado por `pnpm api:smoke` el 2026-10-07): el contrato dice que viene solo cuando el viewer es el usuario, pero para otro perfil llega `"email": null`. El front acepta las dos formas. ¿Se alinea el contrato con `null`, o el backend lo omite?

- **Explore con comunidad inexistente**: `GET /feed/explore?community=nope` responde `200` con `items: []`. El front prefería `404` para mostrar "no existe" en lugar de "no hay posts". ¿Se cambia, o el front consulta `GET /communities/{slug}` aparte?
- **Tesis en el feed**: el feed ya devuelve `kind: "THESIS"`. El front las muestra en la fase 2; mientras tanto pide `?kind=POST,POLL`. ¿OK?
- **`Poll.totalVotes`**: el contrato lo tipa `number | null`; en `dev` siempre es un número, aun con los resultados ocultos. El front acepta las dos cosas; conviene alinear el contrato.
- **Documentos del contrato**: recibimos el `openapi.yaml` del 2026-10-02 y `API-IMPLEMENTATION-NOTES.md` (gracias). Queda pedido el acceso al repo `financeshowoff-design-docs`, para refrescar `docs/references/api/` sin depender de copias.
- **Imágenes**: van al bucket público `post-images` de Supabase Storage (`HANDOFF-frontend.md` § 8). El front agrega ese dominio a `remotePatterns` y a `img-src` de la CSP cuando se active.
- **Usuarios del seed**: no son cuentas de Supabase Auth, no se puede entrar con ellos. El front ya tiene un login de desarrollo (`specs/dev-login`): una cuenta creada en `asinko-app` (`/login`), `signInWithPassword` desde el servidor y el token como `Authorization: Bearer`.
- **CORS**: el front llama a `/api/v1` solo desde su servidor (Server Components y Server Actions), nunca desde el navegador. No hace falta sumarlo a `API_ALLOWED_ORIGINS` mientras siga así.
- **Códigos de error nuevos** (`API-IMPLEMENTATION-NOTES.md`): el front ya trata cualquier `403`/`409`/`422` como error esperado con su clave de traducción. Cuando exista crear post, va a tener mensajes propios para `NOT_COMMUNITY_MEMBER`, `PERSONAL_CHANNEL_OWNER_ONLY` y `CONTENT_DELETED`. Pregunta: `d1a18e7` ("publicar sin ser miembro") ¿deja sin efecto `NOT_COMMUNITY_MEMBER`?

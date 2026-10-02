# Propuestas de cambios al contrato

> Lo que el front necesita y el contrato de la API no tiene. Cada propuesta se mockea en `src/mocks/` con esta forma exacta (ver [`api-integration.md`](../../ai-guidelines/api-integration.md)) y se le pasa al backend para implementarla.
> Cuando el backend la implementa, se mueve al snapshot del contrato y se marca como resuelta acá.

**Revisado contra `asinko-app` rama `dev` (`0cdf243`, 2026-10-01).** En `main` solo está E01; en `dev` ya están E02, E03, E04, E05 y tesis. E14 (activos) no está en ninguna rama.

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

**Estado:** propuesta. En `dev`, `serializePost` todavía no incluye `entities`.
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

**Estado:** propuesta. E14 no está implementado en ninguna rama.
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
- **Documentos del contrato**: el código cita `api/entities.md` y `api/CONSIDERATIONS.md`, que no están en el repo. El snapshot del front (`docs/references/api/`) quedó desactualizado: ¿dónde está la versión vigente?

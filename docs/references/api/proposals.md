# Propuestas de cambios al contrato

> Lo que el front necesita y el contrato de la API no tiene. Cada propuesta se mockea en `src/mocks/` con esta forma exacta (ver [`api-integration.md`](../../ai-guidelines/api-integration.md)) y se le pasa al backend para implementarla. Cuando el backend la implementa, pasa a "Resueltas" y al snapshot del contrato.

**Revisado el 2026-10-07** contra el deploy de `asinko-app` en Vercel (`https://asinko-app-web.vercel.app`, rama `dev` en `c669972`), con `pnpm api:smoke` y llamadas directas.

## Pendientes

En orden de prioridad para el front.

### P-010: Avatar y membresía en la comunidad de cada contenido

**Estado:** propuesta (2026-10-05). Mockeada (`specs/community-first`).

**Endpoint:** `GET /feed/explore`, `GET /feed/following` y todo lo que devuelva la comunidad resumida de cada contenido (P-004).

**Motivo:** las tarjetas muestran el grupo como protagonista: su avatar y un botón "Unirse" si el usuario no es miembro. Hoy el resumen trae solo `id`, `slug`, `name` y `type`. Mientras tanto, el front pide en paralelo `GET /communities` y `GET /communities?mine=true` y cruza los datos. Son dos requests más por página, y no alcanza para grupos fuera de la primera página de esas listas.

**Cambio:** dos campos más en el resumen:

```json
"community": {
  "id": "…",
  "slug": "acciones",
  "name": "Acciones",
  "type": "USER_PUBLIC",
  "avatarUrl": "https://…/storage/v1/object/public/…",
  "viewerMembership": "MEMBER"
}
```

- `avatarUrl`: el mismo de `GET /communities/{slug}`, o `null`.
- `viewerMembership`: el rol del viewer (`MEMBER`, `MODERATOR`, `PRINCIPAL_MODERATOR`), o `null` si no es miembro o no hay sesión.

### P-011: Nombre visible, tier y rating público en el perfil

**Estado:** propuesta (2026-10-07). Se mockea con la página de perfil (`specs/community-pages`, parte 2).

**Endpoint:** `GET /profiles/{identifier}`.

**Motivo:** el perfil del prototipo muestra el nombre ("Federico Piva"), la etiqueta **Creator** o **Partner** y el **rating** (AAA…D) junto al nombre. El overview del producto define el rating como público ("estilo calificadora, nunca se compra") y los tiers para usuarios públicos con historial. Hoy el perfil no tiene ninguno de los tres, y el contrato E12 dice que `internalRating` "no se expone".

**Cambio:**

```json
"displayName": "Federico Piva",
"tier": "CREATOR",
"rating": "AAA"
```

- `displayName`: texto libre, o `null`.
- `tier`: `CREATOR`, `PARTNER` o `null`.
- `rating`: `AAA`, `AA`, `A`, `BBB`, `BB`, `B`, `C` o `D`, o `null` sin historial suficiente.

**A decidir con producto:** si el rating público es el mismo `internalRating` o uno derivado. El front muestra lo que venga y no lo calcula.

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

### P-009: Feed en pocas consultas

**Estado:** resuelta en parte. Desplegado en Vercel, el feed responde en **0,7 s** (antes, 12 a 16 s con el backend local contra la base en otra región).

**Queda:** armar cada página en 2 o 3 consultas (`include` del contenido, un `groupBy` para los conteos y una consulta con los votos del viewer) en lugar de una por ítem y por dato. Va a pesar cuando crezca el feed y se nota en el backend local.

### P-005: Orden del feed

**Estado:** el filtro por tipo (`?kind=POST,POLL`) ya está. **Falta:** `sort=hot|new|top`, para los filtros _Hot_ y _Top_ del prototipo. ¿Cuándo? Y sumar `kind` al contrato (E04).

## Pedidos operativos

- **Cuentas de prueba después de cada seed:** el seed borra todos los perfiles, incluidos los de `qa_uno`, `qa_dos` y `qa_tres`. Sin perfil, el login de desarrollo del front no entra. Hoy los tres dan `404`. **Pedido:** correr `npm run seed:auth --workspace=packages/db` después de cada `seed`, o encadenarlo en el mismo script.

## Preguntas sobre el contrato

- **`email` en el perfil:** el contrato dice que viene solo cuando el viewer es el usuario, pero para otro perfil llega `"email": null` (detectado por `pnpm api:smoke`). El front acepta las dos formas. ¿Se alinea el contrato con `null`?
- **`Poll.totalVotes`:** el contrato lo tipa `number | null`; siempre llega un número, aun con los resultados ocultos. El front acepta las dos cosas. Conviene alinear el contrato.
- **Tesis en el feed:** el feed ya devuelve `kind: "THESIS"`. El front las muestra en la fase 2 y mientras tanto pide `?kind=POST,POLL`. ¿OK?
- **Códigos de error para crear post:** el front va a tener mensajes propios para `NOT_COMMUNITY_MEMBER`, `PERSONAL_CHANNEL_OWNER_ONLY` y `CONTENT_DELETED`. ¿`d1a18e7` ("publicar sin ser miembro") deja sin efecto `NOT_COMMUNITY_MEMBER`?
- **Documentos del contrato:** queda pedido el acceso al repo `financeshowoff-design-docs`, para refrescar `docs/references/api/` sin depender de copias.

## Resueltas

| Propuesta | Qué se pidió | Cuándo |
| --- | --- | --- |
| P-002 | `Authorization: Bearer` en `/api/v1`, sin refrescar la sesión en la API | `3c5676c`, 2026-10-02 |
| P-004 | La comunidad resumida (`id`, `slug`, `name`, `type`) en cada contenido | `3cfff41`, 2026-10-02 |
| P-006 | `commentCount` en `Poll` | `3cfff41` |
| P-007 | Primeros comentarios sin el árbol (`?limit=&replies=false`) | `3cfff41` |
| P-008 | `body: ""` en contenido borrado, sin textos en español | `3cfff41` |
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

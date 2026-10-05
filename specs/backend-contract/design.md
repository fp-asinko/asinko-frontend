# Front adaptado al contrato nuevo del backend — Design

> **Estado:** aprobado el 2026-10-04.

## 1. Contrato (`src/lib/api/contract/content.ts`)

| Esquema         | Cambio                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------- |
| `postSchema`    | + `community: communitySummarySchema` (obligatorio, Q3). `communityId` se queda: lo sigue mandando |
| `pollSchema`    | + `community: communitySummarySchema` y `commentCount: z.number().int()`                           |
| `commentSchema` | Sin cambios: `replies` llega siempre (`[]` con `replies=false`) y `replyCount` ya está             |

```ts
/** P-004: the community of a piece of content, just what a card needs. */
export const communitySummarySchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  type: communityTypeSchema, // the same enum as communitySchema
})
```

P-008 no cambia ningún esquema: `body` sigue siendo `string`, ahora `""` cuando el contenido está borrado. El mapper ya ignora el `body` de un borrado.

## 2. Feed (`features/feed/lib/feed-api.ts` y `mappers.ts`)

- `toCommunityRef` acepta el resumen: usa `slug`, `name` y `type`, que ya tiene. Así `toPostItem` y `toPollItem` sacan la comunidad de `post.community` y `poll.community`, no del índice.
- **El índice queda solo para las menciones** (Q1). Se renombra `MentionIndex` y sale de las entidades de la página:
  1. Se pide el feed (y, en paralelo, la comunidad filtrada, como hoy).
  2. Si algún ítem válido trae entidades `COMMUNITY` o `TICKER`, se pide `GET /communities` y se arma el índice. Si no, el índice es vacío y no hay request.
  3. Con el backend real de hoy (sin P-001) el paso 2 no ocurre: se ahorra un request por página y, con la latencia actual (~1,3 s por consulta), algo de tiempo.
- **Si falla `GET /communities`:** las menciones quedan como texto, igual que hoy. La comunidad de la tarjeta ya no depende de ese request.
- `toPollResults` (la respuesta del voto) toma la comunidad del poll, aunque `PollResults` no la use. Se borra el `indexCommunities([])` de relleno.

## 3. Comentarios

- **Poll (BC-03):** `PollItem` suma `commentCount`. `PollCard` usa el mismo contenido de botón que `PostCard`: número compacto (`countFormat`) y `feed.card.comments` en sr-only. Las dos tarjetas comparten el `<MessageSquareIcon>` y el formato. Si a la tercera hace falta otro, se extrae (DRY con regla de tres).
- **Vista previa (BC-04):** `getCommentsPreview` manda `query: { limit: '6', replies: 'false' }` (`PREVIEW_FETCH = 6`, Q2). Se mantiene el filtro de primer nivel y no borrados, y `slice(0, PREVIEW_SIZE)`: si el backend ignora los parámetros (uno viejo), el resultado es el mismo.

## 4. Mocks (BC-05)

- `fixtures/posts.ts` y `fixtures/polls.ts` suman `community` con `communitySummary(slug)`, una función nueva en `fixtures/communities.ts` que arma el resumen desde el fixture de la comunidad. Las encuestas suman `commentCount`, contado desde `COMMENTS_BY_CONTENT` sin borrados, igual que el backend.
- Los handlers de `GET /posts/:id/comments` y `GET /polls/:id/comments` leen `limit` y `replies` con la misma regla del backend:
  - `limit`: entero positivo, con techo de 20; cualquier otro valor se ignora.
  - `replies`: solo `"false"` lo apaga.
  - Con `replies=false`: raíces con `replies: []`, recortadas a `limit`.
- Contenido y comentarios borrados en los fixtures: `body: ""`.
- `fixtures.test.ts` suma un `example` con `?limit=3&replies=false` y verifica la forma.

## 5. Documentación (BC-06)

- `docs/references/api/E03`, `E04` y `E05`: suman `community` y `commentCount` al recurso, y `limit`/`replies` a los GET de comentarios.
- `proposals.md`:
  - P-002, P-004, P-006, P-007 y P-008 pasan a **implementada en `dev`**, con su commit.
  - P-005 ya lo estaba.
  - Se borra la sección "Bloqueo para usar datos reales" si ya no aplica.
- `specs/home/design.md § 6` y la tabla de propuestas: los atajos de P-004 y P-006 quedan marcados como cerrados por este spec.
- `api-integration.md`: el riesgo de rotación del refresh token sigue mientras el front no use Bearer. Se anota que el backend ya lo acepta (P-002) y que el login lo va a usar.

## 6. Verificación (BC-07, BC-08)

- **Unitarios:**
  - mappers: comunidad desde el contenido, `commentCount` en encuesta.
  - `feed-api`: no pide `/communities` sin entidades, sí lo pide con entidades, y una falla de comunidades no quita la comunidad de la tarjeta.
  - `comments-api`: manda `limit` y `replies`.
  - `poll-card`: botón con cantidad.
  - Handlers de mocks.
- **e2e:** los existentes. `home.spec.ts` suma que la encuesta muestra "N comments".
- **`pnpm api:smoke`** contra `asinko-app` local, y una pasada manual del Home con `API_MOCKS=missing` (datos reales).
- **Presupuesto de JS** con `performance.spec.ts`.

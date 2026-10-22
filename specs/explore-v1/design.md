# Explore v1: "por qué ves esto" e impresiones — Design

> **Estado:** aprobado por el PO el 2026-10-22: la ruta propia para las impresiones (D-1) y "Popular em {country}" con `TODO(i18n)`.

## 1. Contrato y dominio

**Esquemas** (`src/lib/api/contract/content.ts`):

- `feedReasonSchema`: `{ type: string, via: communitySummary sin viewerMembership | null, countryCode: string | null }`.
  - `type` es un `string` libre, no un `enum`: un tipo nuevo del backend no tira el ítem (EX-02).
  - `countryCode` se acepta con `/^[A-Z]{2}$/`; otro valor cuenta como `null`.
- `feedItemSchema`: cada rama suma `reason: feedReasonSchema.nullable().optional()`. Es opcional porque los mocks viejos y `/users/{id}/content` no lo traen.
- El envoltorio de la lista (`looseListSchema` de `feed-api.ts`) suma `requestId: z.uuid().nullable().optional()`.

**Dominio** (`feed.types.ts`):

```ts
export type FeedReason =
  | { type: 'similar'; community: { handle: string; path: string } }
  | { type: 'country'; countryCode: string }

// PostItem y PollItem suman:
reason: FeedReason | null

// FeedPage suma:
requestId: string | null
```

**Mapper** (`mappers.ts`, `toFeedReason`):

- Pasa a `similar` solo un `SIMILAR` con `via` (handle y ruta con `mentionOf`, como las relacionadas) y a `country` solo un `COUNTRY` con `countryCode`.
- Todo lo demás es `null` (Q1, EX-02).

El mapper no mira en qué feed está. EX-03 se cumple porque el backend solo manda `reason` en el Explore del Home, y además:

- `getFeed` lo descarta (`reason: null`) en Following, con `?community=` y en el perfil, así un cambio del backend no lo hace aparecer donde no va;
- el detalle de un post no pasa por `getFeed`.

## 2. La etiqueta (EX-01 a EX-04)

**`FeedReasonLine`** (Server Component, `features/feed/components/feed-reason-line.tsx`):

- `PostCard` y `PollCard` la dibujan como primer hijo del `article`, arriba de `CardByline`, cuando `reason` no es `null`. En la variante `detail` y en `preview`, nunca.
- Es un `<p>` `type-meta text-muted-foreground` con un ícono `aria-hidden` de 14 px:
  - `SparklesIcon` para `similar`;
  - `MapPinIcon` para `country`.
- `similar`: `t.rich('similar', { community: … })` con el handle como `Link` a la página de la comunidad. `CardLink` no abre el post al tocar un link (`OWN_CLICK`), así que no hace falta nada extra.
- `country`: `new Intl.DisplayNames([locale], { type: 'region' }).of(code)`. Si `Intl` no conoce el código, la línea no se dibuja.
- Mensajes en `feed.card.reason`. No hace falta tocar `CLIENT_NAMESPACES`: es un Server Component, y en "Cargar más" la renderiza la Server Action.

| Clave     | en                             | es                        | pt                            |
| --------- | ------------------------------ | ------------------------- | ----------------------------- |
| `similar` | Because you follow {community} | Porque sigues {community} | Porque você segue {community} |
| `country` | Popular in {country}           | Popular en {country}      | Popular em {country}          |

El portugués lleva artículo según el país ("no Brasil", "na Argentina"), y `{country}` no lo resuelve. "Popular em {country}" se lee bien con la mayoría de los nombres y queda marcado `TODO(i18n)` para una revisión nativa.

No suma JavaScript: no hay componente cliente nuevo para la etiqueta.

## 3. Impresiones (EX-05 a EX-10)

### Por qué una ruta y no una Server Action (D-1)

Lo pendiente tiene que salir al cerrar la pestaña (EX-07). Lo único que el navegador garantiza en ese momento es `navigator.sendBeacon` (o `fetch` con `keepalive`). Una Server Action usa un `fetch` común, que se cancela al descargar la página.

Por eso las impresiones van por una **ruta propia de Next**, `POST /api/impressions` (`src/app/api/impressions/route.ts`). El navegador sigue sin llamar a la API del backend (`api-integration.md`): llama al servidor de `asinko-web`, que reenvía.

La ruta:

1. Acepta solo `POST` con `Content-Type: text/plain` o `application/json` y un cuerpo de hasta 16 KB. Más grande: `413`; otro tipo: `415`. _Cambio al implementar (2026-10-22): el beacon va como `text/plain`, el único tipo que todos los navegadores aceptan en `sendBeacon`; la protección es el chequeo de origen del paso 2, no el tipo._
2. Verifica que `Origin` sea el propio sitio, como Next hace con las Server Actions (CSRF). Si no: `403`.
3. Valida el cuerpo con `impressionsSchema` (zod): `{ requestId: uuid, events: [{ contentId: uuid, type: 'SEEN' | 'OPEN', dwellMs?: int 0–3.600.000 }] }`, de 1 a 100 eventos. Si no cumple: `400`.
4. Lee la sesión con `getViewer()` y llama a `reportImpressions(viewer?.id ?? null, body)` de `features/feed/lib/impressions-api.ts` (`server-only`), que hace `POST /api/v1/feed/impressions` con `noContentSchema`. El `userId` nunca viene del navegador (EX-08).
5. Responde siempre `204`, aunque el backend falle (EX-09). Los `5xx` del backend los reporta solo el cliente de la API, con el endpoint y el código (EX-10).

El `matcher` de `proxy.ts` ya excluye `/api`: la ruta no pasa por el locale ni la CSP, y no los necesita. La sesión se lee de la cookie igual que en una página.

### El cliente

**`impression-queue.ts`** (`features/feed/lib/`, cliente, sin React). Es una cola del módulo, compartida por todas las páginas del feed:

- `track(requestId, event)` agrega un evento. Al llegar a 100 manda el lote.
- `flush()` agrupa lo pendiente por `requestId` y manda un beacon por grupo. Sin `sendBeacon`, usa `fetch(..., { keepalive: true })`.
- Se vacía cada 10 s si hay algo, al ocultarse la página (`visibilitychange` a `hidden`, que también cubre cerrar la pestaña en mobile) y en `pagehide`.
- Si el envío falla, no se reintenta (EX-09).

**`ImpressionTracker`** (componente cliente, `features/feed/components/impression-tracker.tsx`):

- Envuelve la `<ul>` de cada página del feed con su `requestId`: en `FeedListView` la primera y en `loadMoreFeed` las siguientes (EX-07).
- Sin `requestId` no envuelve nada: devuelve sus hijos tal cual (EX-09).
- **Visto:** un `IntersectionObserver` con `threshold: 0.5` mira cada `article[data-content-id]` de la lista.
  - Al entrar arranca un reloj; al salir, si pasó 1 s o más, encola `SEEN` con `dwellMs` y deja de observar esa tarjeta (una vez por tarjeta y por página, EX-05).
  - Si la página se oculta con la tarjeta visible y ya pasó 1 s, se encola en ese momento.
- **Abierto:** un listener de `click` en fase de captura sobre la lista (delegación, un solo listener). Encola `OPEN` si el click abre el post (EX-06):
  - un link cuyo `href` es la ruta del post (`data-content-path`): el título, la imagen o "comentarios";
  - o un click que `CardLink` convierte en navegación: el mismo criterio de `OWN_CLICK`, que pasa a exportarse de `card-link.tsx` para no duplicarlo.
  - Una encuesta no tiene página: solo reporta `SEEN`.

`PostCard` y `PollCard` (variante `card`) suman `data-content-id` y, el post, `data-content-path` en su `article`. Son atributos: no cambian nada para el lector de pantalla.

### Peso (EX-12)

El tracker y la cola son unas 120 líneas sin dependencias, cargadas en toda ruta con feed (Home, grupo, activo). No se difieren: tienen que estar antes de que se vea la primera tarjeta, y diferir algo tan chico cuesta más que cargarlo (`seo.md`). Se mide antes y después en `performance.spec.ts`. Esperado: +1 KB gzip.

## 4. Mocks y smoke (EX-13)

- El mock de `GET /feed/explore` suma `requestId` (un uuid fijo por cursor) y, sin `?community`, un `reason` rotando entre los cuatro tipos. `SIMILAR` lleva un `via` de los fixtures y `COUNTRY` lleva `AR`.
- `GET /feed/following` y `?community=` suman `requestId`, con `reason: null`.
- `POST /feed/impressions` como ruta `contract`, `implemented: true`, que responde `204` y valida el cuerpo con `impressionsSchema`. Con `API_MOCKS=true` el e2e la ejercita sin red.
- `contract.smoke.ts` valida `requestId` y `reason` de Explore contra `dev` con el mismo esquema. No hace el `POST`: el smoke solo lee.
- El snapshot (`docs/references/api/`) suma `reason`, `requestId` y `POST /feed/impressions`.

## 5. Errores

| Caso                                        | Qué pasa                                          |
| ------------------------------------------- | ------------------------------------------------- |
| `reason` mal formado                        | El ítem pasa con `reason: null` (no se descarta). |
| `requestId` ausente o `null`                | Sin tracker en esa página.                        |
| La ruta recibe un cuerpo inválido           | `400`, nada al backend.                           |
| El backend responde `4xx` / `5xx` / timeout | La ruta responde `204`; el `5xx` se reporta solo. |
| Sin `sendBeacon` ni `keepalive`             | Se pierde lo pendiente al cerrar; no se nota.     |

`reason` mal formado no debe descartar la tarjeta. Por eso el esquema del ítem lo envuelve en `.catch(null)`: es una etiqueta, no el contenido.

## 6. Accesibilidad

- La línea es texto dentro del `article`, antes del título: se lee primero y no cambia los encabezados.
- El link de la comunidad tiene su nombre accesible del texto (`#macro`) y foco visible: el anillo y, como `truncate` lo recorta, también el subrayado. A 360 px la línea se corta en una sola línea con `truncate`. El link mide lo que su texto (unos 18 px): cumple WCAG 2.5.8 por la excepción de link dentro de una oración y por su separación (la línea tiene 24 px de alto y nada más que tocar alrededor).
- Sin animación propia.

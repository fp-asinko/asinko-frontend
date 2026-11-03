# Una tesis en el feed y en su página — Design

> Basado en `requirements.md` (Q1 a Q5 resueltas el 2026-11-03). Rama `feature/thesis-detail-lifecycle`, desde `feature/thesis-create`, que todavía no está en `develop`.

## 1. Dónde vive

- **La tarjeta en el feed y la página de la tesis viven en `features/feed`**, como el post (`post-card.tsx`, `post-route-page.tsx`). El feed ya decide qué dibuja cada `kind`, y un feature no importa a otro (`structure.md`).
- **Lo que comparten el perfil y el feed sube a `components/organisms/thesis-summary/`.** Son dos piezas, que reciben todo por props y no conocen el negocio:
  - `ThesisState`: el chip de estado. Hoy está en `features/communities` y lo usan su tarjeta y la destacada (`specs/profile-showcase`).
  - `ThesisSummary`: el claim, el objetivo, cómo terminó y la convicción en barras.
    `features/communities` y `features/feed` las importan desde ahí.
- La tarjeta del perfil (`features/communities/components/thesis-card.tsx`) mantiene su forma y pasa a ser un link (TD-17), con `CardLink`, como un post.

## 2. Tipos y mapper (TD-01, TD-03)

`features/feed/feed.types.ts` suma `ThesisItem`, y `FeedItem` pasa a ser `PostItem | PollItem | ThesisItem | AdItem | GlossaryItem`:

```ts
export type ThesisItem = {
  kind: 'thesis'
  id: string
  path: string // /thesis/{id} (Q1)
  claim: string
  reasoning: string // Markdown; entero solo en la página
  asset: { symbol: string; name: string; path: string } | null
  state: 'open' | 'expired' | 'correct' | 'incorrect' | 'disputed' | 'cancelled'
  target: { direction: 'above' | 'below' | 'equals'; price: number }
  reference: { price: number; at: string } | null
  deadline: string
  conviction: 1 | 2 | 3 | 4
  resolution: {
    price: number | null
    at: string
    source: 'automatic' | 'community' | 'admin'
  } | null
  cancellation: { at: string; reason: string | null } | null
  author: Author | null
  community: CardCommunity | null
  score: number
  viewerVote: 1 | -1 | null
  argumentCount: { pro: number; contra: number }
  canCancel: boolean
  publishedAt: string
  reason?: FeedReason | null
}
```

- `toFeedItem` (`lib/mappers.ts`) mapea `kind: 'THESIS'` con el `thesisSchema` del contrato (`@/lib/api/contract`), que ya existe. `community` y `author` se mapean igual que en un post.
- `KNOWN_KINDS` (`lib/feed-api.ts`) suma `THESIS`. El comentario "THESIS waits for phase 2" se va.
- `keepValidItems` ya descarta y reporta una tesis mal formada sin tirar abajo la lista.

## 3. La tarjeta del feed (`thesis-card.tsx` en `features/feed`, TD-02 a TD-05)

Es un Server Component, igual que `PostCard`:

- **Cabecera:** `CardByline` con el grupo, Unirse y el autor, y una píldora gris **Tesis** al lado de la hora (Q2). La píldora es `rounded-full bg-muted px-2 type-meta font-semibold`, la misma forma que `TagPill`. Un canal personal muestra al autor con su foto.
- **Cuerpo:** `ThesisSummary` (§ 1). Suma "Cierra en 23 días" si está abierta (`useFormatter().relativeTime`) o el precio de resolución si está resuelta.
- **Acciones:**
  - `VoteControl` con `kind="thesis"` (§ 6);
  - el contador de argumentos (`pro + contra`), con el ícono de comentarios y un link a la página;
  - `ShareButton`.
- **Link:** toda la tarjeta lleva a `/thesis/{id}` con `CardLink`, como un post. Los links internos (activo, grupo, autor) quedan por encima.
- **Menú "⋯"** (TD-12): solo si `canCancel` y el viewer es el autor. Es un componente cliente chico, `ThesisMenu`, que abre la confirmación diferida (§ 7).

`FeedItems` suma la rama `item.kind === 'thesis'`. Las impresiones (`specs/explore-v1`) cuentan igual que para un post.

## 4. La página (`/[locale]/thesis/[id]`, TD-06 a TD-11)

- **Ruta:** `src/app/[locale]/thesis/[id]/page.tsx`, fuera de `(main)` y sin `loading.tsx`, como `/post`: un 404 real. Su columna derecha va en `@right/thesis/[id]/page.tsx` y es la del post: la tarjeta del grupo y sus reglas.
- **Datos:** `lib/thesis-api.ts` (`server-only`) con `getThesis(id)`:
  - valida el `id` como uuid antes de la red (`invalidInput`);
  - llama a `GET /theses/:id` con `thesisSchema`.
    La página usa `getOrThrow`; un `NOT_FOUND` va a `notFound()` (TD-10).
- **Vista:** `thesis-route-page.tsx` (`ThesisDetail` y `thesisMetadata`), como `post-route-page.tsx`. De arriba hacia abajo:
  1. el botón Volver del post (`specs/post-detail-refresh` PD-01);
  2. la tarjeta en su variante `detail`: el claim es el `h1` y el razonamiento va entero con `PostMarkdown`;
  3. el bloque **"La apuesta"** (TD-07), una lista de definición `<dl>` (§ 5);
  4. el bloque de estado (TD-08, § 5);
  5. **Argumentos** (TD-09): "N a favor · N en contra" y "Próximamente", sin caja para comentar (Q3).
- **Metadata** (TD-11):
  - `title`: "{claim} · ${symbol}";
  - `description`: el objetivo con la fecha ("Por encima de $150.000 antes del 3 dic 2026");
  - canonical y `hreflang` con `alternates` de `@/i18n`.
- **Imagen para compartir:** `thesis/[id]/opengraph-image.tsx`, con la tarjeta genérica de `_share/generic-card.tsx`: el activo, el claim y el objetivo. Va sin `next/og` propio, porque cada ruta de imagen suma algo a todas (`seo.md`).

## 5. La apuesta y el estado (TD-07, TD-08)

- **La apuesta.** Cada fila es `<dt>` gris con su `<dd>`:
  - **Precio de referencia:** el precio y "tomado el 13 oct", o "Sin precio" si es `null`.
  - **Objetivo:** "↑ Por encima de $150.000 · +79 %", en verde o rojo con su flecha (lo mismo que el formulario, TC-24). `EQUALS` se dice "Igual a".
  - **Fecha límite:** "3 dic 2026, 23:59", en la zona de quien la ve (`specs/local-time`).
  - **Convicción:** las barras.
  - **Publicada:** la fecha.
- **El estado** sale de un mapa (`state` → texto y datos), sin `if` encadenados:

  | Estado            | Qué dice                                                                                     |
  | ----------------- | -------------------------------------------------------------------------------------------- |
  | Abierta           | "Cierra en 23 días"                                                                          |
  | Vencida           | "Esperando resolución"                                                                       |
  | Acertada / Errada | "Resuelta el 3 dic a $162.000 · automáticamente / por la comunidad / por un admin" con ✓ / ✗ |
  | En disputa        | "En revisión"                                                                                |
  | Cancelada         | "Cancelada el 5 nov: {motivo}"                                                               |

## 6. Votar (TD-16)

- `VoteControl` hoy acepta `kind: 'post' | 'comment'`; se suma `'thesis'`.
- La acción `vote-thesis.action.ts` repite la de un post:
  - valida con el mismo esquema;
  - sale con `UNAUTHENTICATED` si no hay sesión;
  - llama a `voteThesisAs(viewer.id, …)` en `lib/votes-api.ts`, con `PUT` y `DELETE` sobre `/api/v1/theses/:id/vote`.
- Sin sesión abre el modal de cuenta (`requireAccount('vote-post')`, el mismo motivo).

## 7. Cancelar (TD-12 a TD-15)

- **`ThesisMenu`** (cliente): "⋯" con un ítem, "Cancelar tesis". Aparece solo si `canCancel`; el backend ya lo da `false` a quien no es el autor.
- **`CancelThesisDialog`** (cliente, con `next/dynamic` al primer uso):
  - es `Dialog` en desktop y `Drawer` en el teléfono, como la confirmación de publicar;
  - dice que queda como Cancelada en el historial y que no se puede deshacer;
  - tiene un `Textarea` para el motivo, obligatorio, de 1 a 280 caracteres con contador (Q4);
  - botones: Volver y "Cancelar tesis", en rojo (`destructive`), deshabilitado mientras se envía.
- **`cancel-thesis.action.ts`:**
  - esquema `cancel-thesis.schema.ts`: `{ id: uuid, reason: trim, 1..280 }`;
  - la sesión se verifica adentro y el `userId` sale de ella;
  - llama a `cancelThesisAs(viewer.id, id, reason)` en `lib/thesis-api.ts` (`PUT /theses/:id/cancel`);
  - devuelve `ActionResult<{ state: 'cancelled'; cancellation }>`.
- **Al terminar** se cierra la confirmación y `router.refresh()` vuelve a pedir la tarjeta o la página, que llegan con el chip Cancelada y el motivo. Es una acción rara, así que no hace falta una actualización optimista.
- **Errores:**
  - `THESIS_NOT_CANCELLABLE` → `feed.thesis.cancel.errors.NOT_CANCELLABLE` dentro de la confirmación, y `router.refresh()` saca la opción;
  - el resto, con `api.errors.*`;
  - sin sesión, `requireAccount`.

## 8. El perfil (TD-17)

`features/communities/components/thesis-card.tsx` se envuelve en `CardLink` hacia `/thesis/{id}`. El link del activo y el "⋯" de destacar siguen por encima. La tarjeta pasa a usar `ThesisSummary` y `ThesisState` del organismo.

## 9. Mocks (TD-20)

- **Fixtures:** `src/mocks/fixtures/theses.ts` ya tiene tesis de cada estado para el perfil. Se suman como `kind: THESIS` a los feeds de los mocks: dos en Explorar, una en `#macro` y una en `$BTC`.
- **Rutas nuevas en `handlers.ts`, todas `implemented: true`:**
  - `GET /api/v1/theses/:id`: la tesis, o `404`. Con `liveExample` de una tesis del seed que se lee en `pnpm api:smoke`, encadenada desde el feed como el primer post.
  - `PUT /api/v1/theses/:id/cancel`: cambia el estado en memoria. Da `409 THESIS_NOT_CANCELLABLE` si no está abierta y `403 USER_MISMATCH` si no es del usuario demo.
  - `PUT` y `DELETE /api/v1/theses/:id/vote`: como las de un post.
- Las tesis del usuario demo traen `canCancel: true` mientras están abiertas.

## 10. Textos

- **Namespaces nuevos:** `feed.thesis` (la píldora, cuánto falta, la apuesta, el estado, argumentos, cancelar y sus errores) y `thesisPage` (metadata). `feed` ya está en `CLIENT_NAMESPACES`; se suma `feed.thesis.cancel` si hace falta.
- **Se mueven:** las claves de `communities.theses` que usan el organismo pasan a `thesisSummary`, con un namespace propio para el organismo.
- Todo en en, es y pt.

## 11. Performance (TD-19)

- Lo único nuevo que va al navegador en las rutas con feed es `ThesisMenu`, un "⋯" chico. La confirmación se carga diferida y `VoteControl` ya está.
- Se mide con `performance.spec.ts`: Home, grupo, activo y la página nueva, `/thesis/{id}`, que se suma a la lista.
- Si el Home pasa de 240 KB, `ThesisMenu` también se difiere. Hay que medir antes, porque un módulo diferido cuesta ~0,2 KB en todas las rutas (`seo.md`).

## 12. Accesibilidad (TD-18)

- La tarjeta es un `article` con `aria-labelledby` al claim.
- El estado se dice con texto y con ✓ / ✗.
- La flecha del objetivo va con su texto.
- La confirmación atrapa el foco y lo devuelve al "⋯".
- El motivo tiene su `label` y su error con `aria-describedby`.
- Axe en claro y oscuro sobre el Home con tesis, la página de una tesis y la confirmación abierta.

## 13. Tests

| Qué                                                                         | Dónde                                                 |
| --------------------------------------------------------------------------- | ----------------------------------------------------- |
| Mapper de `THESIS` (cada estado, `null`s, link)                             | `mappers.test.ts`, `feed-api.test.ts` (`KNOWN_KINDS`) |
| `ThesisState` y `ThesisSummary`                                             | `components/organisms/thesis-summary/*.test.tsx`      |
| Tarjeta del feed (píldora, cuánto falta, acciones, link, ⋯ con `canCancel`) | `features/feed/components/thesis-card.test.tsx`       |
| La apuesta y el estado (tabla de § 5)                                       | `thesis-bet.test.tsx`                                 |
| `getThesis`, `cancelThesisAs`, `voteThesisAs`                               | `thesis-api.test.ts`, `votes-api.test.ts`             |
| Acciones (input inválido, sin sesión, `userId` de la sesión, cada error)    | `cancel-thesis.action.test.ts`, `vote.action.test.ts` |
| Confirmación de cancelar (motivo obligatorio, contador, errores)            | `cancel-thesis-dialog.test.tsx`                       |
| Mocks contra el contrato                                                    | `fixtures.test.ts`                                    |
| Flujos: ver en el feed, abrir, votar, cancelar, 404, 360 px, axe, JS        | `e2e/thesis-detail.spec.ts`, `performance.spec.ts`    |

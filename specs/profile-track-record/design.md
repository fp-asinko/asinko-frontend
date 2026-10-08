# Perfil con track record — Design

## 1. Datos

- **Perfil:** `ProfileDetails` suma `id` (para pedir las tesis), `followingCount`, `correctCount`, `incorrectCount` y `cancelledCount`; el mapper ya recibe esos campos del contrato (`src/lib/api/contract/users.ts`) y hoy los descarta.
- **Tesis:** contrato nuevo `src/lib/api/contract/theses.ts` con el recurso `Thesis` de E11 (solo los campos que usa la tarjeta, el resto `passthrough` no: el esquema crudo valida lo que leemos) y la lista `{ items, nextCursor }` con `keepValidItems`.
- `getUserTheses(userId, cursor?)` en `features/communities/lib/theses-api.ts` (`server-only`): valida `userId` (uuid) y el cursor antes de la red; mapea a `ThesisItem`:

```ts
type ThesisItem = {
  id: string
  asset: { symbol: string; path: string } | null
  claim: string
  state: 'open' | 'correct' | 'incorrect' | 'expired' | 'disputed' | 'cancelled'
  direction: 'above' | 'below' | 'equals'
  targetPrice: number
  deadline: string
  conviction: 1 | 2 | 3 | 4 // LOW … EXTREME
  resolutionPrice: number | null
  cancellationReason: string | null
  publishedAt: string
}
```

## 2. Componentes

| Pieza                     | Dónde                                                         | Notas                                                                                                                                                                                                                                                                                              |
| ------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ProfileStats`            | ya existe (`community-stats.tsx`)                             | Primera línea: Siguiendo · Seguidores. Segunda: precisión · racha · ✓ N acertadas · ✗ N erradas · N canceladas, o "Todavía sin tesis resueltas" (PT-03).                                                                                                                                           |
| `ProfileTabs`             | `features/communities/components/profile-tabs.tsx` (servidor) | Dos `Link` con `aria-current="page"`, subrayado negro como `FeedTabs`, `?tab=theses`. `searchParams.tab` validado con zod (`'posts' \| 'theses'`, `catch('posts')`).                                                                                                                               |
| `ThesisCard`              | `features/communities/components/thesis-card.tsx` (servidor)  | La del prototipo sin votos. Chip de estado con tokens nuevos `--thesis-correct` / `--thesis-incorrect` / `--thesis-disputed` como alias de los de precisión (`--accuracy-high`, `-low`, `-mid`), más ✓ / ✗. Convicción: 4 barras `bg-foreground` / `bg-muted` con `aria-label` "Convicción: Alta". |
| `ThesesList`              | `features/communities/components/theses-list.tsx`             | Primera página en el servidor, en un `Suspense` con esqueleto; "Cargar más" con el `LoadMore` del feed (`components/` si hace falta compartirlo) y una Server Action `loadMoreTheses` que devuelve las tarjetas ya dibujadas.                                                                      |
| Página `/user/[username]` | `app/`                                                        | Lee `tab`; con `theses` muestra `ThesesList` en lugar de `CommunityFeed`. Las pestañas van entre el encabezado y el contenido.                                                                                                                                                                     |

- **Errores:** las tesis son contenido secundario de la página (el encabezado manda): un fallo muestra un error local (`engineering-principles.md`).
- **Formato:** precio con `format.number(value, { style: 'currency', currency: 'USD' })`, deadline con `format.dateTime(date, { dateStyle: 'medium' })`.

## 3. Mocks

- `src/mocks/fixtures/theses.ts`: 6 a 8 tesis repartidas entre `federico`, `maria` y el usuario demo, al menos una de cada estado, sobre los activos de los fixtures. Los contadores de los perfiles mock coinciden con ellas.
- Ruta `GET /api/v1/users/:userId/theses` (`kind: 'contract'`, `implemented: true`), con paginación por cursor y `404` para un usuario que no existe; `liveExample` con un usuario del seed para `pnpm api:smoke`.

## 4. Textos

`communities.profile.following` "{count} Following", `trackRecord.correct` "{count} correct", `incorrect`, `cancelled`, `noResolved`; `communities.tabs.posts` / `theses`; `theses.empty` / `emptySelf` / `error`; `theses.state.*`, `theses.target.{above,below,equals}` "Above {price} by {date}", `theses.conviction.{1..4}`, `theses.resolvedAt` "Resolved at {price}", `theses.cancelled` "Cancelled: {reason}".

## 5. Tests

- Unitarios: mapper y `getUserTheses` (validación antes de la red, `keepValidItems`), esquema de `tab`, `ProfileStats` (dos líneas, sin resueltas), `ThesisCard` (cada estado, convicción, resolución, cancelación), `ProfileTabs`, `loadMoreTheses`, `fixtures.test.ts` con la ruta nueva.
- E2E (`e2e/profile-track-record.spec.ts`): contadores en el perfil de `federico`, pestaña Tesis con la URL, tarjetas y "Cargar más", estado vacío en otro usuario, atrás vuelve a Posts, 360 px, axe claro y oscuro, presupuesto de JS del perfil.

## 6. Ajustes al implementar (2026-10-08)

- **"Cargar más" propio** (`ThesesLoadMore`): el del feed está atado a su action y a los anuncios, y los features no se importan entre sí. Es la segunda copia (regla de tres): **la próxima lista que lo necesite lo sube a `components/`** como un `LoadMore` genérico, con los arreglos de anuncio de las dos copias.
- El botón usa solo `communities.theses.more` en el cliente (`CLIENT_NAMESPACES`); la tarjeta se dibuja en el servidor.
- Vacío y error con el organismo `EmptyState`, como el feed; el esqueleto en su archivo (`theses-list-skeleton.tsx`) con un `role="status"` de carga.
- **Canceladas** se muestran siempre en la fila del track record, también en 0 (PT-02).
- **Precios:** sin centavos desde $1.000 ("$150.000"), con centavos abajo ("$2,41").
- La página importa las pestañas y la lista por su ruta (`seo.md`): los grupos y activos no cargan el botón. Perfil medido: 235,3 KB.

# Listas de seguidores y seguidos — Design

## 1. Datos

- **Contrato:** `paginatedSchema(userSummarySchema)` para las dos rutas. Con Q2, `userSummarySchema` suma `isFollowedByViewer: boolean | null` **opcional** (propuesta P-017: ausente hasta que el backend lo mande; `null` sin sesión).
- `getFollowList(userId, kind: 'followers' | 'following', cursor?)` en `features/communities/lib/follow-api.ts` (`server-only`): valida `userId` y cursor antes de la red, `keepValidItems`, y mapea a:

```ts
type FollowItem = {
  username: string
  path: string // /user/maria
  avatarUrl: string | null
  accuracyRate: number | null
  /** null: unknown (no session, or the backend does not say yet) → no button. */
  followed: boolean | null
  isSelf: boolean
}
```

- **Action** `loadFollowList({ userId, kind, cursor?, locale })`: la ventana es cliente y pide cada página (la primera también, al abrir) con una Server Action que devuelve las filas ya dibujadas, como "Cargar más" del feed.
- **Seguir:** la action de unirse al canal personal que ya usa el perfil (`CommunityActions`, variante `user`), con el estado compartido de `JoinedProvider`.

## 2. Componentes

| Pieza              | Dónde                                               | Notas                                                                                                                                                                                          |
| ------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FollowCounts`     | `community-stats.tsx`                               | Los dos primeros números de `ProfileStats` pasan a ser botones (sin cambiar cómo se ven: texto con el número en negrita, subrayado al pasar el mouse). Abren la ventana con la pestaña tocada. |
| `FollowListDialog` | `follow-list-dialog.tsx` (cliente, `next/dynamic`)  | `Dialog` (ventana de 480 px / pantalla completa en el teléfono, como "Editar perfil"), título "@maria", `Tabs` de shadcn con Seguidores · Siguiendo. Cada pestaña es una `FollowList`.         |
| `FollowList`       | `follow-list.tsx`                                   | Pide la primera página al montarse, muestra esqueleto, vacío, error con Reintentar, y "Cargar más" con `IntersectionObserver`.                                                                 |
| `FollowRow`        | `follow-row.tsx` (servidor, se dibuja en la action) | Avatar 40 px, `@usuario` link, chip de precisión (`ACCURACY_CLASSES`), y a la derecha Seguir / Siguiendo (Q2) con `FollowButton`.                                                              |

## 3. Textos

`communities.follows.title` "{handle}" · `tabs.followers` "Followers" · `tabs.following` "Following" · `listLabel.followers` "Followers of {handle}" · `listLabel.following` "People {handle} follows" · `empty.followers` / `empty.following` / `emptySelf.*` · `error` · `retry` · `loadMore` · `follow` / `followingButton`.

## 4. Tests

- Unitarios: `follow-api` contra el mock (paginación, 404, validación), action, `FollowCounts` (abre con la pestaña), `FollowListDialog` (pestañas con teclado, foco), `FollowList` (estados, cargar más), `FollowRow` (botón según `followed`, sin botón propio).
- E2E (`e2e/follow-lists.spec.ts`): abrir seguidores de `@maria`, paginar, cambiar a Siguiendo, ir a un perfil desde la lista, seguir desde una fila, 360 px, axe claro y oscuro, presupuesto.

## 5. Ajustes al implementar (2026-10-09)

- **Datos de los mocks:** @maria tiene 22 seguidores de ejemplo (`FAN_NAMES` en `fixtures/users.ts`, con su canal personal, así se pueden seguir) más los habituales: 25 en total, para paginar. Las relaciones viven en `fixtures/follows.ts`.
- **Cada página una sola vez:** el scroll y un clic podían pedir la misma página a la vez (llegaba duplicada); `FollowList` recuerda los cursores pedidos.
- **Pestañas:** las de línea de shadcn (`variant="line"`), con `activateOnFocus` (las flechas eligen), y los paneles quedan montados al cambiar (`keepMounted`): no se pierden las páginas ni el scroll.
- **Foco y avisos:** una región `status` siempre montada anuncia "Cargando…", el error y "N más"; al reintentar el foco va a la lista, al cargar la última página va a la primera fila nueva, y al seguir a alguien va a su link (`focusFallbackId`, como las tarjetas).
- **Precisión** se lee "74% de precisión", como en la columna izquierda.

# El grupo como protagonista y botón Unirse — Design

## 1. Cabecera

`CardByline` pasa de una línea (autor primero) a dos:

```
[AC] #acciones · hace 13 h                 (Unirse)
     @jeppe 85 %
```

- **Línea 1:**
  - `UserAvatar` del grupo: `size="sm"` ajustado a `size-6 rounded-md`, con `colorKey = slug`.
  - El handle en `type-small font-bold text-foreground` con `truncate`.
  - `· tiempo` en `type-meta text-muted-foreground`.
  - El botón con `ml-auto shrink-0`.
- **Línea 2:**
  - Va con `pl-8`, alineada con el texto de la línea 1.
  - Lleva `@usuario` en `type-meta` gris, sin negrita, más el chip de accuracy actual (FC-03).
- **Canal personal:** una línea con el `UserAvatar` del autor (`size-6 rounded-full`), `@usuario` en negrita, accuracy y tiempo.
- **Movimiento:** se mantiene el hover del byline (FC-10). El avatar del grupo es el que se agranda.

## 2. Datos

### Tipo de dominio

```ts
// feed.types.ts
export type CardCommunity = CommunityRef & {
  avatarUrl: string | null
  /** The personal channel of a user: no group to show nor to join. */
  personal: boolean
  /** null without a session: the button shows and opens the account modal. */
  viewerIsMember: boolean | null
}
```

`PostItem.community` y `PollItem.community` pasan a `CardCommunity | null`. El chip del feed filtrado sigue con `CommunityRef`.

### Contrato

- `communitySummarySchema` suma `avatarUrl` y `viewerMembership`, **opcionales** hasta que el backend implemente P-010.
- Los mocks de feed los traen, como mock de tipo propuesta.
- Respuesta de unirse: `joinResponseSchema = { viewerMembership, memberCount }` (E02, 200).

### Fallback (CF-12)

`getFeed(params, cursor, { communityResolved, signedIn })` pide en paralelo:

- el feed;
- el grupo filtrado (como hoy);
- `GET /communities` (antes solo cuando había menciones; ahora siempre);
- `GET /communities?mine=true`, si `signedIn`.

Para cada tarjeta, el mapper decide así:

- **Avatar:** `summary.avatarUrl` si vino; si no, el de la lista por id; si no, `null`.
- **Membresía:** `summary.viewerMembership` si vino. Si no, se fija si el id está en `mine`. Sin sesión, `null`.
- **Si `mine` falla:** se toma "no miembro" y el botón aparece. Si el usuario ya era miembro, unirse es idempotente y no pasa nada.

Las dos listas tardan 2 a 5 s en el backend de dev, y el feed tarda 12 a 16 s. Como van en paralelo, no suman tiempo. **Cuando P-010 exista, se borran las dos listas** (menos la de menciones) y su código.

## 3. Unirse

### 3.1 Server Action compartida

`src/lib/communities/join-community.action.ts` (`'use server'`). La usan dos features (feed e interests), que no pueden importarse entre sí. Por eso sube a `lib/` (`structure.md § Reglas de dependencias`).

1. Valida `slug` con zod.
2. `getViewer()`: sin sesión, devuelve `api.errors.UNAUTHENTICATED`.
3. `PUT /api/v1/communities/:slug/members/:userId` con body `{ userId }`. Los dos ids salen de la sesión.
4. Devuelve `ActionResult<{ memberCount }>`.

**No llama a `revalidatePath`:** la action respondería recién después de volver a dibujar todo el feed (12 s con el backend de dev). El refresco lo hace el cliente, sin bloquear (§ 3.2).

### 3.2 Organismo `JoinButton`

En `components/organisms/join/`, junto a su provider.

- `JoinedProvider`:
  - Es un contexto de cliente con un `Set<slug>` de los grupos unidos en esta visita.
  - Se monta en `app/[locale]/layout.tsx`, adentro de `AuthGateProvider`, y así cubre el feed y la columna.
  - Sobrevive a `router.refresh()` porque el layout no se desmonta.
- `JoinButton({ slug, handle, action, variant })`:
  - `action` es la Server Action, que llega por prop. El organismo no conoce el negocio (`design-system.md`).
  - Las variantes se declaran con `cva`:
    - `card`: `h-8 px-3.5 rounded-full bg-primary text-primary-foreground type-action`;
    - `compact`: la píldora gris actual de Suggested, `h-6`.
- Al tocarlo:
  1. `requireAccount('join')`.
  2. Lo agrega al `Set`, con lo que el botón se oculta en todos lados.
  3. Corre la action.
  4. Si sale bien: `startTransition(() => router.refresh())`.
  5. Si falla: lo saca del `Set` y el botón vuelve con un aviso debajo (`role="alert"`, `type-meta text-destructive`), como los votos y las encuestas. Con `UNAUTHENTICATED` abre `openGate('join')`.
- **Foco:** antes de ocultarse, si tenía el foco, lo pasa al título del post. La tarjeta le da `focusTargetId`, y el título recibe `tabIndex={-1}`.
- **Sin toasts:** `sonner` no está instalado y el feed ya muestra sus errores en línea. No se suma una dependencia.

### 3.3 Mock

`PUT /api/v1/communities/:slug/members/:userId`:

- `implemented: true` (el backend ya lo tiene);
- sin sesión responde `401`, con un slug desconocido `404`, y si no responde `200 { viewerMembership: 'MEMBER', memberCount }`;
- no guarda estado, como los votos: con `API_MOCKS=true` el botón vuelve después del refresh. Lo cubre el `Set` del provider mientras no se recargue la página.

## 4. Columna izquierda

`SuggestedCommunities` cambia `GatedComingSoon` por `JoinButton variant="compact"`, que recibe la action desde `InterestsSidebar`. Si el slug está en el `Set`, la fila se oculta, y el refresco la pasa a Groups.

## 5. Mensajes

| Clave           | en            | es                | pt                     |
| --------------- | ------------- | ----------------- | ---------------------- |
| `join.label`    | Join          | Unirse            | Participar             |
| `join.labelFor` | Join {handle} | Unirse a {handle} | Participar de {handle} |

- Namespace `join`, de cliente: va en `CLIENT_NAMESPACES`.
- Se borran `interests.join` e `interests.joinLabel`.

## 6. Performance (CF-15)

`JoinButton` y su provider pesan menos de 1 KB, y reusan `useAuthGate` y el router. Hoy el JS está en 228,1 KB y quedan ~2 KB; sin toasts no se suma ninguna librería.

## 7. Tests

| Qué                                                                                          | Dónde                                 |
| -------------------------------------------------------------------------------------------- | ------------------------------------- |
| Cabecera: grupo arriba, usuario sin foto, canal personal, sistema                            | `card-byline.test.tsx`                |
| Mapper: avatar y membresía desde el summary, desde las listas, sin sesión                    | `mappers.test.ts`, `feed-api.test.ts` |
| Action: slug inválido, sin sesión, `userId` de la sesión, error del backend                  | `join-community.action.test.ts`       |
| Botón: sin sesión abre el modal, optimista en dos botones, revierte y muestra el aviso, foco | `join-button.test.tsx`                |
| Suggested con el botón real                                                                  | `suggested-communities.test.tsx`      |
| E2E: sin sesión → modal; con sesión → desaparece de las tarjetas y de Suggested; 360 px; axe | `e2e/community-join.spec.ts`          |

## 8. Ajustes de la implementación (2026-10-05)

- **Encuestas:** el avatar grande del grupo al lado de la pregunta (FC-02 de `feed-cards`) se va, porque el grupo ya está en la cabecera. La etiqueta POLL pasa a la cabecera, antes del botón Unirse.
- **Error al unirse:** el mensaje es uno solo por idioma (`join.error`). Las claves `api.errors.*` no viajan al cliente.
- **Tests de componentes:** toda tarjeta importa la Server Action, así que sus tests la mockean (`vi.mock('@/lib/communities/join-community.action')`), como pide `testing.md`.
- **`needsMentionLookup`** se borra: `GET /communities` se pide siempre, en paralelo, y también sirve para las menciones.

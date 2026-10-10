# Miembros de una comunidad — Design

> Reusa `specs/follow-lists`: la ventana, la lista paginada y la fila. Lo nuevo es la fuente de datos y el botón del encabezado.

## 1. Datos

- **Contrato** (`src/lib/api/contract/communities.ts`): `communityMemberSchema` = `{ id, username, avatarUrl, role }`, más `isFollowedByViewer` opcional (P-017 ampliada, Q2). `role` se valida pero la UI no lo usa (Q3).
- **`lib/members-api.ts`** (`server-only`): `getMembers(slug, viewerName, cursor?)`. Valida el slug y el cursor antes de la red, `keepValidItems` para ítems rotos y un mapper al tipo de dominio. Reusa `FollowItem`, con `accuracyRate: null`.
- **Action:** `loadFollowList` pasa a `loadPeople`, con un esquema discriminado: `{ list: 'followers' | 'following', userId }` o `{ list: 'members', slug }`. Sigue devolviendo las filas renderizadas en el servidor.

## 2. Componentes

- **`FollowList`** recibe la fuente (`source`) en lugar de `userId` + `kind`; su texto de vacío y el nombre de la lista salen de la fuente. El resto (páginas, cursores pedidos, foco, región de estado) no cambia.
- **`FollowListDialog`**: con una sola fuente, sin `Tabs`; título "Miembros de #macro".
- **`MemberCount`** (servidor) dibuja un botón cliente (`MembersButton`, como `FollowCounts`) con el texto que llega del servidor; la ventana se carga con `next/dynamic` al primer uso, y se precarga al pasar el mouse o enfocar.

## 3. Mocks

- Ruta `GET /api/v1/communities/:slug/members` en `src/mocks/handlers.ts`, `implemented: true` (contrato).
- Fixture: miembros de `#defi` (más de 20) a partir de `FAN_NAMES`, con el creador como `PRINCIPAL_MODERATOR` como manda el backend; los demás grupos, pocos. Cada ítem con `isFollowedByViewer` (P-017).

## 4. Tests

- Unitarios: `getMembers` (validación, mapper, ítems rotos), `loadPeople` (esquema), `FollowList` con la fuente de miembros, el botón del encabezado.
- E2E `e2e/community-members.spec.ts`: abrir desde `#defi`, cargar más, link a un perfil, foco al cerrar, 360 px, axe en claro y oscuro.
- Presupuesto de JS en las páginas de comunidad.

## 5. Ajustes al implementar (2026-10-10)

- `FollowRow` recibe `list` (antes `kind`): el id de la fila, adonde vuelve el foco al seguir, lleva la lista (`follow-members-ana`).
- El panel de miembros no es una parada de Tab: sus filas lo son, y el panel se desplaza con ellas. El de cada pestaña de seguidores sí lo es (`TabsContent`).
- Del `ui-reviewer`: el título de la ventana corta un handle largo (`wrap-anywhere`, `min-h-14`), igual que el título de `EmptyState`; "N miembros" y "N seguidores" agrandan su área táctil a 24 px sin mover la línea; la lista muestra el foco cuando cae en ella después de Reintentar.
- Presupuesto (`seo.md`): páginas de comunidad y activo 236,9 KB (+0,1).

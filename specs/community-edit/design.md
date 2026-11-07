# Editar un grupo — Design

> Basado en `requirements.md` (aprobado el 2026-11-07). Rama `feature/community-edit`, desde `feature/community-create`: reusa su esquema, su recorte, sus imágenes y su mock de `PATCH`.

## 1. Dónde vive

- **Feature:** `features/communities`, junto a "Editar perfil" y a crear un grupo. Lo nuevo va en `components/edit-group/`, `actions/`, `lib/` y `schemas/`.
- **Página:** `app/[locale]/hub/[slug]/page.tsx` compone:
  - el botón en el `moderation` de `CommunityHeader`, al lado de "Edit widgets";
  - la tarjeta de primeros pasos, entre la cabecera y el feed.

## 2. Esquema (`schemas/edit-group.schema.ts`)

Los mismos campos y límites que crear un grupo (CE-02), sin `slug`. `createGroupSchema` se parte en dos:

- `groupFields`: name, description, rules y mainUrl;
- `createGroupSchema = groupFields.extend({ slug })`.

`editGroupChangesSchema = groupFields.partial()`. Un campo vacío pasa como `null`, para borrar lo que había (CE-05). Tiene test propio.

## 3. Lo que la ventana recibe

`EditableGroup` (en `communities.types.ts`): `slug`, `handle`, `name`, `description`, `rules`, `mainUrl` (la URL cruda), `avatarUrl` y `bannerUrl`. Lo arma `toEditableGroup(page)` en `lib/mappers.ts`: solo lo que la ventana muestra (`security.md` § 4).

## 4. El botón y la ventana (CE-01 a CE-05)

- **`EditGroupButton`** (`'use client'`): la píldora "Edit group", con el estilo de "Edit widgets". Carga la ventana con `next/dynamic` al primer uso, como "Editar perfil" (`ssr: false`). Así la primera carga del grupo solo suma el botón (CE-10).
- **Abrir en un campo:** `EditGroupProvider` sostiene la ventana y expone `openOn(field?)` por contexto. El botón y los pasos del checklist la abren, estos últimos en su campo, como `EditProfileProvider`. El provider envuelve la cabecera y el checklist en la página.
- **`EditGroupDialog`:**
  - `Dialog` desde `md` y pantalla completa abajo, igual que "Editar perfil";
  - `react-hook-form` con `zodResolver(groupFields)`;
  - los campos, con `FIELD_BOX` y los contadores de crear un grupo;
  - `ProfileImages` cuadrado y `GroupImageCropper`;
  - el handle como texto, no como campo (Q2).
- **Guardar:**
  1. sube cada imagen nueva con `uploadGroupImage`, que hoy ya hace el `PATCH` de esa imagen;
  2. después llama a `updateGroup` con lo demás que cambió;
  3. cierra, hace `router.refresh()` y muestra el toast "Changes saved" (`notify`).

  Si una imagen falla, la ventana no se cierra y lo dice. Quitar una imagen manda `null` en `updateGroup`.

- **Cancelar con cambios:** el mismo `AlertDialog` de "Editar perfil" (CE-04).

## 5. Guardar (CE-06)

- **`lib/update-group.ts`** (`server-only`): `updateGroupAs(userId, slug, changes)` → `PATCH /api/v1/communities/:slug` con `{ userId, ...changes }`, validado con `communitySchema`.
- **`actions/update-group.action.ts`:**
  1. sesión;
  2. `slug` con `groupSlugSchema` y los cambios con `editGroupChangesSchema`;
  3. `updateGroupAs`;
  4. `revalidatePath('/', 'layout')`, porque el nombre puede estar en la columna izquierda.

  | Fallo               | Resultado                                                     |
  | ------------------- | ------------------------------------------------------------- |
  | `403 NOT_MODERATOR` | `communities.editGroup.errors.notModerator`                   |
  | `422` con `field`   | `fieldErrors[field]` con la clave de ese campo                |
  | `401`               | `api.errors.UNAUTHENTICATED`; la UI abre la ventana de cuenta |
  | Otro                | Su `errorKey`                                                 |

## 6. Primeros pasos (CE-07, CE-08)

- **`lib/group-steps.ts`** (puro, con test): `groupSteps(page, hasPosts)` → `[{ id: 'images' | 'description' | 'rules' | 'post', done }]`. Las imágenes cuentan hechas con foto **o** banner.
- **`hasPosts`:** la página pide la primera página del feed del grupo, sin filtros, con la función del feature `feed` (`app/` puede importar de los dos). Es un request más, porque `CommunityFeed` pide con los filtros de la URL y no está cacheado. Por eso solo se pide si la persona modera el grupo y el checklist no está oculto, en paralelo con el resto de la página.
- **`GroupChecklist`:** Server Component, con `HideableChecklist` para el ✕ y su "Undo".
  - Cada paso sin hacer es un `EditGroupPrompt` (cliente, chico) que abre la ventana en su campo; "el primer post" es un link a `/submit?community={slug}`.
  - Con todo hecho, `null`.
- **Ocultar por grupo:** `HideableChecklist` hoy escribe la cookie del perfil. Suma la prop `cookie`, y con ella `checklist-cookie.ts` pasa a funciones con el nombre como parámetro. La cookie de un grupo es `asinko-group-checklist-{id}`: un año, `samesite=lax`, solo una preferencia de interfaz. El perfil no cambia.

## 7. Mock (CE-11)

`updateCommunity` (`src/mocks/community-create.ts`) acepta también name, description, rules y mainUrl, con los límites de P-048:

- un largo de más es `422 VALIDATION_ERROR` con `field`;
- `null` borra lo que había;
- `slug` se ignora.

Siguen sus tests y los de `fixtures.test.ts`.

## 8. Textos

Namespace `communities.editGroup` (ya está `communities.edit` en `CLIENT_NAMESPACES`; se suma este) y `communities.groupChecklist`. Los rótulos y errores de los campos se reusan de `createGroup`.

## 9. Accesibilidad y performance

- La ventana repite lo de "Editar perfil": foco en el primer campo (o en el campo pedido) y vuelta al botón que la abrió.
- La tarjeta es una `section` con su `h2` y su progreso en texto ("2 of 4").
- **Presupuesto:** la página del grupo mide 239,6 KB y el tope es 241. Entran el botón, el provider, `EditGroupPrompt` y el ✕, y nada más. Se mide en T7 contra `performance.spec.ts`. Si no entra, el checklist se dibuja sin el ✕ cliente y se vuelve a preguntar.

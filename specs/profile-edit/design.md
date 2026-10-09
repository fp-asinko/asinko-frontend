# Editar perfil — Design

## 1. Datos

- **Contrato:** `PATCH /api/v1/users/:userId` con `{ bio }`; responde el `User` (`userSchema`, ya en `contract/users.ts`). Errores: `403 USER_MISMATCH`, `422 BIO_TOO_LONG`.
- **Esquema** `features/communities/schemas/edit-profile.schema.ts`: `bio: z.string().trim().max(160, 'communities.edit.errors.bioTooLong')`. Lo usa el formulario y lo decide la action.
- **Action** `features/communities/actions/update-profile.action.ts`: valida, toma el `userId` de `getViewer()`, llama a `updateProfileAs(userId, { bio })` (`lib/profile-api.ts`, `server-only`) y hace `revalidatePath` de la página del perfil para que el encabezado muestre la bio nueva. Devuelve `ActionResult<{ bio: string | null }>`; los códigos del backend pasan a claves (`BIO_TOO_LONG` → `bioTooLong`).
- **Mock:** ruta `PATCH /api/v1/users/:userId` (`kind: 'contract'`, `implemented: true`): `USER_MISMATCH` si no es el demo, `BIO_TOO_LONG` si pasa 160, y guarda la bio en el perfil demo (en memoria, como los posts creados).

## 2. Componentes

| Pieza               | Dónde                                                               | Notas                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EditProfileButton` | `features/communities/components/edit-profile-button.tsx` (cliente) | Píldora secundaria "Editar perfil" en el lugar de las acciones del encabezado cuando `profile.isSelf`. Carga la ventana con `next/dynamic` al primer toque (y la precarga al pasar el mouse o enfocar, como "+ Crear").                                                                                                                                                                                                     |
| `EditProfileDialog` | `edit-profile-dialog.tsx` (cliente, diferido)                       | `Dialog` de shadcn (Base UI); en mobile, a pantalla completa (las mismas clases que `ComposerWindow`). `react-hook-form` + `zodResolver`, `Field`, `Textarea` con contador `N/160` (`aria-describedby`), Cancelar y Guardar (`aria-disabled` mientras guarda). Cerrar con cambios pide confirmación con el `DiscardDialog` del editor, subido a `components/` si hace falta compartirlo (regla de tres: es la segunda vez). |
| Encabezado          | `community-header.tsx`                                              | `profile.isSelf` → `EditProfileButton` junto a "Crear post"; la bio sigue como hoy (`whitespace-pre-line wrap-anywhere`).                                                                                                                                                                                                                                                                                                   |

## 3. Textos

`communities.edit.button` "Edit profile" · `title` "Edit profile" · `bio` "Bio" · `bioPlaceholder` "Tell people what you analyze" · `counter` "{count}/160" · `save` "Save" · `saving` "Saving…" · `cancel` "Cancel" · `errors.bioTooLong` "Up to 160 characters" · `errors.general` "Could not save. Try again." · `saved` "Profile saved." (anunciado).

## 4. Tests

- Unitarios: esquema, action (sin sesión, `userId` de la sesión, `BIO_TOO_LONG`, éxito), `profile-api` contra el mock, `EditProfileButton` (solo en el propio perfil), `EditProfileDialog` (contador, límite, guardar, cancelar con cambios, error del servidor).
- E2E (`e2e/profile-edit.spec.ts`, con mocks): abrir en `/user/demo`, escribir, guardar y ver la bio en el encabezado sin recargar; no aparece en `/user/maria`; 161 caracteres; 360 px; axe claro y oscuro; presupuesto de JS del perfil.

## 5. Ajustes al implementar (2026-10-09)

- **Refresco:** en lugar de `revalidatePath` en la action, el botón hace `router.refresh()` al guardar: refresca solo la página que se ve, sin invalidar otras rutas.
- **Confirmación de descarte propia:** el `DiscardDialog` del editor de posts vive en otro feature (los features no se importan entre sí). Es la segunda vez que hace falta: la tercera lo sube a `components/molecules/` con los textos por props.
- **Foco:** al cerrar vuelve a "Editar perfil" (`finalFocus`), también en Safari, donde un clic no enfoca el botón.
- **Borde del campo:** uno solo y fino, también cuando la bio es inválida (sin el halo de 3 px, pedido del PO); el error se ve en el borde rojo, el contador en negrita roja y el texto.
- **Guardar** mide 44 px en el teléfono y 36 desde `md`, como Publicar.

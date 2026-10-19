# Borradores y marcas, como Reddit — Design

## 1. Contrato propuesto

**P-022 Borradores** (todo con sesión; `userId` del cuerpo o la query comparado con la sesión, `403 USER_MISMATCH`):

- `GET /api/v1/users/{userId}/drafts` → `{ items: Draft[], nextCursor: null }`, a lo sumo 20, del más reciente (`updatedAt`) al más viejo.
- `POST /api/v1/drafts` `{ userId, communityId?, type, title?, body?, url?, imageUrl?, imageAlt?, tag? }` → `201 Draft`. Con 20, `409 DRAFT_LIMIT`.
- `PATCH /api/v1/drafts/{draftId}` `{ userId, …los mismos campos }` → `Draft`. `404` si no es tuyo o no existe.
- `DELETE /api/v1/drafts/{draftId}?userId=` → `204`.
- `Draft = { id, type, title, body, url, imageUrl, imageAlt, tag, community: CommunitySummary | null, updatedAt }` (los textos `""` si no hay).
- Publicar un borrador es `POST /posts` y después `DELETE /drafts/{id}`, desde el servidor del front.

**P-023 Marcas:** `tags: string[]` en el `Community` (hasta 20, de 1 a 24 caracteres; `[]` si no tiene). `POST /posts` con un `tag` que no está en las de su comunidad: `422 INVALID_TAG`.

Mocks (`kind: 'proposal'`, `implemented: false`): los borradores del usuario demo en memoria; las marcas en los fixtures de las comunidades (grupos y activos con su lista; alguna sin marcas, para el estado deshabilitado).

## 2. Front

- **Contrato:** `draftSchema`, `communitySchema.tags` (opcional, por defecto `[]`).
- **Composer:**
  - `lib/drafts-api.ts` (`server-only`): `listDraftsOf`, `saveDraftAs` (crea o actualiza), `deleteDraftAs`; el mapper a `SavedDraft` (dominio). El `Draft` trae la comunidad como `CommunitySummary`, sin marcas: se pide cada comunidad distinta (`GET /communities/{slug}`, en paralelo) para tener sus marcas; si una falla, queda sin marcas. La imagen pasa por `allowedImageUrl`.
  - Actions (`actions/drafts.action.ts`): `saveDraft`, `listDrafts`, `deleteDraft` (uno ya borrado cuenta como borrado). `createPost(raw, draftId?)`: el id va como segundo argumento, validado aparte (no viaja al backend); si publicó, borra el borrador, y si eso falla el post queda publicado.
  - `createPostSchema` suma `tag` (opcional, hasta 24; vacío no se manda). `saveDraftSchema` aparte: ningún campo obligatorio salvo que haya algo escrito.
  - `CommunityOption` suma `tags`; `toOption` las toma del `Community`.
  - `TagPicker` (organismo del feature): un `DropdownMenu` con las marcas (no un `Combobox`: son pocas y no se buscan). Elegida, queda como `TagPill` con su ×; el foco pasa a la ×, y al quitarla vuelve a "Añadir marca". Sin comunidad o sin marcas, `aria-disabled` con el motivo al lado (`aria-describedby`).
  - `DraftsDialog`: la lista (`N/20`), abrir, eliminar con `AlertDialog`, el estado vacío, reintentar si no carga. `Dialog` en desktop y pantalla completa en el teléfono, como las listas de personas. **No se difiere:** viaja con el editor, que ya se carga al primer uso (`SubmitEditorLoader`); diferirlo de nuevo solo sumaría su entrada al manifiesto de todas las rutas (`seo.md`).
  - `DraftsButton`: "Borradores" al final de la fila de la comunidad (arriba a la derecha del formulario; el título de la página es del servidor). Abrir un borrador con algo escrito pregunta antes (`AlertDialog` "¿Reemplazar lo que escribiste?").
  - `useSavedDraft`: el `draftId` abierto, guardar, el aviso y el error.
  - `PostEditor`: "Guardar borrador" entre Cancelar y Publicar (Cancelar pasa a ser solo texto, para que la jerarquía sea Publicar > Guardar > Cancelar), cargar un borrador (`form.reset`, la comunidad, la marca si la comunidad la tiene y la imagen ya subida en `ImageField` con `initialUrl`, mostrada con `next/image`), la marca. "Borrador guardado" se anuncia en la misma región `status` que el borrador local.
  - **Los relacionados no se guardan en el borrador de la cuenta:** P-022 no tiene el campo. Abrir uno los deja vacíos. El borrador local sí los guarda.
- **Feed:** `PostItem.tag` desde el `Post`; `PostCard` la muestra como píldora antes del título (`TagPill`, molécula: también la usa el editor).

## 3. Tests

- Mocks (con sus errores), esquemas, `drafts-api`, las actions (sesión, `userId` de la sesión, el borrador borrado al publicar), `TagPicker`, `DraftsDialog`, el editor (guardar, abrir, reemplazar con confirmación, límite), `PostCard` con marca.
- E2E (`e2e/drafts-tags.spec.ts`): guardar un borrador, verlo en la lista, abrirlo, publicarlo y que desaparezca; eliminar uno; elegir una marca y verla en el post; sin marcas, el botón deshabilitado; 360 px y axe en claro y oscuro con la ventana abierta; presupuesto de JS.

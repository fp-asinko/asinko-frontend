# Crear un grupo — Design

> Basado en `requirements.md` (aprobado el 2026-11-06, Q1 a Q5 como se recomendaron). Rama `feature/community-create`, desde `develop`.

## 1. Dónde vive

- **Ruta:** `src/app/[locale]/create-group/page.tsx` (Q1). Va fuera de `(main)` y sin `loading.tsx`, como `/submit`: la página resuelve la sesión antes de enviar nada.
- **Columna derecha:** `src/app/[locale]/@right/create-group/page.tsx` dibuja solo un contenedor vacío (`<div id="group-preview-slot">`). El slot es otro árbol de React y no puede leer el estado del formulario, así que el formulario lleva la vista previa ahí con `createPortal` (§ 4).
- **Feature:** `features/communities`, junto a "Editar perfil", que ya tiene las piezas de imágenes. Todo lo nuevo va en `components/create-group/`, `actions/`, `schemas/` y `lib/`.
- **Imports:** la página importa la vista por su ruta, no por el `index` del feature (`seo.md`).

## 2. Esquema (`schemas/create-group.schema.ts`)

Un solo esquema zod, que usan el formulario (con `zodResolver`) y la Server Action:

| Campo         | Regla                                                                                | Error (clave)                       |
| ------------- | ------------------------------------------------------------------------------------ | ----------------------------------- |
| `name`        | `trim`, 3 a 50                                                                       | `createGroup.errors.nameLength`     |
| `slug`        | 3 a 30, `^[a-z0-9]+(?:-[a-z0-9]+)*$`                                                 | `createGroup.errors.slugFormat`     |
| `description` | `trim`, ≤ 500, vacío → `undefined`                                                   | `createGroup.errors.descriptionMax` |
| `rules`       | `trim`, ≤ 2000, vacío → `undefined`                                                  | `createGroup.errors.rulesMax`       |
| `mainUrl`     | vacío → `undefined`; si no, `http(s)` con dominio, ≤ 300 (la misma regla del perfil) | `createGroup.errors.url`            |

Las reglas son más estrictas que las del backend (`^[a-z0-9-]{1,50}$`): todo lo que pasa acá, el backend también lo acepta. Los límites se proponen en **P-048**.

## 3. El handle (CG-05 a CG-07)

- **`lib/slugify.ts`** (puro, con test). `normalize('NFD')` y quitar las marcas diacríticas, pasar a minúsculas, reemplazar por `-` todo lo que no sea `[a-z0-9]`, colapsar los guiones, recortar los de los bordes y cortar en 30 (sin dejar un guion al final).
- **Seguir al nombre:** un `slugTouched` local. Mientras sea `false`, cada cambio del nombre hace `setValue('slug', slugify(name))`. Editar el handle a mano lo pasa a `true`; vaciarlo vuelve a `false`.
- **Disponibilidad:** la acción `check-group-slug.action.ts` → `lib/group-slug.ts` (`server-only`) → `GET /api/v1/communities/:slug`.
  - Un `404` es `free` y un `200` es `taken`.
  - Cualquier otro fallo es `unknown`: no se muestra nada y se reporta como cualquier fallo de la API.
  - Valida el slug con el esquema **antes** de la red (`invalidInput`).
- **En el cliente**, `use-slug-availability.ts`:
  - consulta 400 ms después de la última tecla, y solo con un formato válido;
  - descarta respuestas viejas (compara con el slug actual);
  - como el username de `specs/auth` (`use-username-check.ts`): libre se confirma debajo del campo con ✓ y texto, en una región `aria-live="polite"`; tomado es el error del campo ("Already taken"), que se borra al cambiar el handle.

  No bloquea el botón: el envío es el control final (`409`).

## 4. La página y la vista previa (CG-01 a CG-04, CG-08)

- **`CreateGroupPage`** (Server Component):
  - **Sin sesión:** el mismo `EmptyState` con `GateButtons` de `/submit`, con textos propios.
  - **Con sesión:** el título y el formulario diferido (`next/dynamic`, con un esqueleto del mismo alto, CG-14), como el editor de `/submit`.
- **`CreateGroupForm`** (`'use client'`):
  - `react-hook-form` + `Field` de shadcn, con un `StepTitle` por campo (`n` de 6, `done` según `useWatch`).
  - Los opcionales llevan "(optional)" en el título.
  - Campos rellenos (`FIELD_BOX`, la excepción de los formularios de crear, `design-system.md`). `FIELD_BOX` vive en `features/composer`, así que se sube a `components/molecules/field-styles.ts`, porque los features no se importan entre sí; `editor-styles.ts` lo reexporta.
  - El contador aparece desde el 80 % del tope.
- **Dónde se ve la vista previa:**
  - Desde `lg` (cuando existe la columna derecha del shell), el formulario la dibuja con `createPortal` en `#group-preview-slot`, `sticky` arriba de la columna.
  - Más angosto, va en línea, después del paso ⑥ y antes del botón (Q3), con `lg:hidden`.

  Son dos instancias del mismo componente chico, con los mismos datos. El portal se monta después de hidratar (`useEffect` busca el contenedor), así que en el HTML del servidor solo está la vista previa en línea.

- **`GroupPreview`** (en `features/communities/components/create-group/`: solo lo usa este formulario; sin negocio, con props mínimas: `handle`, `name`, `description`, `avatarUrl`, `bannerUrl`):
  - `IdentityBanner` con `colorKey = slug` (el tono que va a tener, `identityIndex`);
  - el avatar cuadrado redondeado de las páginas de grupo;
  - `#handle` como título, el nombre y la descripción en 3 líneas;
  - debajo, un botón "Joined" deshabilitado, decorativo, que muestra cómo se verá.

  Sin handle todavía, muestra `#your-group` en gris.

## 5. Las imágenes (CG-03.4, Q5)

- **Elegir y recortar:** `ProfileImages` (los botones de cámara sobre el banner y el avatar) y `CropFrame`.
  - `ProfileImages` suma la prop `shape: 'round' | 'square'` (por defecto `round`), `username` pasa a llamarse `colorKey` y suma `name` para las iniciales. El perfil no cambia.
  - El recorte de un grupo **no sube nada**: `GroupImageCropper` (nuevo, en un `Dialog` diferido) usa `CropFrame` + `cropImage` con los mismos tamaños (400×400, 1500×375) y devuelve el `Blob` preparado.
  - El formulario guarda `{ avatar?: Blob, banner?: Blob }` y un `URL.createObjectURL` para la vista previa, que se revoca al cambiar o al desmontar.
- **Subir, después de crear:** la acción `upload-group-image.action.ts` recibe `FormData` con `communityId`, `slug`, `kind` y `file`:
  1. verifica la sesión, el tamaño (`MAX_UPLOAD_BYTES`) y los bytes (`sniffImage`);
  2. `uploadSignedImage('/api/v1/uploads/community-image', { extra: { communityId } })`;
  3. `PATCH /api/v1/communities/:slug` con `{ userId, avatarUrl | bannerUrl }` y la URL **de la respuesta** del `PATCH`, no la subida.

  Va una llamada por imagen: dos imágenes de 4 MB no entran en el límite de 4,5 MB de una Server Action.

## 6. Crear (CG-09 a CG-12)

- **`create-group.action.ts`**:
  1. `getViewer()`; sin sesión, `api.errors.UNAUTHENTICATED`;
  2. `createGroupSchema.safeParse`; si falla, `fieldErrors`;
  3. `lib/create-group.ts` → `POST /api/v1/communities` con `{ userId: viewer.id, ...data }`, mapeado a `{ id, slug }`;
  4. `revalidatePath('/', 'layout')`, para que la columna izquierda sume el grupo (CG-10).

  Devuelve `ActionResult<{ id, slug }>`.

  | Fallo              | Resultado                                                     |
  | ------------------ | ------------------------------------------------------------- |
  | `409 SLUG_TAKEN`   | `fieldErrors.slug = ['createGroup.errors.slugTaken']`         |
  | `422 INVALID_SLUG` | `fieldErrors.slug = ['createGroup.errors.slugFormat']`        |
  | `401`              | `api.errors.UNAUTHENTICATED`; la UI abre la ventana de cuenta |
  | Otro               | Su `errorKey`                                                 |

- **En el cliente** (`use-create-group.ts`): crear, después subir las imágenes una por una, y al final `router.push('/hub/' + slug)`.
  - Si una imagen falla, igual navega y muestra un `toast` de sonner: "The group was created, but its banner could not be saved" (CG-11). `sonner` se carga con el primer aviso (`notify()`, en su propio root), para no sumarlo a la primera carga de ninguna ruta.
  - El botón dice "Creating…" mientras dura todo y queda `aria-disabled`.
  - Un error de campo pone el foco en ese campo (`setFocus`).
- **Salir con cambios (CG-12):** un `beforeunload` mientras el formulario esté `isDirty` y no se haya creado.

## 7. Entrada (CG-01)

`InterestsSections` cambia el `ComingSoon` de "Create group" por un `Link` a `/create-group` con la misma forma.

## 8. Mocks y contrato (CG-15)

- **`POST /api/v1/communities`** (`kind: 'contract'`, `implemented: true`): crea en memoria un `USER_PUBLIC` con `viewerMembership: PRINCIPAL_MODERATOR` y `memberCount: 1`, y lo suma a "mis comunidades".
  - Un slug de los fixtures o ya creado da `409 SLUG_TAKEN`; un slug que no cumple, `422 INVALID_SLUG`.
  - El `GET` por slug y "mis comunidades" ya leen la misma lista.
- **`PATCH /api/v1/communities/:slug`** (`implemented: true`): solo `avatarUrl` y `bannerUrl` para este uso. Si quien llama no es moderador, `403`.
- **`POST /uploads/community-image`** ya existe (P-029). Acepta el grupo recién creado porque el demo es su moderador.
- **Contrato:** el esquema de la respuesta es `communitySchema`. En `docs/references/api/proposals.md` se agrega P-048, con los límites de largo y la pregunta de si `community-image` acepta subir sin `communityId`.

## 9. Textos

Namespace nuevo `createGroup`, en en, es y pt, y en `CLIENT_NAMESPACES`: el formulario es cliente. El `noindex` y la metadata salen de `generateMetadata`.

## 10. Accesibilidad y performance

- Cada campo con su label (el `StepTitle`), los errores en `aria-describedby` y el estado del handle en `aria-live`.
- Las imágenes: los botones de cámara con nombre ("Change group photo"), y el recorte manejable con teclado (`CropFrame`).
- El formulario, el recorte y `zod` van diferidos. La ruta se suma a `e2e/performance.spec.ts` con el tope de 241 KB (subido por el PO el 2026-11-07, `seo.md`).

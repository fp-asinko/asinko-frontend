# Design: flujo de "Editar perfil"

## 1. Imágenes que se guardan solas (EF-02 a EF-05)

- `ImageCropper` ya sube la imagen en **Apply** (`uploadProfileImage`) y devuelve `{ imageUrl, preview }`. El diálogo, en `onApply`, llama a `updateProfile({ avatarUrl })` o `updateProfile({ bannerUrl })` y recién después cierra el recorte. Mientras tanto, el botón del recorte dice "Saving…" (`working` ya existe). Para eso `onApply` pasa a ser `async` y el recorte espera su promesa.
  - **Alternativa descartada:** una action nueva que suba y guarde junto. Duplicaría la validación de `updateProfile` y del upload, sin ganar nada: son dos pedidos igual.
- Si sale bien:
  - La imagen vive en un estado propio del diálogo (`images`), fuera del formulario: nunca lo ensucia ni viaja con Save (EF-05).
  - La vista previa va a `previews`, como hoy.
  - `onSaved()` refresca el perfil de atrás.
  - Una región `role="status"` junto a las imágenes dice "Photo updated" o "Banner updated".
- Si falla (EF-04): el recorte sigue abierto con un error (`errors.imageSave`), y "Back" vuelve sin tocar nada. El upload y el `updateProfile` fallan con el mismo mensaje.
- **Remove** (EF-03): un `AlertDialog` (el mismo componente que "Discard changes?"), y al confirmar, `updateProfile({ avatarUrl: null })`. El resultado se maneja igual que Apply, pero el error se dice junto a las imágenes (`role="alert"`).
- `avatarUrl` y `bannerUrl` dejan de viajar con **Save**: el formulario ya no los marca como sucios.

## 2. Controles sobre las imágenes (EF-01, EF-10)

- `ProfileImages`:
  - Un `DropdownMenu` de shadcn (Base UI, ya está en `components/ui`) por imagen.
  - El disparador es un botón redondo de 36 px, `bg-background/80` con `backdrop-blur`, borde e ícono `CameraIcon`. Va arriba a la derecha del banner y abajo a la derecha de la foto.
  - Su nombre accesible es "Change banner" / "Change photo". El id de siempre (`changeImageId`) sirve para devolverle el foco al volver del recorte y para EF-10.
  - Ítems del menú: "Upload image" (`ImageIcon`) y, si hay imagen, "Remove" (`Trash2Icon`, variante `destructive`).
- El `<input type="file">` oculto queda igual.

## 3. Pie fijo (EF-06 a EF-08)

- **Cabecera:** título a la izquierda y la × a la derecha, en los dos layouts. En el teléfono la × reemplaza a "← Cancel": Cancel ya está en el pie.
- **Pie:** `shrink-0 border-t px-4 py-3 flex justify-end gap-2`, con `pb-[calc(0.75rem+env(safe-area-inset-bottom))]`.
  - Cancel es una píldora `bg-muted`; Save, la píldora negra de hoy.
  - El pie es hermano del `<form>` que scrollea, dentro del `flex-col` del diálogo: no se mueve con el scroll.
  - En el teléfono, el diálogo usa `h-dvh`, así que el pie sube con el teclado en los navegadores que achican el viewport. En iOS, el campo enfocado igual queda visible por el scroll del cuerpo.
- **Save:** `aria-disabled` si `!isDirty || !isValid || isSubmitting || cropping`.
  - `isDirty` alcanza para los links borrados, porque react-hook-form compara contra los valores por defecto. Lo que usa `save()` para armar los cambios sigue igual.
- Mientras el recorte está abierto, el pie se esconde: el recorte tiene sus propios Back y Apply.

## 4. Secciones (EF-09)

- `<section aria-labelledby>` con `<h3 className="type-section text-muted-foreground">`. El título del diálogo es el `h2`.
- **Dos columnas desde `md`** (PO, 2026-10-22):
  - La ventana pasa de 560 a 880 px (`max-w-220`).
  - El cuerpo es una grilla `md:grid-cols-2 gap-x-8`. Profile va a la izquierda; About you y Links, a la derecha, con `md:border-l`.
  - En el teléfono, la línea entre Profile y About you es horizontal (`border-t md:border-t-0`).
  - Medido a 1440×900 y a 1024×768: entra sin scroll. Lo verifica `e2e/profile-edit.spec.ts`.
- Las leyendas que ya existen ("Photo and banner", "Links") pasan a `sr-only` cuando repetirían el título de la sección. "Location" se queda como leyenda del `fieldset`.

## 5. Mensajes nuevos (`communities.edit`)

`sections.profile`, `sections.about`, `sections.links`, `uploadImage`, `remove`, `photoUpdated`, `bannerUpdated`, `removeConfirm.photoTitle`, `removeConfirm.bannerTitle`, `removeConfirm.body`, `removeConfirm.confirm`, `removeConfirm.cancel`, `errors.imageSave`. Se dejan de usar `removePhoto`, `removeBanner` e `images` como texto visible (`images` sigue como leyenda `sr-only`).

## 6. Accesibilidad y movimiento

- El menú, con teclado y foco gestionados por Base UI.
- Al volver del recorte, el foco va al botón de cámara de esa imagen (como hoy, con `changeImageId`).
- El aviso de "updated" es `role="status"`: no mueve el foco.
- El botón de cámara usa `tap`. Sin animaciones nuevas.
- **Sin difuminado durante la animación (EF-12):**
  - `DialogContent` de shadcn recibe `overlay="solid"` (cambio `asinko:`): `bg-black/25` sin `backdrop-blur`; el feature solo nombra la variante.
  - El `backdrop-blur` del fondo se recalculaba en cada cuadro del fade, y con una ventana de 880 px encima se notaba.
  - Los botones de cámara usan `bg-background/90`, sin `backdrop-blur`.
- **react-hook-form y `||`:**
  - `isDirty`, `isValid` e `isSubmitting` se leen en cada render, antes de combinarlos.
  - Con `!isDirty || !isValid`, `isValid` no se lee mientras no hay cambios, y react-hook-form deja de calcularlo.
  - Por eso Save quedaba atenuado después del primer cambio. Lo encontró el test de "Open to".

## 7. Tests

- `edit-profile-images.test.tsx`: menú con Upload y Remove, Remove solo con imagen, nombres accesibles.
- `edit-profile-dialog.test.tsx`:
  - Apply guarda (`updateProfile` con solo `avatarUrl`), anuncia y no deja la ventana sucia.
  - Una falla deja la imagen anterior.
  - Remove confirma y guarda.
  - Save atenuado sin cambios.
  - Cerrar después de cambiar solo la foto no pregunta.
  - Las secciones tienen sus títulos.
- `image-cropper.test.tsx`: espera el `onApply` asíncrono y muestra su error.
- e2e (`e2e/profile-presentation.spec.ts` o uno nuevo): cambiar la foto con el mock y ver que el perfil la muestra sin tocar Save; el pie visible a 360 px; axe con el menú abierto.

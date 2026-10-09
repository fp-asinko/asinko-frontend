# Posts con imagen — Design

## 1. Flujo

```
Elegir / pegar / arrastrar
  → validar tipo (JPEG, PNG, WebP)
  → achicar en el navegador (createImageBitmap + canvas → WebP 0,85, 2048 px)  ← sin EXIF
  → Server Action uploadPostImage(FormData)
       sesión, tipo por los primeros bytes, ≤ 4 MB
       PUT Storage /object/post-images/{userId}/{uuid}.webp con el token del usuario
       ← { imageUrl }
  → vista previa con la imagen subida; Publicar habilitado
  → createPost({ type: 'IMAGE', imageUrl, title, body })  (la action de hoy)
```

- **Por qué el servidor de la app y no el navegador:** el backend pide que suba "el cliente con su sesión". Nuestra sesión es un Bearer que vive en una cookie `HttpOnly` del servidor (`specs/dev-login`): el navegador no puede usarlo. La Server Action sube con ese token, así la política de RLS (`auth.uid()` = carpeta) aplica igual y el token no sale del servidor.
- **Por qué achicar en el navegador:** las Server Actions aceptan hasta 1 MB por defecto y Vercel corta en 4,5 MB. Con `serverActions.bodySizeLimit: '4mb'` (`next.config.ts`) y la imagen ya achicada (una captura de 2048 px en WebP pesa entre 150 y 600 KB), sobra. De paso se borran los metadatos.

## 2. Piezas

| Pieza                                   | Dónde                                                    | Qué                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prepareImage(file)`                    | `src/lib/images/prepare-image.ts` (cliente)              | Tipo permitido, `createImageBitmap(file, { imageOrientation: 'from-image' })`, canvas al tamaño final, `canvas.toBlob('image/webp', 0.85)`. Devuelve `{ blob, width, height }` o un error tipado (`type`, `tooLarge`, `unreadable`).                                                                                   |
| `uploadPostImage`                       | `features/composer/actions/upload-post-image.action.ts`  | Sesión (`getViewer`, `getAccessToken`), `FormData` con `file`, valida tamaño y **firma de bytes** WebP (`RIFF....WEBP`; el tipo que dice el navegador no se cree). Llama a `uploadToStorage`. Devuelve `ActionResult<{ imageUrl }>`.                                                                                   |
| `uploadToStorage` / `removeFromStorage` | `src/lib/storage/post-images.ts` (`server-only`)         | `PUT {SUPABASE_URL}/storage/v1/object/post-images/{path}` con `Authorization: Bearer`, `apikey` (anon) y `Content-Type: image/webp`; timeout de 10 s. La URL pública que arma es la que acepta `isOwnStorageUrl` del backend. Con `API_MOCKS=all` no llama a la red: devuelve una imagen de los fixtures (`/mocks/…`). |
| `ImageField`                            | `features/composer/components/image-field.tsx` (cliente) | Zona para soltar / elegir (`<input type="file" accept="image/jpeg,image/png,image/webp">` oculto detrás del botón), vista previa, "Subiendo…", error con Reintentar, ✕ y Cambiar. Estado: `idle                                                                                                                        | preparing | uploading | ready | error`. |
| `PostEditor`                            | ya existe                                                | Habilita la pestaña `IMAGE`; registra `imageUrl` en el formulario; escucha `paste` y `drop` en el editor (si trae un archivo de imagen, pasa a Imagen y se lo da a `ImageField`). Publicar con `aria-disabled` mientras sube.                                                                                          |
| `createPostSchema`                      | ya existe                                                | `type` suma `IMAGE`; `imageUrl` obligatorio con `IMAGE`, URL `https` (el backend verifica el bucket).                                                                                                                                                                                                                  |

- **Mock** de `POST /posts` acepta `IMAGE` con `imageUrl` y lo devuelve en `media`, como los fixtures de imagen que ya hay.
- **CSP:** la vista previa usa la URL ya subida (Storage, en `img-src` por `REMOTE_IMAGE_HOSTS`) o, mientras sube, un `blob:` (ya permitido).
- **Q1 (recomendado):** al quitar o cambiar la imagen, y al descartar el post, `removePostImage(imageUrl)` (action) borra el archivo, sin esperar ni avisar si falla.

## 3. Textos

`composer.image.drop` "Drag an image here or choose one" · `choose` "Choose image" · `change` "Change" · `remove` "Remove image" · `uploading` "Uploading…" · `retry` "Retry" · `errors.imageType` "Only JPEG, PNG or WebP images" · `errors.imageUpload` "Could not upload the image" · `errors.imageRequired` "Add an image".

## 4. Accesibilidad y movimiento

- La zona de arrastre es el botón "Elegir imagen" grande (`border-dashed`, 44 px mínimo); al arrastrar encima se marca con `bg-surface`.
- El estado va a una región `role="status"` del editor; los errores a `role="alert"`, como los de los campos.
- La vista previa entra con `animate-fade-in`; ✕ con `tap`.

## 5. Tests

- Unitarios: `prepareImage` (achica, WebP, rechaza tipos), `uploadPostImage` (sin sesión, firma inválida, tamaño, éxito con `fetch` falso), `post-images.ts` (URL y headers, mock), `ImageField` (elegir, subir, error y reintentar, quitar), `PostEditor` (pegar y soltar pasan a Imagen; Publicar espera), esquema.
- E2E (`e2e/post-image.spec.ts`, con mocks): elegir un PNG de los fixtures, ver la vista previa, publicar y ver la imagen en el detalle; tipo rechazado; quitar; pegar en desktop; 360 px y axe.

## 6. Ajustes al implementar (2026-10-09)

- **El servidor sube con el token del usuario** desde una Server Action (`uploadPostImageAction`), que lee el tipo de los primeros bytes (WebP o JPEG; no cree el que dice el navegador) y corta en 4 MB con su propio error ("La imagen es demasiado grande").
- **Sin WebP en el navegador** (Safari viejo), `prepareImage` entrega JPEG, que el bucket también acepta.
- **Estados de `ImageField`:** `idle | preparing | uploading | ready | error`. Publicar espera desde que se toma el archivo. Cada archivo es un intento: si llega otro a mitad de subida, el anterior se borra al terminar; si el editor se cierra mientras sube, la subida se borra sola.
- **Foco (WCAG 2.4.3):** al quedar lista va a "Cambiar imagen"; si falla, a Reintentar; al quitarla, a "Elegir imagen". "Imagen lista" se anuncia.
- **Nombres:** la zona se nombra por lo que dice ("Elegir imagen o arrástrala aquí", WCAG 2.5.3), sin etiqueta oculta; "Cambiar" se lee "Cambiar imagen".
- **Pie del editor a 360 px:** los formatos quedan solo con ícono hasta `sm` (el nombre sigue para lectores); con los tres nombres y Publicar no entraban en español.
- **Pegar y soltar** llegan al campo por una función (`takeRef`), con el panel de Imagen siempre montado (`keepMounted`).
- **Publicado en otro formato** con una imagen subida: la imagen se borra igual (Q1).

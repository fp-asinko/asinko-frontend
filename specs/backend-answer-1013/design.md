# Adoptar la respuesta del backend (13/10) — Design

## A. Imágenes (BA-01 a BA-05)

- **`src/features/composer/lib/post-image-upload.ts`** (`server-only`, reemplaza `src/lib/storage/post-images.ts`): `POST /api/v1/uploads/post-image` con `{ userId, contentType, size }` (contrato `postImageUploadSchema`, `src/lib/api/contract/uploads.ts`) y después **nuestro servidor** hace el `PUT` de los bytes a `uploadUrl` (Q1). El `PUT` solo va a nuestro Storage: `https` y el origen de `SUPABASE_URL`; cualquier otra URL se rechaza (el destino lo decide el backend, y así no puede llevar los bytes a otro lado). Timeout de 10 s. Con todas las rutas mockeadas no se envía nada.
- **Errores:** `422` → `composer.errors.imageType`; `401` → el aviso de cuenta; `5xx`, red o `PUT` rechazado → `composer.errors.imageUpload` (se puede reintentar). Los fallos inesperados del `PUT` se reportan a Sentry sin datos personales.
- **Acción `uploadPostImageAction`:** mismos controles que antes (sesión, 4 MB, firma de los bytes), ahora sin token: el cliente de la API ya manda la sesión. Se van `removePostImageAction` y el borrado al cambiar, quitar o descartar (BA-05).
- **`imageAlt` (BA-04):** `createPostSchema` suma `imageAlt` (recortado, hasta 300) y lo manda solo en un post `IMAGE` y solo si se escribió. El editor muestra el campo "Descripción de la imagen (opcional)" debajo de la imagen, cuando ya hay una. El contrato del `Post` suma `imageAlt` (opcional, nullable); `PostMedia` de tipo imagen lleva `alt`, y la tarjeta usa `alt ?? title`. Se va la clave `feed.card.image` ("Imagen adjunta al post").
- **Mocks:** `POST /api/v1/uploads/post-image` (`contract`, `implemented: true`, `src/mocks/post-image.ts`) con las reglas del backend (usuario, tipos, 5 MB); `POST /posts` acepta y devuelve `imageAlt`.

## B. Anuncios (BA-06, BA-07)

- Se van `ads-api.ts`, `with-ads.ts`, `feed-ad.tsx`, `comment-ad.tsx`, `HouseAd`, `CommentNode.ad`, el `offset` de "Cargar más" (solo contaba para los anuncios), el contrato `ads.ts`, el mock `GET /ads`, sus fixtures y los mensajes `postDetail.ad`.
- **`knownKinds`** en `feed-api.ts`: antes de validar, el feed deja afuera en silencio los ítems de un `kind` que no dibuja (hoy `THESIS` y lo que venga, como los anuncios). Un ítem sin `kind` sigue siendo un error de contrato: lo descarta y reporta `keepValidItems`.
- `specs/post-detail-refresh` PD-07 a PD-10, PD-15 y PD-16 quedan marcados como reemplazados.

## C. Símbolos y páginas de activo (BA-08 a BA-10)

- **`assetSymbolSchema`** (`src/lib/communities/asset-symbol.schema.ts`): letra o dígito y después letras, dígitos, `.`, `/` y `-`, hasta 32. `getCommunityPage` acepta un slug o un símbolo. El cliente de la API codifica el parámetro (`XAU%2FUSD`) y `communityPath` ya codificaba el link.
- **`getAssetSummary`** (`features/communities/lib/asset-api.ts`): `GET /assets/{symbol}` → símbolo, nombre, logo (`allowedImageUrl`) y el slug de su comunidad (`linkedCommunity`). El contrato del activo suma `logoUrl` (opcional).
- **`resolveAssetPage`** (`community-route.ts`): la comunidad del activo si existe (como siempre, con sus 308); si no, el activo solo (`{ kind: 'asset' }`), con 308 a su símbolo canónico (en mayúsculas); fuera del catálogo, 404. `/asset/[symbol]/page.tsx` dibuja `AssetWithoutCommunity`: el encabezado de una comunidad (banner, logo, `$SÍMBOLO`, nombre, Volver) sin miembros ni Unirse, y un estado vacío donde va el feed. La metadata usa el símbolo y el nombre.
- **Menciones (BA-10):** después de `$`, el símbolo admite `.` y `/` adentro (empieza con letra o dígito); `#` y `@` siguen igual.
- **Mocks:** `GET /assets/{symbol}` pasa a `implemented: true` (el backend lo tiene); fixtures `TSLA`, `BRK.B` y `XAU/USD` sin comunidad.

## Tests

- Unitarios: `uploadPostImage` (pedido, `PUT`, errores, destino fuera de Storage, mocks), la acción, el editor con la descripción, la tarjeta con `alt`; `knownKinds` en `getFeed`; `assetSymbolSchema`, `getAssetSummary`, `resolveAssetPage`, `activeMention` con `.` y `/`, `AssetWithoutCommunity`.
- E2E: sin anuncios en el feed, el post ni los comentarios; publicar con imagen y su descripción (`post-image.spec.ts`); `/asset/TSLA`, `/asset/BRK.B` y `/asset/XAU%2FUSD` con su página, 308 en minúscula y 404 fuera del catálogo.

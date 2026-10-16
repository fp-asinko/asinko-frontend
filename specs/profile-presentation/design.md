# Presentación del perfil — Design

## 1. Contrato

Ya existe (E01): `displayName`, `bio`, `avatarUrl`, `countryCode` en `PATCH /users/{userId}` y en el perfil. Se proponen en `docs/references/api/proposals.md` y se mockean (tipo "propuesta", `implemented: false`, así con `API_MOCKS=missing` solo esto va al mock):

- **P-019 Titular, ciudad y links:** `headline` (≤100, Q1), `city` (≤60, Q2) y `links: string[]` (≤5, `http(s)`) en el `User` y el `Profile`, editables con `PATCH /users/{userId}`; `422 HEADLINE_TOO_LONG`, `CITY_TOO_LONG`, `INVALID_LINK`, `TOO_MANY_LINKS`.
- **P-020 Banner del usuario:** `bannerUrl` en el `Profile`, editable con `PATCH /users/{userId}` (hoy el banner del perfil es el de su canal personal; que sea el mismo dato).
- **P-021 Subida de foto y banner:** `POST /uploads/avatar` y `POST /uploads/profile-banner`, con el mismo flujo de URL firmada que `POST /uploads/post-image` (P-013): `{ userId, contentType, size }` → `{ uploadUrl, imageUrl, path }`.

## 2. Datos en el front

- `ProfileDetails` suma `headline`, `city`, `countryCode`, `links: ProfileLink[]` y `bannerUrl`. `ProfileLink = { url, host, site }`, donde `site` es `'x' | 'linkedin' | 'youtube' | 'instagram' | 'github' | 'substack' | 'tradingview' | 'web'`, calculado en el mapper (`lib/profile-links.ts`, función pura); un link que no es `http(s)` se descarta al leer.
- El nombre del país, con `Intl.DisplayNames` del idioma de la página (`getFormatter`/`useFormatter` no lo cubren); la lista de países del formulario, la misma fuente sobre los códigos ISO.
- `editProfileSchema` crece con los campos nuevos (los límites como constantes); la action manda solo lo que cambió.
- **Recorte (Q3): `react-easy-crop`** (MIT, TypeScript, sin dependencias, mantenido; se suma a `libraries.md`). Escribirlo a mano (arrastre, zoom con dos dedos y rueda, límites, teclado) pasa largo las ~50 líneas del criterio. Viaja solo con la ventana, que se carga diferida. El área elegida (`croppedAreaPixels`) se corta con un `canvas` (`lib/crop-image.ts`, función pura salvo el canvas) al tamaño final (foto 400×400, banner 1500×375) y pasa por `prepareImage`. Un `input type="range"` con nombre ("Zoom") acompaña al gesto: el teclado y los lectores de pantalla lo usan.
- Imágenes: la preparación de `specs/post-image` (`prepareImage`) y una action `uploadProfileImage(kind)` que sigue el flujo de `post-image-upload.ts` (nuestro servidor hace el PUT, solo al origen de Supabase).

## 3. UI

- `ProfileIntro` (organismo del feature, nuevo): titular, ubicación y links bajo el nombre en `CommunityHeader`. `ProfileLinks` con `components/ui/profile-marks` (los íconos que faltan, como `share-marks.tsx`).
- `EditProfileDialog` crece por secciones (`fieldset` con `legend`); pasa a cargarse con `next/dynamic` si no lo está ya, y su cuerpo scrollea con el pie fijo.
- PP-04: en tu perfil, "Agregá un titular" / "Agregá links" son botones que abren la ventana con el foco en ese campo.

## 4. Tests

- Unitarios: `profile-links` (cada sitio, dominios con `www.`, esquemas rechazados), mapper, esquema (límites, links), action (solo cambios, userId de la sesión, errores por campo), `ProfileIntro`, la ventana (secciones, agregar y quitar links, imagen, errores).
- E2E (`e2e/profile-edit.spec.ts`): editar todo y verlo en el perfil; un link inválido; 360 px y axe en claro y oscuro, con la ventana abierta; presupuesto de JS del perfil.

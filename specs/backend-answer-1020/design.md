# Adoptar la respuesta del backend del 2026-10-20 — Design

## 1. Mocks

En `src/mocks/handlers.ts`, `implemented: true` en las rutas adoptadas (BA-01). `PATCH /users` se parte en dos:

- la ruta propuesta queda solo para `openTo` (P-026, `when`);
- el resto va a la ruta del contrato, que pasa a aceptar titular, ciudad, links, banner y "Acerca de" de 2000, con sus errores.

El mock de `active-communities` cuenta también las tesis y deja afuera el canal personal, como el backend.

## 2. Formas que cambian

- **Destacados (P-025):** `featuredSchema` pasa a `{ kind: 'POST' | 'POLL' | 'THESIS', content, featuredAt }`, con `content` validado por el esquema del feed o de la tesis según `kind`. El mapper (`featured-api.ts`) da los mismos tipos de dominio que hoy. `POST` y `DELETE` mandan `kind` en mayúscula; el "⋯" de una encuesta suma "Destacar".
- **Borradores (P-022):** `draftSchema` suma `createdAt` y `related` (lista de `CommunitySummary`). `saveDraftAs` manda `relatedCommunityIds`. `createPost` manda `draftId` en el body y deja de llamar a `deleteDraftAs`.
- **Posts (P-018):** `postSchema` suma `related` (`CommunitySummary[]`, opcional por compatibilidad con los mocks viejos, `[]` por defecto). El mapper del feed lo pasa al dominio como `{ handle, path }`, con el mismo armado de handle y ruta que "Participa en".
- **Listas (P-017):** el esquema de las filas suma `displayName` y `isFollowedByViewer`.

## 3. Relacionadas al crear (BA-06, BA-08)

Hoy el editor guarda las relacionadas como handles (`#macro`, `$GGAL`) y la action las pega al final del cuerpo.

_Cambio al implementar (2026-10-21): el formulario, su URL (`specs/related-aside` RA-04) y el borrador del navegador siguen con handles. Pasarlos a `{ id, handle }` tocaba los tres sin nada visible._

- `createPostSchema` deja de transformar el cuerpo y conserva los handles.
- `lib/related-communities.ts` (`server-only`) los resuelve a ids en el servidor, justo antes de `POST /posts` o de guardar un borrador:
  - un grupo con `GET /communities/{slug}`, nunca un canal personal;
  - un activo con el `linkedCommunity` de `GET /assets/{symbol}`, nunca con un slug deducido.
- Uno que no existe o no se puede etiquetar se rechaza como el backend: `INVALID_RELATED_COMMUNITY`, que el editor dice con su mensaje de error (donde dice los demás), no bajo el selector.
- Un borrador que ya no existe (`404` con `draftId`, borrado desde otro dispositivo) no frena la publicación: se publica sin él.

## 4. Píldoras de relacionadas (BA-07)

`RelatedPills` (Server Component en `features/feed/components/`): una `<ul>` de píldoras `rounded-full bg-muted type-meta`, con link a cada página, entre el cuerpo y la fila de acciones de `PostCard` y del detalle. Las píldoras no van dentro del link de la tarjeta (`card-link`), para no anidar links. Sin JavaScript: no toca el presupuesto.

## 5. Seguir en las filas (BA-09)

`FollowList` (cliente, dentro de la ventana diferida de las listas) muestra `JoinButton` en su variante compacta con la etiqueta "Seguir", sobre el canal personal de cada persona (`slug` = `username`). Arranca con `isFollowedByViewer` y se suma al estado compartido de membresías, así el botón del perfil y el de la fila dicen lo mismo. `null` (tu fila, o sin sesión): en tu fila no hay botón; sin sesión, el botón pide cuenta (`AuthGate`). La ventana ya es diferida: no suma a la primera carga.

## 6. Activos (BA-10)

- `resolveAssetPage(symbol)` pide primero `GET /assets/{symbol}` y, si trae `linkedCommunity`, `GET /communities/{linkedCommunity.slug}`. Ya no pide `/communities/{symbol}`.
- **Ruta y handle de una comunidad de activo:** salen del **nombre** (`$BRK.B` → símbolo `BRK.B`), no del slug. Un helper en `lib/communities/paths.ts` (`assetSymbolOf`) lo usan "Participa en", las relacionadas, las tarjetas y la cabecera.

## 7. Contrato y propuestas (BA-11, BA-12)

- **Snapshot:** E01 (perfil, listas, subidas), E02 (`linkedCommunity`, miembros), E03 (`related`, destacados, borradores) y E14 (`GET /assets` paginado).
- **`proposals.md`:** "Actualizado el 2026-10-20". En "Adoptado", la lista de lo que sale; en pendientes, P-030, P-028 y P-029, P-026, P-023 y P-014, en ese orden. Se suma una nota: el slug de los activos ya no se deduce del símbolo.
- **Smoke:** encadena las lecturas de destacados, `active-communities`, seguidores y miembros, y `GET /assets/{symbol}` con su `linkedCommunity`.

## 8. Tests

- **Unitarios:**
  - esquemas nuevos y sus mappers (destacados por `kind`, `related`, filas con `isFollowedByViewer`);
  - `createPost` con `draftId` y `relatedCommunityIds`, sin la línea al final;
  - el error de relacionadas;
  - `RelatedPills`;
  - `FollowList` con su botón (tu fila sin botón, `null` pide cuenta);
  - `assetSymbolOf`;
  - `resolveAssetPage` con `linkedCommunity`.
- **E2E:**
  - crear un post con una relacionada → la píldora en la tarjeta y en el detalle, sin la línea en el cuerpo;
  - publicar desde un borrador;
  - Seguir desde una fila de seguidores y verlo en el perfil;
  - destacar una encuesta;
  - axe y 360 px.

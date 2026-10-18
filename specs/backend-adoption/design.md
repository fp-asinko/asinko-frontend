# Adoptar lo que el backend ya tiene — Design

## 1. Mocks (BK-01)

- La ruta mockeada de `?q=` (P-014) pasa a `kind: 'contract'`, `implemented: true`: con `API_MOCKS=missing` va al backend. El resto ya era `implemented: true` (P-016 y P-011 viajan en rutas que el backend tiene); se actualizan sus comentarios, el contrato (`displayName` y `topPost` dejan de ser "propuesta") y `src/mocks/README.md`.

## 2. Contrato (BK-07)

- `src/lib/api/contract/users.ts`: `userContentSchema` (lista estándar de `FeedItem`, el mismo esquema del feed) y `userCommentSchema` (`Comment` + `content: { kind, id, title, community }`).
- `docs/references/api/E01-identidad-y-cuenta.md`: `GET /users/{userId}/content` y `GET /users/{userId}/comments`.
- Mocks de las dos rutas (`kind: 'contract'`, `implemented: true`), desde los fixtures de posts y comentarios.

## 3. El perfil (BK-02 a BK-04)

- `profile-tab.schema.ts`: `posts | replies | theses`.
- Posts: `feed-api.ts` suma `getUserContent(userId, cursor)` (mismo mapeo y "Cargar más" que el feed, con `keepValidItems`); la página de perfil la usa en lugar del feed del canal.
- Respuestas: `features/feed/lib/user-comments-api.ts` (`getUserComments`) y `UserReplies` (organismo del feature `feed`): cada comentario como en un hilo (autor, tiempo, cuerpo con Markdown y menciones), arriba "en _título_" con link a `postPath(id, title)#comment-{id}`. "Cargar más" con una Server Action que devuelve UI renderizada, como el feed.
- `ProfileTabs` suma la pestaña. La página arma cada pestaña dentro de su `Suspense`.

## 4. Precio del activo (BK-05, BK-06)

- `AssetSummary` suma `market: { price, changePct, stale, updatedAt, assetClass } | null`.
- `CommunityDetails` (activo) y `AssetWithoutCommunity` reciben el resumen (la página del activo con comunidad lo pide con `getAssetSummary`, cacheada) y dibujan `AssetMarket`: precio (`format.number`, `currency: 'USD'` salvo `FOREX`), variación con `Delta` (la molécula de las tarjetas de la columna), y si `stale`, "Desactualizado · actualizado el …" con `format.dateTime` (sin fecha, solo "Desactualizado"). La tarjeta del precio va en blanco dentro de la caja gris: el verde de la variación solo da contraste sobre blanco.

## 5. Tests

- Unitarios: mappers y funciones de API (contenido, respuestas, precio), esquema de pestañas, `UserReplies`, `AssetMarket`, el mock de cada ruta (fixtures test).
- E2E: las tres pestañas del perfil y "Cargar más"; una respuesta lleva a su comentario; el activo con precio y desactualizado; axe; presupuesto de JS.

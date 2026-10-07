# Páginas de comunidad, activo y perfil — Design

> **Estado:** aprobado por el PO el 2026-10-07.
> **Referencia visual:** las vistas de grupo (`#WallStreetBets`), activo (`$NVDA`) y perfil (`Jeppe Kirk`) del prototipo. Las tres comparten la estructura: banner, avatar superpuesto, nombre, datos, acción a la derecha, un desplegable, pestañas y el feed.

## 1. Estructura de la página

```
┌───────────────────────────────────────────────┐
│ ← Volver                                      │  banner: imagen, o gradiente del color de identidad
│                                               │  (h-24 mobile, h-30 desde md)
└───────────────────────────────────────────────┘
 [AV]                                              avatar 64 px superpuesto (-mt-8), cuadrado redondeado
 #macro                          (☆) (Unirse)      h1 type-page-title; favorito y unirse/salir a la derecha
 Descripción en type-ui gris (si hay)
 5 miembros
 ┌ Reglas del grupo ▾ ┐ / ┌ Datos del activo ▾ ┐   desplegable (Collapsible de shadcn)
 [composer: "Publicar en el grupo" — Próximamente]   solo /hub, el mismo placeholder del Home
 (Nuevos) (Encuestas)                              los filtros del Home
 tarjetas…                                         el feed del Home, filtrado por la comunidad
```

- **Banner sin imagen:** el gradiente del tono de identidad del slug (`--avatar-N` → `--avatar-N-to`), el mismo del avatar. No suma colores: son tokens existentes (`design-system.md § Color de las tarjetas`).
- **Avatar:** `UserAvatar` en 64 px. Para grupos y activos es un cuadrado redondeado (`rounded-xl`), y su imagen si existe (el logo del activo). Para el perfil, `rounded-full`.
- **"Volver":** `router.back()` si se llegó desde el sitio; si se entró directo, va al Home.
- **Mobile (360 px):** la misma columna. La fila de nombre y acciones se parte en dos si no entra: el nombre arriba y las acciones abajo, alineadas a la izquierda.
- **Sin "posts" en los datos:** el prototipo muestra "18.432 posts", pero el backend no da esa cuenta. Solo se muestran los miembros.

## 2. Rutas

```
src/app/[locale]/
├── hub/[slug]/page.tsx       # comunidad
├── asset/[symbol]/page.tsx   # activo
└── user/[username]/page.tsx  # perfil (parte 2)
```

- **Rutas iguales en todos los idiomas** (CP-01): sin `pathnames` en `routing.ts`, porque no se traducen. `communityPath(kind, slug)` (`lib/communities/paths.ts`) las arma para todos (menciones, columna, páginas). `i18n.md` suma la excepción.
- **Fuera de `(main)` y sin `loading.tsx`** (ajuste de la implementación): cualquier `loading.tsx` por encima de la página, incluido el del Home en `(main)`, empieza a enviar la respuesta con 200 antes de resolver la comunidad. La redirección quedaba en el navegador y el 404 era "blando". Así, la página resuelve la comunidad primero (~0,5 s con Vercel) y responde 308 o 404 reales; el feed se transmite adentro con su `Suspense`.
- **Resolución y redirección** (CP-02), en una función del feature:
  1. Se valida el parámetro con zod (`communitySlugSchema` de `lib/communities`).
  2. `GET /communities/{slug}`. Si da `NOT_FOUND`, `notFound()`.
  3. Si `type` no corresponde a la ruta, `permanentRedirect` a la correcta (`/hub` ↔ `/asset` ↔ `/user`), en el mismo idioma.
- **Mayúsculas:** el backend distingue mayúsculas (`/communities/btc` → 404) y los símbolos son mayúsculas (`BTC`). En `/asset`, un slug en minúscula que no existe se prueba en mayúscula: `/asset/btc` → `/asset/BTC`. Se busca primero tal cual, así `/asset/macro` va a `/hub/macro`.
- **Mocks:** las comunidades de activo de `src/mocks/` pasan a tener el slug en mayúsculas (`BTC`), igual que el backend real. Los tests que usan `?community=btc` se ajustan.

## 3. Datos

Feature nuevo: `src/features/communities/`.

```
features/communities/
├── components/   community-header, community-actions (cliente), favorite-button (cliente),
│                 community-details (reglas / datos del activo), leave-dialog (diferido)
├── lib/          community-api.ts (getCommunityPage), mappers.ts
├── communities.types.ts
└── index.ts
```

- **`getCommunityPage(slug)`** devuelve el tipo de dominio `CommunityPage`, con solo lo que la UI usa: `slug`, `handle`, `name`, `description`, `avatarUrl`, `bannerUrl`, `kind` (`'group' | 'asset' | 'user'`), `memberCount`, `rules`, `mainUrl` (ya filtrado, `security.md § 1`), `viewerMembership` y `viewerIsFavorite`. Las imágenes pasan por `allowedImageUrl`.
- **El contrato** suma `viewerIsFavorite: boolean | null` a `communitySchema` (ya lo manda el backend) y el esquema de la respuesta de favorito.
- **El feed** reusa el del Home: `HomeFeed` con `params.community = slug`. La página no repite el chip de "filtrado por" del Home. **Las tarjetas no muestran Unirse** para la comunidad de la página (CP-07): las tarjetas comparan su slug con `params.community`, que ya llega a "cargar más".
- **Escrituras**, en `lib/communities/` junto a `joinCommunity`, porque las usan la cabecera y las tarjetas:
  - `leaveCommunity(slug)`: `DELETE /communities/{slug}/members/{userId}?userId=`. El `userId` sale de la sesión. Un `403 CANNOT_LEAVE_AS_PRINCIPAL_MODERATOR` vuelve como clave de traducción propia.
  - `setFavorite(slug, value)`: `PUT` / `DELETE /communities/{slug}/favorite` (cuerpo `{ userId }` y query `?userId=` según el contrato E02).
  - Mocks para las dos, que respetan el contrato.

## 4. Acciones de la cabecera (cliente)

- **Unirse:** el `JoinButton` de `community-first`, variante `card`.
- **Salir** (siendo miembro): una píldora gris "Unido", que al tocarla abre la confirmación.
  - El diálogo es el `Dialog` existente, cargado con `next/dynamic` al primer uso (presupuesto de JS): "¿Salir de #macro?", con los botones "Salir" y "Cancelar".
  - Al confirmar: optimista, y vuelve "Unirse".
  - Un `PRINCIPAL_MODERATOR` ve "Moderador" sin acción, con una ayuda: "Transferí el rol para poder salir".
- **Favorito:** botón de ícono (estrella) con `aria-pressed`, optimista, **solo para miembros**: el backend responde `404 NOT_MEMBER` si no lo sos. Al salir de la comunidad, la estrella se va.
- **Estado compartido:** `JoinedProvider` suma `left` (los que dejaste en esta visita), así la cabecera y la columna izquierda se ponen de acuerdo. Después de cada acción, `router.refresh()` en segundo plano, como en `community-first`.

## 5. Desplegables

- **`/hub`:** "Reglas del grupo" con `rules` (texto plano con saltos de línea), cerrado al cargar, y el `mainUrl` como link externo debajo. Si no hay reglas ni link, no se muestra.
- **`/asset`:** "Datos del activo", **abierto** al cargar, con el estado vacío de CP-10: un ícono, "Sin datos de mercado todavía" y "Precio, variación y sentimiento llegan pronto." Sin números.

## 6. Menciones y enlaces (CP-14)

- `hrefFor` en `features/feed/lib/mentions.ts`: `asinko:` sigue siendo el esquema interno; `PostMarkdown` lo traduce a `/asset/{SYMBOL}`, `/hub/{slug}` y `/user/{username}` según el tipo.
- **Cabecera de las tarjetas:** el link del grupo va a `/hub/…` o `/asset/…` según `CardCommunity` (que suma `kind`).
- **Columna izquierda:** activos, grupos y sugeridas van a su página. `CommunityLink` marca la página actual por la ruta (`/hub/macro`) en lugar del query del Home.
- **Personas:** `@usuario` y la lista de personas quedan sin link hasta la parte 2 (perfil). Cuando esa ruta exista, se suman.

## 7. SEO (CP-03)

- `generateMetadata`: título "#macro · Asinko", con la descripción de la comunidad o una genérica traducida, canonical por idioma, `hreflang` con `x-default` (`i18n/alternates`).
- Son rutas dinámicas (nonce de la CSP, como todo el sitio). El sitemap de comunidades queda fuera de esta spec.

## 8. Mensajes (`communities.*`, en/es/pt)

`back`, `members` (plural ICU), `joined`, `leave.title|body|confirm|cancel`, `leave.principal`, `favorite.add|remove`, `rules.title`, `assetData.title|empty|soon`, `meta.description`, `errors.CANNOT_LEAVE_AS_PRINCIPAL_MODERATOR`. Las de cliente (`communities.actions`) van a `CLIENT_NAMESPACES`.

## 9. Performance (CP-18)

- La página es Server Component. Al cliente van solo las acciones de la cabecera (unirse/salir/favorito, menos de 1 KB más allá de `JoinButton`), el diálogo de salir diferido y el feed, que ya está.
- `e2e/performance.spec.ts` suma `/en/hub/macro` y `/en/asset/BTC`.

## 10. Tests

| Qué                                                                                                                                                                | Dónde                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| Mappers: kind por tipo, `mainUrl` filtrado, imágenes permitidas                                                                                                    | `features/communities/lib/mappers.test.ts`   |
| `getCommunityPage`: validación, 404, tipo correcto                                                                                                                 | `community-api.test.ts`                      |
| `leaveCommunity` / `setFavorite`: sesión, `userId` de la sesión, errores                                                                                           | `lib/communities/*.action.test.ts`           |
| Cabecera: datos, gradiente sin banner, sin descripción                                                                                                             | `community-header.test.tsx`                  |
| Acciones: unirse → "Unido" → confirmar salir; principal; favorito; sin sesión                                                                                      | `community-actions.test.tsx`                 |
| Desplegables: reglas y link seguro; estado vacío del activo                                                                                                        | `community-details.test.tsx`                 |
| Menciones a las rutas nuevas                                                                                                                                       | `mentions.test.ts`, `post-markdown.test.tsx` |
| E2E: `/hub/macro`, `/asset/BTC`; redirecciones (`/hub/BTC`, `/asset/btc`); 404; unirse, salir con confirmación y favorito; menciones; 360 px; axe claro/oscuro; JS | `e2e/community-pages.spec.ts`                |

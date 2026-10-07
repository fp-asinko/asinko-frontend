# Páginas de comunidad, activo y perfil — Tasks

## Parte 1: comunidad y activo

- [x] **T-01 (M)** Contrato y mocks:
  - `viewerIsFavorite` en `communitySchema`, y las respuestas de salir y favorito.
  - Mocks de `DELETE …/members/:userId` y `PUT/DELETE …/favorite`.
  - Slugs de activos en mayúsculas en los fixtures, como el backend, y ajuste de los tests que usan `btc`.
  - Tests: `fixtures.test.ts`. → CP-05, CP-06
- [x] **T-02 (S)** `leaveCommunity` y `setFavorite` en `lib/communities/`, con sus tests. → CP-05, CP-06
- [x] **T-03 (M)** Feature `communities`: `getCommunityPage`, mappers y tipos, con validación, 404 y tipo de ruta. Tests. → CP-02, CP-04, CP-08, CP-09
- [x] **T-04 (M)** Rutas `/hub/[slug]` y `/asset/[symbol]` con `pathnames` iguales en los tres idiomas, `loading.tsx`, redirecciones y metadata. Excepción en `i18n.md`. → CP-01, CP-02, CP-03
- [x] **T-05 (M)** Cabecera, acciones (unirse, "Unido" y salir con confirmación diferida, favorito) y desplegables (reglas y datos del activo). Tests. → CP-04 a CP-06, CP-08, CP-10
- [x] **T-06 (S)** Feed propio en la página, sin el Unirse repetido en las tarjetas. Tests. → CP-07
- [x] **T-07 (S)** Menciones, cabecera de las tarjetas y columna izquierda a las rutas nuevas. Tests. → CP-14, CP-15
- [x] **T-08 (M)** E2E `community-pages.spec.ts` (mobile + desktop, axe claro/oscuro), presupuesto de JS y ajustes de los e2e que usaban el Home filtrado. Guías (`i18n.md`, `design-system.md`). → CP-16 a CP-19

## Parte 2: perfil (después, en la misma spec)

- [x] **T-09 (S)** Contrato y mocks: `displayName`, `tier` y `rating` opcionales en el perfil, fixtures, y P-011 en `proposals.md`. → CP-20
- [x] **T-10 (M)** Datos y ruta `/user/[username]`: canal y perfil en paralelo, 404 y redirecciones, metadata. Tests. → CP-11, CP-13
- [x] **T-11 (M)** Cabecera del perfil (título, marcas, estadísticas, "Preguntarle"), variante `user` de las acciones (Seguir/Siguiendo con confirmación, sin estrella y nada en tu propio perfil) y reglas. Tests. → CP-11, CP-12
- [x] **T-12 (S)** `@` a `/user/…` en menciones, cabecera de las tarjetas y "Personas". Tests. → CP-21
- [x] **T-13 (S)** E2E del perfil (mobile + desktop, axe, 360 px), presupuesto de JS. → CP-11 a CP-13, CP-16, CP-18

Orden: T-01 → T-02 y T-03 → T-04 → T-05 y T-06 → T-07 → T-08 → (parte 2) T-09 → T-10 → T-11 y T-12 → T-13.

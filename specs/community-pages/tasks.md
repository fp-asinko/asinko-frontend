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
- [ ] **T-05 (M)** Cabecera, acciones (unirse, "Unido" y salir con confirmación diferida, favorito) y desplegables (reglas y datos del activo). Tests. → CP-04 a CP-06, CP-08, CP-10
- [ ] **T-06 (S)** Feed propio en la página, sin el Unirse repetido en las tarjetas. Tests. → CP-07
- [ ] **T-07 (S)** Menciones, cabecera de las tarjetas y columna izquierda a las rutas nuevas. Tests. → CP-14, CP-15
- [ ] **T-08 (M)** E2E `community-pages.spec.ts` (mobile + desktop, axe claro/oscuro), presupuesto de JS y ajustes de los e2e que usaban el Home filtrado. Guías (`i18n.md`, `design-system.md`). → CP-16 a CP-19

## Parte 2: perfil (después, en la misma spec)

- [ ] **T-09 (M)** `/user/[username]`: perfil con `GET /profiles/{identifier}`, "Seguir" (unirse a su canal), sin el botón en tu propio perfil, y el feed de su canal. Las menciones `@` y la lista de personas pasan a linkear. Tests y e2e. → CP-11 a CP-14

Orden: T-01 → T-02 y T-03 → T-04 → T-05 y T-06 → T-07 → T-08 → (parte 2) T-09.

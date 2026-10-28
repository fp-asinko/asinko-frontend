# Favoritos en grupos, personas y activos — Tasks

Rama: `feature/favorites`, desde `develop`. Se subió a `develop` el 2026-10-28 (PO: "subí a develop estas mejoras").

- [x] **T-01 (M)** Dominio: `favorite` y `channelSlug`, `followedChannels`, `favoritesFirst`. Mocks como el backend. Tests. → FV-01
- [x] **T-02 (M)** `FavoriteStar` en Grupos y Personas; la marca en Activos; la estrella en la cabecera de un perfil seguido. Tests. → FV-02 a FV-04
- [x] **T-03 (S)** e2e: favoritos primero, marcar desde la fila, la cabecera del perfil, axe en claro y oscuro, presupuesto. Ajustar los e2e que buscaban la estrella en toda la página. → FV-01 a FV-05

| Criterio     | Test                                                     |
| ------------ | -------------------------------------------------------- |
| FV-01        | `mappers.test.ts`, e2e `favorites.spec.ts`               |
| FV-02, FV-04 | `favorite-star.test.tsx`, e2e                            |
| FV-03        | `profile-header.test.tsx`, e2e `community-pages.spec.ts` |
| FV-05        | e2e (axe), `performance.spec.ts`                         |

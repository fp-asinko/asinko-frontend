# Activos de la columna izquierda como lista con logo — Tasks

> **Estado:** Aprobada (PO, 2026-11-12): Q1 a Q8 resueltas con la opción recomendada. Basado en `requirements.md` y `design.md` (2026-11-12). Rama `feature/sidebar-assets-list-<descripcion>`, desde `develop`. Cada tarea lleva sus tests; se escribe primero el test que falla (Strict TDD).

## Tareas

- [x] **T1 — Datos: logo y clase del activo (S).**
  - `AssetTile` pasa a `AssetRow` con `logoUrl: string | null` y `assetClass` (Q1); `toAssetTile` pasa a `toAssetRow` con `allowedImageUrl(asset.logoUrl ?? null)`. Se actualizan `interests-api.ts` e `interests-sections.tsx`.
  - `src/mocks/fixtures/assets.ts` devuelve `logoUrl` (design § 1).
  - Tests: `mappers.test.ts` (host permitido, otro host, URL inválida, `undefined`, `assetClass`); `interests-api.test.ts` (el activo llega con su logo; sin precio sigue en la lista); `fixtures.test.ts` (los mocks validan).
  - Cubre: SA-03, SA-15.
  - Depende de: —.
- [x] **T2 — Formato del precio (S).** `lib/format-asset-price.ts`, función pura con la regla de Q1 (design § 3).
  - Tests: `format-asset-price.test.ts` con acción, cripto compacta, bajo 1, índice, par de monedas, y `es` y `pt` (separadores).
  - Cubre: SA-06.
  - Depende de: T1 (el tipo de `assetClass`).
- [x] **T3 — `AssetList` (M).** `components/asset-list.tsx` reemplaza a `asset-tiles.tsx` (design § 2, 3, 4, 6).
  - Fila con `UserAvatar`, símbolo, precio, `Delta`, reloj, "—" sin precio, `FavoriteStar` al lado, escalones 3 / 5 / 8 y "more".
  - Se borra `asset-tiles.tsx` y su test; `interests-sections.tsx` importa `AssetList`.
  - Tests: `asset-list.test.tsx` (SA-01, 02, 04, 05, 07, 08, 09, 10: el nombre accesible, `aria-current`, flecha y texto, fila abierta sin verde ni rojo, favoritos primero, las clases de los escalones, el sin-precio).
  - Cubre: SA-01, SA-02, SA-04, SA-05, SA-07, SA-08, SA-09, SA-10 (clases).
  - Depende de: T1, T2.
- [x] **T4 — Textos (S).** `interests.noPrice` en `en`, `es` y `pt` (`es` y `pt` con el texto en inglés y `TODO(i18n)`, a menos que el PO apruebe copy); `period` pasa a uso solo `sr-only`.
  - Tests: el test de claves entre idiomas; el de `asset-list` verifica el texto.
  - Cubre: SA-07, SA-13.
  - Depende de: —.
- [x] **T5 — Esqueleto (S).** El bloque de activos pasa a 5 filas de `min-h-8` (design § 5); se quita el rótulo y la grilla.
  - Tests: `interests-skeleton.test.tsx` (5 filas, sin grilla, `aria-hidden`).
  - Cubre: SA-11.
  - Depende de: —.
- [ ] **T6 — E2E y alturas (M).** Se reajustan `e2e/sidebar-fill.spec.ts` (alturas de 620 y 420 con el mínimo nuevo, activos en filas, axe en claro y oscuro con los tres casos) y `e2e/sidebar-more.spec.ts` (palabra "tile", última fila con Tab); `e2e/favorites.spec.ts` (lugar de la estrella). Un caso mobile a 360 px sin scroll horizontal. Medición de `e2e/performance.spec.ts` antes y después.
  - Tests: los mismos e2e, en `mobile` y `desktop`.
  - Cubre: SA-10, SA-11, SA-12, SA-13, SA-14.
  - Depende de: T3, T4, T5.
- [ ] **T7 — Documentación (S).**
  - `docs/references/api/E14-primitivas-financieras.md` suma `logoUrl` al objeto `Asset` (tras `pnpm api:smoke`).
  - Notas en `specs/sidebar-fill` (SF-03), `specs/favorites` (FV-02) y `specs/home-motion` (S-02); `design-system.md` ajusta la frase del "mosaico de activo" en Movimiento; `seo.md` anota los KB si cambiaron.
  - Tests: ninguno (documentación); `pnpm format:check`.
  - Cubre: SA-15.
  - Depende de: T6.

## Mapa criterio → test

| Criterio | Test                                                                          | Tarea  |
| -------- | ----------------------------------------------------------------------------- | ------ |
| SA-01    | `asset-list.test.tsx`                                                         | T3     |
| SA-02    | `asset-list.test.tsx`                                                         | T3     |
| SA-03    | `mappers.test.ts`, `asset-list.test.tsx`                                      | T1, T3 |
| SA-04    | `asset-list.test.tsx`                                                         | T3     |
| SA-05    | `asset-list.test.tsx`                                                         | T3     |
| SA-06    | `format-asset-price.test.ts`                                                  | T2     |
| SA-07    | `asset-list.test.tsx`, `interests-api.test.ts`                                | T3, T1 |
| SA-08    | `asset-list.test.tsx`                                                         | T3     |
| SA-09    | `asset-list.test.tsx`, `e2e/favorites.spec.ts`                                | T3, T6 |
| SA-10    | `asset-list.test.tsx`, `e2e/sidebar-fill.spec.ts`, `e2e/sidebar-more.spec.ts` | T3, T6 |
| SA-11    | `interests-skeleton.test.tsx`, `e2e/sidebar-fill.spec.ts`                     | T5, T6 |
| SA-12    | `e2e/sidebar-fill.spec.ts` (mobile)                                           | T6     |
| SA-13    | test de claves de i18n, axe, `tokens-contrast.test.ts`                        | T4, T6 |
| SA-14    | `e2e/performance.spec.ts`                                                     | T6     |
| SA-15    | `fixtures.test.ts`, `pnpm api:smoke`                                          | T1, T7 |

## Antes de la PR

- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test:coverage`, `pnpm test:e2e`.
- Commits convencionales por tarea, con `SPEC: sidebar-assets-list` en el pie.
- Si `SidebarSection` se tocó por otra rama (`action`), se rebasea sobre `develop`; este spec no lo modifica.

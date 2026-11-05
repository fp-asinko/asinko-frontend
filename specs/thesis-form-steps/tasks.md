# El formulario de tesis en pasos, con buscador y carrusel — Tasks

Rama: `feature/thesis-form-steps`, desde `develop`. Requirements con Q1 a Q4 resueltas por el PO el 2026-11-04; requirements, design y tasks aprobados por el PO el 2026-11-04 ("si").

- [x] **T-01 (S)** `StepTitle` y `ScrollRail` en `components/molecules`, con sus tests. → FS-05, FS-08, FS-09
- [x] **T-02 (M)** P-040 en `proposals.md`, el contrato, el mock (`implemented: false`) y `getTopThesisAssets`. Tests y `fixtures.test.ts`. → FS-04, FS-13
- [ ] **T-03 (M)** `AssetSearch`: el combobox de shadcn (Base UI) con búsqueda, teclado, la tarjeta elegida con × y el vacío. Tests. → FS-01 a FS-03
- [ ] **T-04 (M)** `TopAssetsRail` y el layout de la fila: mitad y mitad desde `sm`, debajo en el teléfono, elegir con un toque, el marcado y la falta de datos. La página pasa el ranking. Tests. → FS-04 a FS-07
- [ ] **T-05 (S)** Los seis pasos en el editor, con "completo". Textos en en, es y pt. Tests. → FS-08, FS-09, FS-13
- [ ] **T-06 (M)** E2E: buscar y elegir, elegir del carrusel, 360 px, axe en claro y oscuro, TC-36 y el presupuesto de JS. `ui-reviewer`. `specs/thesis-create` TC-02 y TC-29 apuntan acá. → FS-10 a FS-12

Orden: T-01 → T-02 → T-03 → T-04 → T-05 → T-06. T-02 no depende de T-01.

| Criterio | Test                                                                  |
| -------- | --------------------------------------------------------------------- |
| FS-01    | `asset-search.test.tsx` (escribir, teclado, anuncio)                  |
| FS-02    | `asset-search.test.tsx` (tarjeta, ×, vacío)                           |
| FS-03    | `thesis-editor.test.tsx` (lo de TC-02, TC-03, TC-22 sigue), e2e       |
| FS-04    | `top-assets-rail.test.tsx`, `top-assets.test.ts`, e2e (mitad y mitad) |
| FS-05    | `scroll-rail.test.tsx`                                                |
| FS-06    | `top-assets-rail.test.tsx`, e2e                                       |
| FS-07    | `top-assets-rail.test.tsx` (vacío), `thesis-editor.test.tsx`          |
| FS-08    | `step-title.test.tsx`, `thesis-editor.test.tsx`                       |
| FS-09    | `step-title.test.tsx`, `thesis-editor.test.tsx`                       |
| FS-10    | e2e (360 px, axe, teclado)                                            |
| FS-11    | `performance.spec.ts`                                                 |
| FS-12    | `thesis-create.spec.ts` (TC-36)                                       |
| FS-13    | `fixtures.test.ts`, `messages.test.ts`                                |

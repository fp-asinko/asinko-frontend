# El formulario de tesis en pasos, con buscador y carrusel — Design

> Basado en `requirements.md` (Q1 a Q4 resueltas el 2026-11-04). Rama `feature/thesis-form-steps`, desde `develop`.

## 1. Dónde vive

Todo en `features/composer`, junto al formulario de tesis (`thesis-editor.tsx`). Hay dos piezas reutilizables sin negocio, que van a `components/molecules`:

- **`StepTitle`**: el círculo con el número o el ✓, más el nombre. Recibe `n`, `total`, `done` y `children` (el label).
- **`ScrollRail`**: una fila con scroll horizontal nativo (`overflow-x-auto snap-x`) y flechas ‹ › que aparecen solo si hay más a un lado. Las flechas usan `scrollBy` y un `IntersectionObserver` sobre el primer y el último hijo, sin librería.

## 2. El buscador (`AssetSearch`, FS-01 a FS-03)

- Reemplaza el `CommunityPicker` con `only="assets" variant="card"`. Es un combobox de **Base UI** (`Combobox` de shadcn, si el proyecto lo tiene; si no, el `Command` de shadcn sobre un `Popover`). Se agrega con el CLI, sin escribir el primitivo a mano (`design-system.md`).
- **Búsqueda:** la misma de hoy, `searchCommunities` con `kind: 'assets'`, con un debounce de 200 ms. Sin texto, no lista nada: para eso está el carrusel.
- **Elegido:** el campo se reemplaza por la tarjeta de hoy (logo, símbolo, nombre, precio y variación, TC-29), con un botón × ("Cambiar activo") que vuelve al campo con el foco.
- El editor sigue recibiendo un `CommunityOption` en `chooseAsset`: lo que pasa después de elegir no cambia (FS-03).

## 3. El carrusel (`TopAssetsRail`, FS-04 a FS-07)

- **Datos:** `lib/top-assets.ts` (`server-only`), `getTopThesisAssets()` → `GET /api/v1/theses/top-assets?days=30&limit=10` (P-040). Se mapea a `{ option: CommunityOption, thesisCount }`.
- **Cómo llega al editor:** la página (`submit-page.tsx`) lo pide en el servidor y lo pasa como prop. El editor se carga diferido (`SubmitEditorLoader`), así que el ranking ya está cuando se dibuja, sin un pedido más desde el navegador. Si falla, la página pasa `[]` y el carrusel no aparece (FS-07).
- **Diseño:** cada activo es una píldora `bg-muted` con el avatar de 24 px, el símbolo en negrita y "12 tesis" en gris. El elegido va `bg-primary text-primary-foreground` y con `aria-pressed`. Todo dentro de `ScrollRail`.
- **Tocar uno:** `chooseAsset(option)`, igual que el buscador (FS-06).

## 4. El layout (FS-04, FS-12)

- **Fila del activo:** `grid gap-3 sm:grid-cols-2`. A la izquierda, el buscador o la tarjeta; a la derecha, el carrusel. Sin ranking, la grilla queda en una columna.
- **Pasos:** cada `Field` cambia su `FieldLabel` por `<FieldLabel><StepTitle n={1} total={6} done={!!asset}>Activo</StepTitle></FieldLabel>`. El nombre accesible del campo sigue siendo el nombre, y "Paso 1 de 6" va en `sr-only`.
- **"Completo" (FS-09):**
  - activo: elegido;
  - predicción: escrita;
  - fecha límite: en el rango;
  - objetivo: un número válido;
  - convicción: elegida;
  - razonamiento: escrito.

  Sale de los mismos `useWatch` que ya usa el botón Publicar.

- **El alto:** el círculo va en la misma línea del label, así que no suma altura. El carrusel va al lado del buscador desde `sm`, tampoco suma. Se mide en `thesis-create.spec.ts` (TC-36).
- **Espaciado** (PO, 2026-11-04): 24 px entre pasos y 8 px del título a su campo (antes 16 y 4), para que cada paso se lea como una sección. Si con eso el formulario deja de entrar en 1280×800, gana el espaciado y TC-36 se ajusta.
- **Una sola columna en mobile con `grid-cols-1`** (`minmax(0, 1fr)`): sin columnas declaradas, la implícita crece con las píldoras y el carrusel nunca desborda ni se mueve.

## 5. Propuesta al backend (P-040)

`GET /api/v1/theses/top-assets?days=30&limit=10` → `{ items: [{ community: CommunitySummary, thesisCount: number }] }`:

- las comunidades de activo (`SYSTEM_ASSET`) con más tesis publicadas en los últimos `days` días, de más a menos;
- `days` de 1 a 365, `limit` de 1 a 20;
- cuenta las tesis abiertas y resueltas, no las canceladas.

Se mockea con `implemented: false`: con `missing` va al mock y con `false` el carrusel no aparece. El mock parte de una base por activo (`TOP_ASSETS_BASE`, las 6 comunidades de activos del mock) y le suma lo publicado: con solo las tesis sembradas entraban todas en una fila y el carrusel no tenía qué mover.

## 6. Textos

`composer.thesis.steps` (los seis nombres, "Paso {n} de {total}", "Completo"), `composer.thesis.asset.search` ("Buscá un activo…", "Cambiar activo", sin resultados) y `composer.thesis.topAssets` (título accesible del carrusel, "{count, plural, one {# tesis} other {# tesis}}", las flechas). En en, es y pt.

## 7. Tests

| Qué                                                       | Dónde                                              |
| --------------------------------------------------------- | -------------------------------------------------- |
| `StepTitle` (número, ✓, "Paso n de N")                    | `components/molecules/step-title.test.tsx`         |
| `ScrollRail` (flechas solo si hay más)                    | `components/molecules/scroll-rail.test.tsx`        |
| Buscador: escribir, elegir con teclado, ×, vacío          | `asset-search.test.tsx`                            |
| Carrusel: orden, elegir, marcado, sin datos               | `top-assets-rail.test.tsx`                         |
| `getTopThesisAssets` y el mock contra P-040               | `top-assets.test.ts`, `fixtures.test.ts`           |
| Pasos completos en el editor                              | `thesis-editor.test.tsx`                           |
| Flujo: buscar, elegir del carrusel, 360 px, axe, alto, JS | `e2e/thesis-create.spec.ts`, `performance.spec.ts` |

# Activos de la columna izquierda como lista con logo — Design

> **Estado:** Pendiente de aprobación. Basado en `requirements.md`. Las decisiones que dependen de Q1 a Q8 llevan su opción **recomendada**; si el PO responde otra, se ajusta este documento antes de las tareas.
> Rama de implementación: `feature/sidebar-assets-list-<descripcion>`, desde `develop`.

## 1. Datos: el logo ya viene, falta llevarlo a la UI

Verificado en el código (2026-11-12):

- **Esquema crudo** (`src/lib/api/contract/assets.ts`): `assetSchema` **ya declara** `logoUrl: z.string().nullable().optional()` (comentario: "Crypto with its logo, the rest a monogram, all from Storage (backend 2026-10-13)"). No hace falta tocarlo.
- **Mapper** (`features/interests/lib/mappers.ts`, `toAssetTile`): hoy ignora `logoUrl`. Se agrega `logoUrl: allowedImageUrl(asset.logoUrl ?? null)` (mismo patrón que `avatarUrl` de `toPerson` y `toGroups`, y que `asset-api.ts` del feature `communities`).
- **Tipo de dominio** (`interests.types.ts`): `AssetTile` suma `logoUrl: string | null` y, con Q1 recomendada, `assetClass: RawAsset['assetClass']` (la UI decide `$` y decimales con ella; el esquema crudo ya la trae). Se renombra a **`AssetRow`** y `toAssetTile` a `toAssetRow`: ya no hay mosaicos y `GroupList` / `PeopleList` ya hablan de filas. Cambio mecánico en `interests-api.ts`, `mappers.ts`, `interests.types.ts` e `interests-sections.tsx`.
- **Cliente HTTP:** sin cambios. La respuesta de `GET /assets/:symbol` ya se valida con `assetPageSchema`.
- **Host de imágenes permitido:** `REMOTE_IMAGE_HOSTS` (`src/lib/images.ts`) incluye `hqarefesoovfmibncivu.supabase.co`, y `next.config.ts` arma `images.remotePatterns` desde esa misma lista, con la ruta `/storage/v1/object/public/`. Los logos viven en `…/storage/v1/object/public/asset-logos/…` (incluido `monogram/`), así que `allowedImageUrl` los acepta y `next/image` los carga. **No hay que tocar ni la lista ni `next.config.ts`.** Cuando exista el proyecto Supabase de producción se agrega a esa lista, como ya está previsto para los avatares.
- **Contrato y propuestas:** `docs/references/api/proposals.md` no necesita entrada nueva. La mención de `logoUrl` en la línea ~285 es la **P-041** (`thesis.asset.logoUrl`), otro endpoint. La respuesta del backend del 2026-10-13 (`responses/2026-10-13-backend.md`) y `specs/backend-answer-1013` ya documentan el logo del activo.
- **Inconsistencia a corregir en la documentación:** `docs/references/api/E14-primitivas-financieras.md` no menciona `logoUrl` en el objeto `Asset`. Se agrega en el mismo PR (`api-integration.md § Contrato`), una vez comprobado con `pnpm api:smoke` contra el backend de desarrollo.
- **Mocks:** `src/mocks/fixtures/assets.ts` no devuelve `logoUrl` (`crypto()` no lo pone). Se agrega con la forma del backend, siguiendo lo que hagan hoy los mocks de comunidades para `avatarUrl` (si usan URLs de Storage, estas también; si usan `null`, las iniciales). `fixtures.test.ts` ya valida cada handler contra el esquema.

## 2. Componentes

| Archivo                                                                                 | Cambio                                                                                                                |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `features/interests/components/asset-tiles.tsx` (+ `.test.tsx`)                         | Se reemplaza por `asset-list.tsx` (+ `.test.tsx`): `AssetList({ assets, id })`, junto a `group-list` y `people-list`. |
| `features/interests/components/interests-sections.tsx`                                  | Importa `AssetList`; `{(assets, listId) => <AssetList id={listId} assets={assets} />}`.                               |
| `features/interests/components/interests-skeleton.tsx` (+ test)                         | El bloque de activos pasa a filas (§ 5).                                                                              |
| `features/interests/lib/mappers.ts`, `interests.types.ts`, `interests-api.ts` (+ tests) | § 1.                                                                                                                  |
| `messages/{en,es,pt}.json`                                                              | § 7.                                                                                                                  |
| `src/mocks/fixtures/assets.ts`                                                          | § 1.                                                                                                                  |
| `SidebarSection`                                                                        | **Sin cambios.** El `more`, el `listId` y el contenedor de tamaño son los de hoy.                                     |

**Se reutiliza, no se crea nada nuevo en `components/`** (`design-system.md`: un feature no crea átomos ni moléculas):

- `UserAvatar` (`components/molecules`, Server Component): `name={symbol}` (iniciales y tono de identidad), `imageUrl={logoUrl}`, `size="sm"` con `className="size-6"` (24 px, el mismo truco que `PeopleList` con `size-8`). Con imagen, fondo neutro (los logos redondos no muestran degradé). Redondo por defecto (Q7).
- `Delta` (`components/molecules`): flecha + porcentaje + texto hablado. Sin cambios; recibe `className="type-meta"`.
- `CommunityLink`, `FavoriteOrder`, `FavoriteStar` (`placement="row"`, el valor por defecto): los mismos de `PeopleList`. Ya son hojas cliente de la columna; **no se suma ninguna**.
- `plainHandle(handle)` para el símbolo sin `$`.

### Estructura de la fila

```
<ul id={id} class="flex flex-col gap-0.5 …escalones…">
  <FavoriteOrder itemClassName="group/row flex items-center gap-0.5" rows=… >
    <li>
      <CommunityLink href={path}
        class="group flex min-h-8 min-w-0 flex-1 tap items-center gap-2 rounded-md px-1 py-1 outline-none
               transition-colors duration-150 ease-out hover:bg-surface aria-[current=page]:bg-muted
               focus-visible:ring-3 focus-visible:ring-ring/50
               hover:[&_.text-bullish]:text-foreground hover:[&_.text-bearish]:text-foreground
               aria-[current=page]:[&_.text-bullish]:text-foreground aria-[current=page]:[&_.text-bearish]:text-foreground">
        <UserAvatar … />
        <span class="sr-only">{name}</span>{' '}
        <span class="min-w-0 flex-1 truncate type-small font-bold">{symbol}</span>{' '}
        precio · cambio (§ 3)
      </CommunityLink>
      <FavoriteStar slug={communitySlug} handle="$BTC" initial={favorite} />
    </li>
```

- Las clases van escritas completas (Tailwind solo genera las que encuentra).
- El orden del DOM es el de lectura: logo (decorativo), nombre, símbolo, precio, cambio. Con `{' '}` entre `<span>` para que el nombre accesible no quede pegado (`design-system.md § Mobile first`).
- Server Component por defecto; las hojas cliente son las que ya existen.
- `plainHandle` y los `aria-*` de la fila abierta se copian de `PeopleList` / `AssetTiles` de hoy, sin lógica nueva.

## 3. Precio, cambio y estados de la fila

Columnas a la derecha del símbolo: precio (`type-meta`, `text-muted-foreground`, `tabular-nums`, `text-right`) y cambio (`Delta` con `type-meta`, ancho mínimo fijo `min-w-14`, alineado a la derecha). Los anchos fijos hacen que las columnas queden parejas entre filas; el símbolo (`flex-1 truncate`) cede el espacio.

| Caso                         | Precio                                | Cambio  | Reloj                         | Nombre accesible del link (ejemplo)              |
| ---------------------------- | ------------------------------------- | ------- | ----------------------------- | ------------------------------------------------ |
| Normal                       | formateado (Q1)                       | `Delta` | no                            | `Bitcoin BTC $83.6K up 2.14% 24h`                |
| Desactualizado (Q4)          | formateado                            | `Delta` | sí, a la izquierda del precio | `Bitcoin BTC Outdated price $83.6K up 2.14% 24h` |
| Sin precio (Q3)              | "—" (`aria-hidden`) + texto `sr-only` | no      | solo si `stale`               | `WTI Crude Oil WTI No price yet`                 |
| Cambio nulo, precio presente | formateado                            | no      | según `stale`                 | `… $356.04`                                      |

- **Cambio 0:** `Delta` ya lo muestra como `−` y "unchanged"; no se toca.
- **Período (Q8):** el `24h` (`interests.period`, clave existente) va en un `<span class="sr-only">` después del `Delta`, solo si hay cambio.
- **Reloj:** `ClockAlertIcon` `size-3` en `text-muted-foreground`, con `sr-only` `interests.stale` ("Outdated price"), como hoy.
- **Formato de precio, con `useFormatter().number` (nunca `toLocaleString`)** — Q1 recomendada:

  | Clase del activo               | Estilo                                                                                              |
  | ------------------------------ | --------------------------------------------------------------------------------------------------- |
  | Acción, ETF, cripto, commodity | `currency: USD`; compacto con `maximumFractionDigits: 1` desde 10.000; 4 decimales bajo 1; si no, 2 |
  | Índice                         | decimal, 2 decimales, compacto desde 10.000 (con un decimal)                                        |
  | Par de monedas                 | decimal, 4 decimales, sin símbolo                                                                   |

  La regla vive en una función pura `formatAssetPrice(format, price, assetClass)` en `features/interests/lib/` (testeable sin DOM). Con la alternativa de Q1 ("como hoy + un decimal compacto"), se elimina la tabla y queda la regla actual.

- **Color:** `Delta` usa `text-bullish` / `text-bearish` (tokens semánticos). Verde y rojo solo sobre blanco (`design-system.md § Tokens`): al pasar el mouse (Q6) y en la fila abierta los selectores `…[&_.text-bullish]:text-foreground` los pasan al color del texto; flecha y porcentaje siguen diciendo la dirección. La barra inferior de color del mosaico se elimina.
- **`--faint`** no se usa para texto: el reloj y el precio usan `--muted-foreground` (`design-system.md`). `tokens-contrast.test.ts` ya mide los pares.

## 4. Cuántas filas y "more" (SA-10)

Fila de 32 px (`min-h-8`) más `gap-0.5`: `n` filas ≈ `34n` px (3 → ~102, 5 → ~170, 8 → ~272). Mismo mecanismo de `sidebar-fill` (`specs/sidebar-fill/design.md § 3`): el `ul` esconde los `li` desde un número con `nth-child` y las variantes `column-mid` y `column-tall` de `globals.css` (la columna es un contenedor de tamaño `column`):

```
[&>li:nth-child(n+9)]:hidden            // más de 1200 px de columna: 8
column-tall:[&>li:nth-child(n+6)]:hidden // 960 a 1200: 5
column-mid:[&>li:nth-child(n+4)]:hidden  // menos de 960: 3
group-has-data-[more=open]/section:[&>li]:flex!   // "more" abierto: todas
```

- `hidden` es `display: none`: lo escondido sale del orden de Tab y del lector (SF-06). Las reglas solo suman `hidden`, así que las que coinciden se combinan (gana la más estricta), como en `PeopleList`.
- El panel lateral del teléfono no tiene contenedor `column`: muestra hasta 8 y "more" (como hoy muestra hasta 9).
- Los mínimos de `sidebar-fill § 3` cambian: la fila de 3 mosaicos (85 px) pasa a 3 filas (~102 px); el mínimo de la columna sube ~17 px (a ~704 px). `e2e/sidebar-fill.spec.ts` se reajusta (viewport de 620 y de 420) y la nota se agrega a `specs/sidebar-fill` (SF-03). Con la alternativa 2 / 4 / 6 de Q5, la altura queda igual.
- Si la persona tiene menos de 3 activos, no hay "more" (`MoreToggle` con `empty:hidden`, hoy).

## 5. Esqueleto, error y vacío (SA-11)

- **Error y vacío:** los dibuja `SidebarSection` (`EmptyState` inline); no cambian.
- **Esqueleto** (`interests-skeleton.tsx`, bloque `data-section="assets"`): se quita el rótulo `h-2 w-5` y la grilla. Se dibujan **5 filas** (el escalón medio) con la geometría exacta de la fila real:

  ```
  <div class="flex flex-col gap-0.5 py-1">
    <div class="flex min-h-8 items-center gap-2 px-1 py-1">
      <Skeleton class="size-6 shrink-0 rounded-full" />
      <Skeleton class="h-3.5 w-12" />          {/* símbolo */}
      <Skeleton class="ml-auto h-3 w-12" />    {/* precio */}
      <Skeleton class="h-3 w-10" />            {/* cambio */}
    </div>
  ```

  Mismo alto (32 px) y mismo `gap-0.5` que la lista, así no hay salto al llegar los datos. El esqueleto sigue decorativo (`aria-hidden`).

## 6. Accesibilidad

- El link se nombra por su contenido (§ 3): sin `aria-label` que lo tape. Nada se dice solo por color o ícono: flecha + porcentaje + texto hablado; el reloj, con texto.
- El logo es decorativo (`UserAvatar` ya es `aria-hidden` y con `alt=""`): el nombre y el símbolo están en el texto.
- Foco visible (`focus-visible:ring-3`); la estrella es un botón aparte, ≥ 24 px (`size-7`).
- Movimiento (`design-system.md § Movimiento`): `tap` en el link, el logo crece a `scale-105` en 200 ms con `ease-out` al pasar el mouse (con `hover:`), como `PeopleList`; solo `transform`. El mosaico que subía (S-02) desaparece. `prefers-reduced-motion` ya lo cubre la regla global.
- Axe en claro y oscuro (`e2e/sidebar-fill.spec.ts` ya lo corre; se verifica con activos de los tres casos: normal, desactualizado, sin precio).

## 7. i18n

Claves de `interests` (`messages/{en,es,pt}.json`):

| Clave                 | en                        | es / pt                                                                                        |
| --------------------- | ------------------------- | ---------------------------------------------------------------------------------------------- |
| `period`              | `24h` (existe)            | Existe (`24 h` / `24h`). Pasa de rótulo visible a texto `sr-only`.                             |
| `stale`               | `Outdated price` (existe) | Existe en es y pt.                                                                             |
| `noPrice` **(nueva)** | `No price yet`            | Sin copy aprobado: en es y pt se usa el texto en inglés con `TODO(i18n)` (`i18n.md`, regla 2). |

- El "—" visible no es texto traducible (símbolo tipográfico, `aria-hidden`).
- Los números salen de `useFormatter`; el porcentaje, de `Delta` (ya lo hace).
- `interests` ya está en `CLIENT_NAMESPACES`: el componente es de servidor, no cambia la lista.
- Una clave nueva en los tres archivos: el test que compara claves entre idiomas queda verde.

## 8. Rendimiento y seguridad

- **JS (SA-14):** `AssetList` es un Server Component; `FavoriteOrder`, `FavoriteStar` y `CommunityLink` ya estaban en la columna. `UserAvatar` es de servidor. Sin dependencias ni `'use client'` nuevos, y se elimina el JSX del mosaico. Se mide con `e2e/performance.spec.ts` antes y después; si algún chunk se mueve, se anota en `seo.md` (perfil: ~0,7 KB de margen).
- **Imágenes:** `next/image` con `fill` y `sizes="28px"` (el `px` de `size="sm"` en `UserAvatar`), sin CLS (el contenedor tiene tamaño fijo).
- **Seguridad:** `logoUrl` es una URL de la API: pasa por `allowedImageUrl` (solo `https`, host permitido, ruta `/storage/v1/object/public/`); cualquier otra sale como `null` y se ven las iniciales. A los Client Components (`FavoriteOrder`) llega el nodo ya renderizado en el servidor, no el objeto de la API (`security.md § 4`).

## 9. Plan de tests

| Criterio | Test                                                                                                                                                                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SA-01    | `asset-list.test.tsx`: una lista con un `li` por activo; no hay `24h` visible.                                                                                                                                                                                           |
| SA-02    | `asset-list.test.tsx`: el orden del contenido (logo, símbolo sin `$`, precio, cambio).                                                                                                                                                                                   |
| SA-03    | `mappers.test.ts`: `logoUrl` permitido pasa, uno de otro host, uno inválido y `undefined` dan `null`. `asset-list.test.tsx`: con y sin imagen (iniciales).                                                                                                               |
| SA-04    | `asset-list.test.tsx`: `href` `/asset/BTC`, nombre accesible por contenido, `aria-current` en la ruta activa.                                                                                                                                                            |
| SA-05    | `asset-list.test.tsx`: sube, baja, cero (flecha y texto), y la fila abierta toma el color del texto.                                                                                                                                                                     |
| SA-06    | `format-asset-price.test.ts`: 83584.01 → `$83.6K`, 356.04, 0.5 (4 decimales), índice, par de monedas, cada idioma (`es`: separadores).                                                                                                                                   |
| SA-07    | `asset-list.test.tsx`: sin precio, "—" y "No price yet", sin cambio, mismo link. `interests-api.test.ts`: un activo sin precio sigue en la lista.                                                                                                                        |
| SA-08    | `asset-list.test.tsx`: `stale` muestra el reloj y suma "Outdated price" al nombre.                                                                                                                                                                                       |
| SA-09    | `asset-list.test.tsx`: la estrella (`Remove $BTC from favorites`, `aria-pressed`) y favoritos primero. `e2e/favorites.spec.ts` se ajusta al nuevo lugar de la estrella.                                                                                                  |
| SA-10    | `e2e/sidebar-fill.spec.ts` (1280 × 1100 / 1280 × 620): cantidad de filas visibles y ninguna cortada; `e2e/sidebar-more.spec.ts`: "more" muestra todas y la última se alcanza con Tab (se actualiza el texto "tile"). `asset-list.test.tsx`: las clases de los escalones. |
| SA-11    | `interests-skeleton.test.tsx`: 5 filas de `min-h-8`, sin grilla. `interests-sections.test.tsx`: error y vacío sin cambios. E2E: sin salto de layout (altura de la sección igual antes y después, con tolerancia 0 en un fixture).                                        |
| SA-12    | E2E mobile (360 px): sin scroll horizontal; cada fila ≥ 32 px; Tab recorre links y estrellas.                                                                                                                                                                            |
| SA-13    | `i18n` (test de claves entre idiomas); axe en claro y oscuro en `sidebar-fill.spec.ts`; `tokens-contrast.test.ts` sin cambios.                                                                                                                                           |
| SA-14    | `e2e/performance.spec.ts` sin cambios y en verde; se anotan los KB antes y después.                                                                                                                                                                                      |
| SA-15    | `fixtures.test.ts` (los mocks validan contra el esquema, con `logoUrl`); `pnpm api:smoke` a mano, antes de la PR.                                                                                                                                                        |

Los tests unitarios de `asset-tiles.test.tsx` migran a `asset-list.test.tsx`; ninguno se borra sin reemplazo (el de la estrella, el del nombre accesible y el del reloj siguen vigentes con otro formato).

## 10. Riesgos

- **Alto de la columna:** pasar de 85 a ~102 px en el mínimo mueve el punto donde aparece el scroll (§ 4). Se mide en el build, no a ojo.
- **Logos en CI:** con `API_MOCKS=true` el CI no tiene red al Storage garantizada. Los mocks que usen URLs reales de Storage pueden fallar la carga de imagen en e2e; la regla de § 1 (seguir lo que hacen los mocks de avatares) evita introducir una dependencia nueva de red.
- **Carga de imagen fallida:** si un logo permitido devuelve 404, `next/image` muestra la imagen rota. Igual que hoy con los avatares; queda fuera de alcance (ver `requirements.md`).

# La columna izquierda llena su alto — Design

## 1. Orden (SF-01)

`InterestsSections` pasa a Grupos → "Crear grupo" → Personas → Activos → línea → Sugeridos.

## 2. Sugeridos llena el resto (SF-02)

- `interests-api` pide **8** sugerencias con sesión (hoy 3; sin sesión ya son 8).
- La sección pasa a `flex-1 min-h-0` dentro de la columna, que es una columna flex del alto de la pantalla (`h-full`).
- La lista usa el truco de `flex-wrap`: `flex flex-col flex-wrap content-start overflow-hidden` con el alto que le queda y cada ítem al 100 % del ancho. Un ítem que no entra entero pasa a una segunda columna, fuera de la vista: nunca se ve a medias.
- _Cambio al implementar (2026-10-21):_ lo recortado por el `flex-wrap` seguiría en el teclado, invisible (SF-06), y un escalón por alto no sabe cuánto ocupan las secciones de arriba (depende de cada cuenta). Lo resuelve una molécula cliente mínima, `FitList` (`components/molecules`): con un `ResizeObserver` sobre la lista, pone `hidden` a los ítems que pasaron a la segunda columna, y los vuelve a mostrar cuando entran. Sin JavaScript, el recorte de CSS igual evita los ítems a medias. Es el único JavaScript nuevo, en todas las rutas: se mide con `performance.spec.ts`.
- La sección que llena tiene un mínimo de su título y un ítem entero (`min-h-24`): por debajo, la columna hace scroll (SF-04).
- _Cambio del PO (2026-11-10):_ Sugeridos va **abajo de todo** en la columna. La línea y la sección van en un contenedor `flex-1 justify-end` (mínimo 121 px: línea, título y un ítem), así el espacio que sobra queda arriba. La sección ya no crece: tiene su alto mientras la lista entra y se achica hasta el alto que queda cuando no, y ahí `FitList` deja solo los ítems enteros. Lo verifica `e2e/sidebar-fill.spec.ts` con 1280 × 1800.

## 3. Menos ítems con poco alto (SF-03, SF-04, SF-05)

- La columna es un **contenedor de tamaño** (`container-type: size`, `@container/column`), así que sus secciones preguntan por el alto disponible con `@container (height < …)`. Con zoom, el alto en píxeles CSS baja y las reglas se aplican solas, sin recargar.
- Escalones por el alto del contenedor :

  _Medido en el build (2026-10-21): unos 406 px fijos de títulos, "more", "Crear grupo" y líneas; un grupo 52, una persona 42, una fila de activos 85, una sugerencia 50. Los mínimos piden unos 687 px de columna._

  | Alto de la columna | Grupos | Personas | Activos | Sugeridas                |
  | ------------------ | ------ | -------- | ------- | ------------------------ |
  | menos de 781 px    | 2      | 1        | 1 fila  | las que entran (FitList) |
  | 781 a 960          | 3      | 2        | 1 fila  | las que entran           |
  | 960 a 1200         | 4      | 3        | 2 filas | las que entran           |
  | más de 1200        | 6      | 5        | 3 filas | las que entran           |

- Se aplica en cada lista escondiendo los `li` desde el número que corresponde (`nth-child`), con las variantes `column-short`, `column-mid` y `column-tall` de `globals.css`. El "more" ya está en cada sección.
- Por debajo del mínimo, la columna conserva `overflow-y-auto`: aparece el scroll (SF-04).

### Mínimos nuevos: 3 grupos, 3 personas, 3 activos (PO, 2026-11-12)

El PO pide ver **al menos 3 grupos, 3 personas y 3 activos**.

**Estimación inicial (descartada).** Se calculó con los ~406 px fijos de 2026-10-21 (anteriores a mover "Crear grupo" al encabezado y a pasar los activos a filas): 406 + 3 × 52 + 3 × 42 + 102 + 50 = ~840 px, y de ahí se dedujo que una ventana de 800 px haría scroll. Era una cota sin medir y resultó **alta por unos 170 px**: `e2e/sidebar-fill.spec.ts` lo mostró en CI (el scroll esperado a 800 px no aparecía).

**Medido en el build de producción (2026-11-13, `API_MOCKS=true`, 1280 px de ancho; la columna es el alto de la ventana menos 61 px de la barra superior):**

| Parte                                           | Alto (px)                |
| ----------------------------------------------- | ------------------------ |
| Grupos (3 filas de 50 + título y separaciones)  | 186                      |
| Personas (3 filas de 40 + título)               | 156                      |
| Activos (3 filas de 32 + título + "more")       | 160                      |
| Sugeridos (título + 1 sugerencia de 50)         | 96                       |
| **Contenido total, datos del demo**             | **612** (ventana de 673) |
| Fila de "more" (botón de 24 + 4 de margen)      | 28                       |
| **Contenido total, con "more" en las 3 listas** | **668** (ventana de 729) |

El demo tiene exactamente 3 grupos, 3 personas y 6 activos, así que solo Activos muestra "more". Los 668 px **no se midieron con datos reales de más**: se simularon en el navegador clonando un cuarto ítem y una fila de "more" en Grupos y Personas (la fila de "more" se midió en Activos). Una segunda sugerencia entra desde una columna de unos 780 px (medido con ventanas de 800 y 840 px: 1 y 2 sugerencias); no cambia el mínimo, porque Sugeridos es la última prioridad.

- **Mínimo real:** **612 px** de columna con el demo y **668 px** con 4 o más grupos y personas (3 / 3 / 3 visibles y 1 sugerencia). Antes se estimaban ~840.
- **Consecuencia para una ventana de laptop:** con 800 px de alto la columna mide 739 px, **por encima del mínimo (668): no hace scroll** y muestra los 3 / 3 / 3. El scroll (SF-04) aparece con ventanas de menos de ~673 px (demo) o ~729 px (datos completos). Medido: 560 px y 640 px hacen scroll; 700 px y más, no (con el demo).
- Ninguna sección desaparece y lo escondido sigue en `display: none` (SF-06).

Escalones (siguen siendo los de la estimación de 840 px, ver la nota de abajo; Sugeridos se queda con lo que sobra):

| Alto de la columna | Grupos | Personas | Activos | Sugeridas                |
| ------------------ | ------ | -------- | ------- | ------------------------ |
| menos de 936 px    | 3      | 3        | 3 filas | las que entran (FitList) |
| 936 a 1002         | 4      | 4        | 3 filas | las que entran           |
| 1002 a 1250        | 4      | 4        | 5 filas | las que entran           |
| más de 1250        | 6      | 5        | 8 filas | las que entran           |

(936 = 840 + 52 + 42 + 2; 1002 = 840 + 52 + 42 + 2 × 34; 1250 = 1002 + 2 × 52 + 42 + 3 × 34.)

_Nota (2026-11-13):_ con el mínimo medido de 668 px, cada escalón podría empezar antes (por ejemplo, 4 grupos y 4 personas necesitan 668 + 52 + 42 = ~762 px, y con una segunda sugerencia ~797 px, no 936). No se cambiaron: los umbrales actuales son más altos que lo necesario, así que **nunca** provocan scroll ni rompen los mínimos del PO; solo dejan más aire sobre Sugeridos entre ~670 y 936 px de columna. Moverlos es una decisión de diseño para el PO, no un error.

- Variantes de `globals.css`: `column-short` < 58.5rem (936 px), `column-mid` < 62.625rem (1002 px), `column-tall` < 78.125rem (1250 px). Grupos y personas esconden desde el cuarto (`short`) o el quinto (`tall`); activos desde la cuarta fila (`mid`) o la sexta (`tall`). Los topes de 6 / 5 / 8 no cambian.
- **Esqueleto** (`interests-skeleton.tsx`): 3 grupos, 3 personas y 5 filas de activos, para que al llegar los datos no haya salto de layout.

## 4. Tests

- **Unitarios:** el orden de las secciones en `interests-sections.test.tsx`; 8 sugerencias con sesión en `interests-api.test.ts`.
- **E2E** (`e2e/sidebar-fill.spec.ts`, desktop):
  - con 1280 × 1100, sin scroll en la columna y Sugeridos llega hasta abajo;
  - con 1280 × 620, menos ítems por sección, sin scroll en la columna, y ningún ítem cortado a medias (la caja de cada uno entra entera). _PO, 2026-11-12, corregido con lo medido el 2026-11-13:_ con los mínimos nuevos esto pasa a 1280 × 1000 (menos ítems que a 1100, sin scroll) y 1280 × 800 (columna de 739 px: 3 / 3 / 3 sin scroll; **no** hace scroll, a diferencia de lo estimado);
  - con 1280 × 560 (columna de ~500 px, por debajo del mínimo medido), scroll en la columna y las cuatro secciones presentes;
  - axe en claro y oscuro;
  - el presupuesto de JS sin cambios (`performance.spec.ts`).

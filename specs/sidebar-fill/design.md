# La columna izquierda llena su alto — Design

## 1. Orden (SF-01)

`InterestsSections` pasa a Grupos → "Crear grupo" → Personas → Activos → línea → Sugeridos.

## 2. Sugeridos llena el resto (SF-02)

- `interests-api` pide **8** sugerencias con sesión (hoy 3; sin sesión ya son 8).
- La sección pasa a `flex-1 min-h-0` dentro de la columna, que es una columna flex del alto de la pantalla (`h-full`).
- La lista usa el truco de `flex-wrap`: `flex flex-col flex-wrap content-start overflow-hidden` con el alto que le queda y cada ítem al 100 % del ancho. Un ítem que no entra entero pasa a una segunda columna, fuera de la vista: nunca se ve a medias.
- _Cambio al implementar (2026-10-21):_ lo recortado por el `flex-wrap` seguiría en el teclado, invisible (SF-06), y un escalón por alto no sabe cuánto ocupan las secciones de arriba (depende de cada cuenta). Lo resuelve una molécula cliente mínima, `FitList` (`components/molecules`): con un `ResizeObserver` sobre la lista, pone `hidden` a los ítems que pasaron a la segunda columna, y los vuelve a mostrar cuando entran. Sin JavaScript, el recorte de CSS igual evita los ítems a medias. Es el único JavaScript nuevo, en todas las rutas: se mide con `performance.spec.ts`.
- La sección que llena tiene un mínimo de su título y un ítem entero (`min-h-24`): por debajo, la columna hace scroll (SF-04).

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

- Se aplica con `[&>li:nth-child(n+K)]:hidden` (Tailwind con variantes `@max-[…]/column:`), en cada lista. El "more" ya está en cada sección.
- Por debajo del mínimo, la columna conserva `overflow-y-auto`: aparece el scroll (SF-04).

## 4. Tests

- **Unitarios:** el orden de las secciones en `interests-sections.test.tsx`; 8 sugerencias con sesión en `interests-api.test.ts`.
- **E2E** (`e2e/sidebar-fill.spec.ts`, desktop):
  - con 1280 × 1100, sin scroll en la columna y Sugeridos llega hasta abajo;
  - con 1280 × 620, menos ítems por sección, sin scroll en la columna, y ningún ítem cortado a medias (la caja de cada uno entra entera);
  - con 1280 × 420, scroll en la columna y las cuatro secciones presentes;
  - axe en claro y oscuro;
  - el presupuesto de JS sin cambios (`performance.spec.ts`).

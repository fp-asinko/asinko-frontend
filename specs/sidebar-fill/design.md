# La columna izquierda llena su alto — Design

## 1. Orden (SF-01)

`InterestsSections` pasa a Grupos → "Crear grupo" → Personas → Activos → línea → Sugeridos.

## 2. Sugeridos llena el resto (SF-02)

- `interests-api` pide **8** sugerencias con sesión (hoy 3; sin sesión ya son 8).
- La sección pasa a `flex-1 min-h-0` dentro de la columna, que es una columna flex del alto de la pantalla (`h-full`).
- La lista usa el truco de `flex-wrap`: `flex flex-col flex-wrap content-start overflow-hidden` con el alto que le queda y cada ítem al 100 % del ancho. Un ítem que no entra entero pasa a una segunda columna, fuera de la vista: nunca se ve a medias.
- Para que lo recortado no quede en el teclado (SF-06), lo de la segunda columna no puede ser solo recorte. Se usa la misma escala por alto que en § 3 sobre la lista (container query) para poner `display: none` a los que no entran, y el `flex-wrap` queda como red por si la estimación de un alto falla.

## 3. Menos ítems con poco alto (SF-03, SF-04, SF-05)

- La columna es un **contenedor de tamaño** (`container-type: size`, `@container/column`), así que sus secciones preguntan por el alto disponible con `@container (height < …)`. Con zoom, el alto en píxeles CSS baja y las reglas se aplican solas, sin recargar.
- Escalones por el alto del contenedor (los altos por ítem salen del prototipo: grupo 46 px, persona 42, fila de activos 74, sugerencia 48):

  | Alto de la columna | Grupos | Personas | Activos | Sugeridas   |
  | ------------------ | ------ | -------- | ------- | ----------- |
  | menos de 640 px    | 2      | 1        | 1 fila  | 1           |
  | 640 a 800          | 3      | 2        | 1 fila  | 2           |
  | 800 a 960          | 4      | 3        | 2 filas | según SF-02 |
  | más de 960         | todos  | todos    | todos   | según SF-02 |

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

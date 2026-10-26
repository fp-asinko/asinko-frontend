# Resultados de encuesta en pie 3D — Design

## 1. Sin librería

El pie se dibuja con un SVG propio de menos de ~100 líneas (`libraries.md § Criterio`): no hay librería de gráficos en el stack, y una sumaría peso en todas las rutas con feed.

## 2. `PollPie` (`features/feed/components/poll-pie.tsx`)

Componente cliente que vive dentro de `PollVoting`, que ya es cliente. Recibe `slices: { id, share, tone }[]`, `active` y `onActive(id | null)`.

**Geometría:**

- Una elipse de radio `R` horizontal y `R × 0,6` vertical (el disco visto inclinado), con un espesor de `R × 0,18`.
- Cada porción va de `a0` a `a1`, empezando arriba (−90°) en sentido horario y proporcional a `share`.
- **Cara de arriba:** centro → punto(a0) → arco elíptico → punto(a1). El arco es grande si la porción pasa de 180°.
- **Lado:** solo la parte de la porción que cae en la mitad de adelante (de 0° a 180°). Es el arco de arriba, el mismo arco desplazado hacia abajo por el espesor, y las dos verticales que los unen. Va en el mismo tono, oscurecido con `brightness-75`.
- Se dibujan primero los lados y después las caras: las de arriba tapan los bordes.
- Una sola opción con el 100 %: la elipse entera y su lado de adelante.

**Color (PP-02, PO 2026-10-26):** los 8 tonos de identidad (`--avatar-0…7`), en el orden 0, 6, 2, 4, 3, 7, 1, 5 por puesto (lejos uno del otro, para que dos vecinas se distingan). Cada uno va **tenue y sólido**: `color-mix(in oklab, var(--avatar-N) 55%, var(--background))`. Sin transparencia: al levantar una porción no se ve otra a través (el "triángulo" de la primera versión). Un empate sigue el orden de las opciones. La primera versión era en escala de grises; el PO pidió colores tenues.

**Resaltar (PP-04):**

- Cada porción es un `<g>` con su cara y su lado: se mueve entera.
- La porción activa se corre unos 8 px hacia afuera, en la dirección de su ángulo medio (`translate`, 150 ms `ease-out`).
- Las demás no cambian: atenuarlas se veía como una sombra (PO, 2026-10-26).
- Funciona con `pointerenter`/`pointerleave` en cada porción y en cada fila de la lista; un toque en el teléfono hace lo mismo.

**Entrada (PP-05):** la utilidad `animate-pie-in` (keyframes en `globals.css`) gira el disco desde −25°, lo escala desde 0,92 y lo trae desde opacidad 0, en 500 ms con `--ease-out`. La red global de "reducir movimiento" la anula.

**Accesibilidad (PP-06):** el `svg` lleva `aria-hidden`; la información está en la lista.

## 3. `PollVoting`

- `withPie = shown.options.some((option) => option.share !== null)`.
- El estado `active` se comparte entre el pie y las filas.
- **Con pie:** un contenedor `flex flex-col gap-4 sm:flex-row sm:items-center`, con el pie (`w-44` y alto proporcional; centrado en el teléfono) y la lista `flex-1`.
- **Las filas** mantienen la barra que se llena según el porcentaje (`data-bar`). Suman un cuadradito `size-2.5 rounded-xs` del color de su porción y `bg-muted` cuando están activas. Van **de más a menos votos**: el orden es estable y cada fila tiene su `key`, así que la opción enfocada sigue siendo el mismo elemento.
- **La tarjeta** tiene el mismo relleno que un post (`md:my-1 md:px-3`), como el glosario.
- Lo demás sigue igual: votar, la nota de consenso, tu foto y el pie de la encuesta (votos y cierre).

## 4. Design system

`design-system.md § Encuestas` cambia: con resultados, un pie 3D de colores tenues más la lista como leyenda, con sus barras (`specs/poll-pie`).

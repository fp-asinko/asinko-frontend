# Abrir y cerrar la columna izquierda en todo el sitio — Requirements

> **Estado:** implementado y cerrado el 2026-10-23. Aprobado por el PO el mismo día. Pedido del PO el 2026-10-23, con capturas de Reddit: "traer ese formato al sidebar, de tener el burger flotando y que abra y cierre; además tiene un leve box-shadow cuando está abierto".
> **Respuestas del PO (2026-10-23):**
>
> - La sombra va en **la columna abierta**.
> - Arranca **abierta** en todo el sitio y **se recuerda** si la persona la pliega. La página de crear post sigue arrancando plegada (`specs/submit-tools` ST-08).
> - Plegada queda como **una franja fina**, como Reddit.
>
> **Reemplaza** el botón de plegar de `specs/submit-tools` (ST-08 a ST-09): un solo control en todo el sitio, con el formato de Reddit.

## Objetivo

Que la columna izquierda ("Tus intereses") se pueda cerrar y abrir desde cualquier página, para leer el contenido con más ancho, con un botón que flota sobre su borde como el de Reddit.

## Criterios de aceptación

### El botón

- [x] **SL-01** Desde `md`, un botón redondo con el ícono ☰ flota **sobre el borde derecho** de la columna (centrado en la línea), a la altura de su primer ítem. Es igual en todas las páginas con la columna. Por debajo de `md` no aparece: la columna vive en el panel lateral, como hoy.
- [x] **SL-02** Tocarlo cierra la columna si está abierta y la abre si está cerrada. El botón acompaña el borde: abierta, sobre la línea de la columna; plegada, sobre la línea de la franja.
- [x] **SL-03** El botón es un disclosure: un solo nombre ("Tus intereses", el de la columna) y `aria-expanded` dice si está abierta. Se usa con teclado (Tab, Enter, Espacio) y tiene foco visible. Su área táctil es de al menos 24 × 24 px. El borde y el fondo lo separan del contenido que pasa por debajo, en los dos temas.

### La columna

- [x] **SL-04** **Plegada** queda una franja de unos 32 px con su línea y el botón, nada más: el contenido y la columna derecha ganan ese ancho.
- [x] **SL-05** **Abierta**, se ve como hoy, más una **sombra suave** hacia el contenido. Es la segunda excepción a "sin sombras" del design system (aprobada por el PO el 2026-10-23): un token propio en `globals.css`, en claro y en oscuro.
- [x] **SL-06** Plegada, lo que tenía la columna no se lee ni se alcanza con Tab (no queda solo escondido a la vista).
- [x] **SL-07** Abrir y cerrar se anima como el cajón de hoy en crear post: el ancho se desliza (200 ms al abrir, 150 al cerrar) y el contenido se desvanece sin aplastarse. Sin movimiento con `prefers-reduced-motion`.

- [x] **SL-13** **Cambio con el PO (2026-10-23):** el contenido de la columna termina unos 28 px antes de su línea, como en Reddit: el botón queda en un espacio libre, con un poco de aire, y no tapa nada de la columna.

- [x] **SL-14** **Cambio con el PO (2026-10-23):** si la columna tiene más de lo que entra, su barra de scroll aparece solo al pasar el mouse por encima (o con el foco adentro), fina y en el gris de los bordes, como en Reddit. En pantallas táctiles queda la del sistema.

### Recordarlo

- [x] **SL-08** Arranca **abierta** en todo el sitio. Si la persona la pliega, queda plegada en todas las páginas de ese navegador, también al recargar, hasta que la abra.
- [x] **SL-09** La página de crear post arranca **plegada**, con su propia preferencia, como hoy (ST-08, ST-09 de `specs/submit-tools`).
- [x] **SL-10** La página carga ya en el estado recordado: sin un salto de la columna al cargar (CLS < 0,1, `seo.md`).

### Calidad

- [x] **SL-11** Axe sin violaciones en claro y oscuro, abierta y plegada. Probado a 768 px (`md`), 1024 px (`lg`, con la columna derecha) y 1440 px. A 360 px no cambia nada.
- [x] **SL-12** Presupuesto de JS (`seo.md`): el botón pasa a cargarse en todas las rutas. Se mide antes y después, y la ruta más pesada sigue debajo de 240 KB.

## Fuera de alcance

- Abrir la columna plegada al pasar el mouse por la franja (Reddit lo hace; se propuso y el PO eligió la sombra en la columna abierta).
- El panel lateral del teléfono y la barra inferior.
- Cambiar lo que tiene la columna (`specs/sidebar-fill`).

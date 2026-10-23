# Abrir y cerrar la columna izquierda en todo el sitio — Design

## 1. Dónde vive el estado (SL-08 a SL-10)

**En una cookie, no en `localStorage`.** El servidor la lee y dibuja la página ya abierta o plegada: sin salto al cargar (SL-10). El layout ya es dinámico (nonce de la CSP), así que leer una cookie no cambia nada.

| Cookie                      | Valor    | Para qué                | Default              |
| --------------------------- | -------- | ----------------------- | -------------------- |
| `asinko-left-column`        | `folded` | Todo el sitio           | Abierta (sin cookie) |
| `asinko-left-column-submit` | `open`   | La página de crear post | Plegada (sin cookie) |

- Es una preferencia de presentación, sin datos personales: no es `HttpOnly` (la escribe el navegador), `SameSite=Lax`, `path=/`, un año.
- El valor que el servidor no conoce cuenta como el default.
- La preferencia de crear post que hoy está en `localStorage` (`asinko:left-column:submit`) no se migra: arranca plegada, como alguien nuevo.

## 2. Un botón para todo el sitio, una marca para crear post

**`LeftColumnToggle`** (cliente, `components/organisms/app-shell/left-column-toggle.tsx`) reemplaza a `LeftColumnFold`:

- Lo dibuja `AppShell` en todas las páginas. El layout lee la cookie del sitio y le pasa `folded` a `AppShell`, que se lo pasa al botón como estado inicial.
- Pone `data-left-site="open|folded"` en el botón y escribe la cookie al tocarlo.

**`LeftColumnScope`** (cliente, mismo organismo) es la marca de una página que tiene su propia preferencia:

- La dibuja la página de crear post, con el estado inicial que la página leyó de su cookie: `data-left-scope="open|folded"`, un elemento sin contenido (`hidden`).
- Mientras está montada, el botón del shell manda sobre ella: la lee y la escribe (por un estado compartido mínimo, `useSyncExternalStore`), y escribe la cookie de crear post en vez de la del sitio.

**El CSS decide qué se ve**, con una variante propia en `globals.css`:

```css
/* Plegada: la marca de la página, si hay una; si no, el botón del sitio. */
@custom-variant left-folded (&:where(html:has([data-left-scope='folded']) *, html:not(:has([data-left-scope])):has([data-left-site='folded']) *));
```

Así la primera pintura sale bien también en crear post. El HTML del servidor ya trae las dos marcas con su estado, antes de que cargue el JavaScript. Navegar entre páginas también funciona: la marca aparece y desaparece con la página, y el layout no se vuelve a dibujar.

## 3. El shell (SL-04 a SL-07)

En `AppShell`, desde `md`:

- **Grilla:** `grid-cols-[16.25rem_minmax(0,1fr)]`, y `left-folded:grid-cols-[2rem_minmax(0,1fr)]` (la franja de 32 px, SL-04). Se anima el ancho de la columna como hoy en crear post (200 ms al abrir, 150 al cerrar). Es la excepción de "la altura/el ancho solo en desplegables" que ya aprobó `specs/submit-tools` ST-08b.
- **Columna:** su contenido mantiene su ancho completo (`w-65`) mientras la columna se achica: se recorta, nunca se aplasta. Plegada, ese contenido pasa a `invisible` y `opacity-0`, así no se lee ni se alcanza con Tab (SL-06).
- **Sombra** (SL-05): abierta, `shadow-rail`, un token nuevo:
  - `--rail-shadow` en `:root` y en `.dark`, expuesto en `@theme inline`. Es una sombra corta hacia la derecha: `4px 0 16px -8px` con el color de `--float-shadow`, más suave.
  - Plegada, `left-folded:shadow-none`.
  - La columna suma `z-10`, para que la sombra pase por encima de las tarjetas del centro, que tienen fondo.
  - `design-system.md § Tokens de Asinko` suma la excepción, aprobada por el PO el 2026-10-23.
- **Lo que hoy tiene crear post** (`pt-14`, el espacio reservado para el botón arriba) desaparece: el botón ya no está arriba, está sobre el borde.

## 4. El botón (SL-01 a SL-03)

- Redondo de 32 px (`size-8`), con borde (`border`), fondo `bg-background` y `MenuIcon` de lucide (☰) de 16 px. Hover con `bg-muted`.
- `fixed`, `top-18` (a la altura del primer ítem, debajo de la barra de 60 px), centrado sobre la línea de la columna:
  - plegada, `left-4`: el centro cae en los 32 px de la franja;
  - abierta, `translate-x-57` (228 px): el centro cae en los 260 px de la columna.

  Se mueve con `transform` (200 / 150 ms, como la columna) y la variante `left-folded:` decide la posición. Así sigue a la columna también antes de hidratar.

- `aria-controls="left-column"`, `aria-expanded` y el nombre "Your interests" (`common.leftColumn.label`, que ya existe). `hidden md:inline-flex`.
- **No tapa nada de la columna** (SL-13, pedido del PO el 2026-10-23): el contenido tiene `pr-7`, así termina en los 232 px y el botón empieza en los 244. Quedan 12 px de aire, como en Reddit. Con eso se cumple WCAG 2.4.11 de sobra. La columna pierde 20 px de ancho útil, y `sidebar-fill` lo verifica: nada queda cortado.
- **Antes de hidratar, en crear post**, el botón dice `aria-expanded="true"` (la cookie del sitio) mientras el CSS ya dibuja la columna plegada: unos milisegundos, hasta que la marca de la página se registra. Se acepta (revisión de UI, 2026-10-23).

## 5. Peso (SL-12)

`LeftColumnToggle` pasa a estar en el layout: llega a todas las rutas. Son unas 60 líneas, sin dependencias, más `MenuIcon`. Esperado: unos +0,5 KB. Crear post deja de cargar `LeftColumnFold`, y `LeftColumnScope` es más chico.

## 6. Errores y bordes

| Caso                         | Qué pasa                                                                                                                   |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Cookies bloqueadas           | El botón abre y cierra igual; no se recuerda al recargar.                                                                  |
| Cookie con otro valor        | Cuenta como el default.                                                                                                    |
| Ventana más angosta que `md` | Ni botón ni franja: el panel lateral del teléfono, como hoy.                                                               |
| Plegar con el teclado        | El foco queda en el botón, que es lo que se tocó; lo de la columna sale del orden de Tab al terminar de plegarse (150 ms). |

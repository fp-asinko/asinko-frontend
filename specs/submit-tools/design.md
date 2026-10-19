# Herramientas de la página de crear post — Design

## 1. Barra de formato (ST-04 a ST-06)

- `lib/markdown-format.ts` (función pura): `formatMarkdown(value, selection, kind)` → `{ text, range, select }`, el reemplazo que hay que escribir y qué queda elegido. `kind`: `bold` (`**`), `italic` (`_`), `code` (`` ` ``), `link` (`[texto](https://)`, elige `https://`), `list` (`- ` al principio de cada línea elegida) y `quote` (`> `). Sin selección: las marcas y el cursor en el medio.
- `FormatToolbar` (molécula, `components/molecules/format-toolbar/`): `role="toolbar"` con nombre, foco itinerante (un Tab entra; las flechas, Inicio y Fin recorren), cada botón con `aria-label` y su atajo en `aria-keyshortcuts`. Recibe el campo (`RefObject<HTMLTextAreaElement>`).
- Escribe con `document.execCommand('insertText')` para que Ctrl/⌘ + Z lo deshaga, y si el navegador no lo tiene, con `insertText` (`lib/insert-text.ts`, que no entra en el historial). Los atajos (B, I, K con Ctrl o ⌘) los escucha el cuerpo.

## 2. Vista previa (ST-01 a ST-03)

- En `PostEditor`, `Tabs` de shadcn ("Escribir" / "Vista previa") sobre el cuerpo. En Vista previa el cuerpo se oculta (no se desmonta: lo escrito queda) y la tarjeta ocupa su lugar.
- `previewPost` (Server Action en `features/feed/actions/`, que es dueño de la tarjeta) valida con zod (`title`, `body`, `type`, `url`, `imageUrl`, `imageAlt`, `community` como slug), arma un `PostItem` con la sesión como autor y la comunidad resuelta (`getCommunityPage`), y devuelve la tarjeta **ya renderizada** (`PostCard variant="preview"`), como "Cargar más" del feed: `react-markdown` sigue solo en el servidor (ST-11).
- D-1: antes de pasar el cuerpo a `PostMarkdown`, cada mención que el editor ya reconoce (`mentionSegments`, la misma de MA-12) se vuelve `[@x](asinko:ticker)`: el renderer la pinta en negrita sin link, como una mención sin resolver. Dentro de código no se toca.
- `PostCard variant="preview"`: un `article` (no `CardLink`), el título, el grupo y el autor sin link (`CardByline linked={false}`: nada saca de la página a mitad de un borrador), sin "Unirse", y en lugar de votos, comentarios y compartir, la misma fila en cero, `aria-hidden` y sin botones.
- El editor pide la vista previa al abrir la pestaña (y otra vez si cambió lo escrito), con `useTransition`; mientras, un `Skeleton` del tamaño de una tarjeta.

## 3. Publicar fijo en el teléfono (ST-07)

- La fila de abajo del editor: `sticky bottom-[calc(3.5625rem+env(safe-area-inset-bottom))]` (los 57 px de la barra inferior, medidos) con fondo y borde arriba, `md:static`. El `scroll-padding-bottom` del `html` (globals.css) suma el alto de la fila solo en la página de crear post (`html:has([data-sticky-actions])`).

## 4. Columna izquierda plegable (ST-08, ST-09)

- **Solo la página de crear post paga por esto.** Un primer intento con un organismo cliente en el shell sumaba 0,5 KB a todas las rutas (el detalle de post quedaba a 0,5 KB del tope). En su lugar:
  - `LeftColumnFold` (organismo cliente, `app-shell/left-column-fold.tsx`, importado por su ruta, no por el `index` del shell que importa el layout) es el botón. Lo dibuja `SubmitPage`, fijo sobre la parte de arriba de la columna (a su derecha cuando está abierta). Lleva `data-left-fold="folded" | "open"`, `aria-expanded` y `aria-controls="left-column"`.
  - `AppShell` se pliega **por CSS** mientras ese botón diga `folded`: `html:has([data-left-fold=folded])` angosta la grilla a `3.5rem` y oculta el contenido de la columna (no lo desmonta).
- Con el botón, la franja de arriba (56 px) queda para él y solo scrollea el contenido de abajo: nada pasa por debajo del botón.
- **Animación (ST-08b):** la grilla transiciona `grid-template-columns` (200 ms al abrir, 150 al cerrar, `ease-out`): como el alto de un desplegable, es la excepción a "solo `transform` y `opacity`" de `design-system.md § Movimiento`, porque el centro tiene que ganar el espacio. El contenido mantiene su ancho (`w-65`, recortado por la columna) y pasa por `opacity` + `visibility`; el botón se desliza con `translate` (la transición de `tap`, acortada a 150 ms al cerrar). La regla global de `prefers-reduced-motion` lo deja instantáneo.
- Arranca plegada también en el servidor (`useSyncExternalStore` con snapshot de servidor plegado): el primer dibujo no salta. La elección se guarda en `localStorage` (en `try/catch`).

## 5. Tests

- Unitarios: `formatMarkdown` (cada tipo, con y sin selección, varias líneas), `FormatToolbar` (botones, flechas, atajos), `previewPost` (validación, sesión, menciones en negrita sin link), `PostCard variant="preview"`, el editor (pestañas, vuelve con lo escrito, error), `LeftColumnFold` (arranca plegada, se recuerda, modo privado).
- E2E (`e2e/submit-page.spec.ts`): formatear con la barra y con Ctrl+B; la vista previa muestra el Markdown; a 360 px la fila queda a la vista con un cuerpo largo; desde `md`, la columna plegada y desplegada; axe en claro y oscuro. Presupuesto de JS.

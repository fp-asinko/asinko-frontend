# Hilos de comentarios como Reddit — Design

## 1. Lo medido en Reddit (2026-10-08, 1280 px)

| Pieza              | Reddit                                                                                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Columna del avatar | `grid-cols-[32px_1fr]` (24 px en pantallas chicas); avatar 32 × 32                                                                              |
| Autor / fecha      | 12 px / 16 px, autor 700, fecha regular gris, "•" entre los dos; 8 px a la izquierda                                                            |
| Cuerpo             | 14 px / 20 px, empieza 4 px debajo del avatar                                                                                                   |
| Acciones           | fila de 32 px; flechas 32 × 32; Reply / Share 12 px 600 con ícono, píldora sin fondo, `px-sm`                                                   |
| Línea vertical     | 1 px, `rgb(228 228 228)`, centrada en la columna, desde 4 px debajo del avatar hasta el fondo del hilo                                          |
| Codo de cada hijo  | `::after` del hijo: `left: -16.5px; top: 0; width: 16.5px; height: 16px`, borde izquierdo e inferior de 1 px, `border-bottom-left-radius: 12px` |
| ⊖                  | ícono 16 px `subtract-circle`, fila 2 de la columna (la de las acciones), `mt-[6px]`, fondo blanco                                              |
| Cerrado            | ⊕ `add-circle` en lugar del avatar; queda la línea del autor                                                                                    |
| Franja clickeable  | 32 px de ancho sobre la línea, `cursor-pointer`                                                                                                 |
| Entre comentarios  | 4 px                                                                                                                                            |

Nuestro gris para la línea es `--border` (`#E5E8EB`, casi el mismo); hover `--border-strong`.

## 2. Estructura

`CommentItem` (servidor) pasa a una grilla como la de Reddit:

```
<li id="comment-{id}" class="relative">            ← codo (::after) si tiene padre
  <CommentFold label open>                          ← cliente: estado abierto/cerrado
    fila 1: [avatar | ⊕]   autor • fecha
    fila 2: [⊖ sobre la línea]   cuerpo + acciones (CommentReply + Share)
    fila 3: [línea + franja]   <ul> respuestas, cada <li> con su codo
  </CommentFold>
</li>
```

- **`CommentFold`** (`features/feed/components/comment-fold.tsx`, `'use client'`): recibe las tres filas como `ReactNode` desde el servidor (el Markdown sigue sin llegar al navegador). Guarda `open` con `useState`; cerrado, no renderiza el cuerpo, las acciones ni las respuestas, y muestra ⊕ en la columna del avatar. Sin `Collapsible` (Reddit no anima el cierre, y es más JS): un `hidden` en las filas 2 y 3.
- **Línea y codos con CSS**, en `globals.css` como utilidades (`thread-line`, `thread-elbow`), no sueltos en el componente: la línea es un `::before` de la fila 3 (`left: calc(var(--avatar)/2)`), el codo un `::after` de cada `<li>` hijo con las medidas de Reddit. `--avatar` vale 24 px y 32 px desde `sm` (Q3). La última respuesta tapa la línea debajo de su codo (un `::before` blanco desde el codo hasta abajo), como Reddit.
- **⊖**: `<button aria-expanded aria-label="Cerrar el comentario de @x">` con `CircleMinusIcon` (lucide, 16 px), `bg-background` para tapar la línea, en la fila 2, columna 1. **⊕** igual con `CirclePlusIcon`, en la fila 1 en lugar del avatar.
- **Franja**: un `<div aria-hidden>` absoluto de 32 px de ancho sobre la línea, `cursor-pointer`, `onClick` cierra; `group-hover` oscurece la línea. Sin foco: el teclado usa ⊖ (CT-09).
- **Nivel 4 plegado** (CT-08): el `Collapsible` de "Ver N respuestas" se reemplaza por un `CommentFold` de las respuestas que arranca cerrado, con el botón "⊕ N respuestas más" en su codo.

## 3. Compartir (CT-11, CT-12)

- **`ShareButton`** (molécula, `components/molecules/share-button.tsx`, cliente): recibe `url` (ruta relativa) y `label`. Arma la URL absoluta con `location.origin`. Si `navigator.share` existe y el dispositivo es táctil (`matchMedia('(pointer: coarse)')`), abre el menú del sistema; si no, `navigator.clipboard.writeText` y "Link copiado" 2 s en el botón, con `role="status"` para lectores. Sin `sonner` (no está montado y no hace falta para un aviso en el botón).
- Si el portapapeles falla (permiso), el botón dice "No se pudo copiar".
- **Ancla**: `id="comment-{id}"` en el `<li>`, `scroll-margin-top` ya cubierto por el `scroll-padding` de `html`. Un `CommentAnchor` cliente diminuto en la sección lee `location.hash` al montar: abre los `CommentFold` ancestros (evento `comment:reveal` con el id, que cada fold escucha si contiene el ancla) y resalta el comentario con `animate-fade-in` de un fondo `bg-surface` por 1,5 s.
- **El post** (Q4): el "Compartir" de `PostCard` usa el mismo `ShareButton` con `post.path`.

## 4. Textos

`comments.share` "Share" / "Compartir" / "Compartilhar"; `comments.copied` "Link copied" / "Link copiado" / "Link copiado"; `comments.copyFailed`; `comments.collapse` "Collapse {handle}'s comment"; `comments.expand`; `postDetail.moreReplies` "{count, plural, one {# more reply} other {# more replies}}".

## 5. Accesibilidad y presupuesto

- ⊖ / ⊕ con `text-foreground` sobre blanco (más de 3:1), área táctil de 24 px (el ícono de 16 con padding).
- `CommentFold` se usa en cada comentario pero es un solo módulo chico: se carga con la página (sin diferir, `seo.md`: diferir piezas chicas cuesta más). `ShareButton` también. Se mide con `performance.spec.ts`; hoy quedan 0,6 KB en las páginas de comunidad y el detalle tiene 2,3 KB.

## 6. Tests

- Unitarios: `CommentFold` (cierra, abre, foco en ⊕, `aria-expanded`, nombres), `ShareButton` (share nativo, copia, "Link copiado", fallo), `CommentAnchor` (abre el hilo plegado).
- E2E (`e2e/comment-threads.spec.ts`): medidas (avatar 32 desde `sm`, cuerpo 14 px), codo hasta el avatar del hijo, cerrar y abrir con ⊖/⊕ y con la franja, "⊕ N respuestas más", compartir copia el link (permiso de portapapeles en Chromium) y el ancla abre el hilo, 360 px sin scroll, axe claro y oscuro.

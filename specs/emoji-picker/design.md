# Selector de emojis — Design

## 1. Dónde vive

Una molécula en `components/molecules/emoji-picker/` (no sabe de negocio; la usan el editor de posts y las cajas de comentario):

```
emoji-picker/
├── emoji-button.tsx      # Cliente, liviano: el botón y la carga diferida del panel
├── emoji-panel.tsx       # Diferido: Popover, buscador, grilla, teclado
├── emoji-data.ts         # Diferido: ~280 emojis por categoría, con nombres en en, es y pt
├── recent-emojis.ts      # Recientes en localStorage (con try/catch)
├── insert-text.ts        # Inserta en el cursor de un textarea (compartido con mention-assist)
└── index.ts
```

- `EmojiButton({ fieldRef })`: un botón de 32 px (`SmilePlusIcon` de lucide), `aria-label` "Agregar emoji", `aria-haspopup="dialog"`. Descarga el panel al pasar el mouse o enfocar (como el menú "⋯") y lo abre al tocar.
- `insertText(field, text)`: reemplaza la selección por el texto, escribe con el setter nativo y un evento `input` (lo ven React y `react-hook-form`) y deja el cursor después. Hoy esa lógica vive en `mention-assist` (`typeValue`); pasa a este archivo y la usan los dos.

## 2. El panel

- `Popover` de shadcn (Base UI), agregado con el CLI, anclado al botón, del lado de arriba si no entra abajo. Ancho `min(352px, 100vw − 16px)`, alto máximo 360 px con scroll en la grilla, borde, `popover`, radio 16 px.
- **Buscador** (`input type="search"`, 16 px en mobile) con lupa, `aria-label` "Buscar emoji", foco al abrir.
- **Barra de categorías:** un botón por categoría con su emoji representativo y nombre accesible; lleva a su sección (scroll suave salvo con reducir movimiento).
- **Secciones:** título (`type-section`) y una grilla de 8 columnas de botones de 40 px. El emoji con `font-family` de emojis del sistema (`"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"`) en 22 px.
- **Teclado:** la grilla es un `grid` ARIA con foco itinerante (`tabIndex` 0 en uno solo): flechas por fila y columna, Inicio y Fin. Enter o Espacio insertan.
- **Buscar:** filtra al escribir (sin pausa: es una lista local), por palabras que empiezan con lo escrito, sin mayúsculas ni acentos, en el idioma de la página y en inglés. Muestra una sola sección "Resultados" y una región `role="status"` que dice "N emojis".
- Al insertar: guarda en recientes, cierra y devuelve el foco al campo.

## 3. Datos

```ts
type Emoji = { char: string; names: { en: string[]; es: string[]; pt: string[] } }
type Category = {
  id: 'smileys' | 'people' | 'nature' | 'food' | 'activities' | 'travel' | 'objects' | 'symbols'
  icon: string
  emojis: Emoji[]
}
```

- Escrita a mano a partir de los nombres cortos de CLDR, ~280 emojis hasta Emoji 13, sin banderas ni tonos de piel. Los de finanzas al principio de sus categorías.
- Los nombres de las categorías y los textos del panel van en `messages/` (`emoji.*`, cliente). Los nombres de los emojis son datos y viajan en el chunk diferido.

## 4. Dónde se usa

- **Editor de posts** (`PostEditor`): en la fila de formatos, después de Imagen, apuntando al cuerpo.
- **Comentar y responder** (`CommentComposer`): a la izquierda de Cancelar y Comentar, cuando la caja está abierta.

## 5. Performance

- Primera carga: solo `EmojiButton` y una entrada en el manifiesto de chunks diferidos (~0,5 KB). En las páginas sin caja de comentario, nada (el editor de posts ya es diferido).
- El panel, el `Popover`, la lista y los nombres: un chunk diferido (~15 KB gzip).

## 6. Tests

- Unitarios: `insertText` (cursor, selección, evento), la búsqueda (sin acentos, en dos idiomas, por comienzo de palabra), los recientes (orden, tope, sin localStorage), `EmojiButton` (abre, inserta, Esc devuelve el foco), el panel (teclado de la grilla, resultados anunciados) y la lista (sin repetidos, sin banderas, nombres en los tres idiomas).
- E2E (mobile y desktop): insertar desde el editor de posts y desde un comentario en el lugar del cursor; buscar "fuego" en es; recientes después de recargar; 360 px; axe en claro y oscuro con el panel abierto. Presupuesto de JS.

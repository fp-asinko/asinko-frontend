# Autocompletar menciones — Design

> **Estado:** aprobado por el PO el 2026-10-08.

## 1. Dónde vive

Lo usan dos features que no se importan entre sí (el editor de posts y los comentarios), y la caja de comentarios se carga con la página de detalle. Por eso:

- **`MentionAssist`** (`components/molecules/mention-assist/`): la lista y el teclado. **Se engancha a un `textarea` que ya existe** (por su ref): escucha sus eventos, le pone los atributos ARIA y dibuja la lista. No conoce el negocio: recibe por props la búsqueda y cómo cambiar el valor.
  - **Diferida:** la página carga solo un envoltorio chico (`MentionField`) que descarga `MentionAssist` con `next/dynamic` la primera vez que se enfoca el campo. El campo es el mismo antes y después: no se reemplaza, no pierde el foco ni lo escrito (MA-09).
- **Búsqueda compartida** (`lib/mentions/`): `searchMentions` (Server Action) y `mentions-api.ts` (`server-only`), como `lib/communities/join-community.action.ts`.
- **Quién la usa:**
  - `PostEditor` (cuerpo, con `react-hook-form`): el cambio de valor va por `setValue('body', …, { shouldDirty: true })`.
  - `CommentComposer` (comentar y responder, con estado propio): por su `setText`.

## 2. Detectar la mención

- En cada cambio y movimiento del cursor se mira el texto **antes del cursor**: `(^|\s)([$#@])([\p{L}\p{N}_-]{1,32})$`.
  - Hay mención activa si coincide: símbolo, consulta y dónde empieza.
  - Sin letras después del símbolo, no hay lista todavía (Q2).
- Función pura `activeMention(text, caret)` en `lib/mentions/active-mention.ts`, con sus tests.

## 3. Buscar

- Una Server Action `searchMentions({ kind, q })`, validada con zod (`q` de 1 a 32 caracteres), con una pausa de 150 ms y descartando respuestas viejas (como el selector de comunidad).
- Por símbolo, en `lib/mentions/mentions-api.ts`:

  | Símbolo | Endpoint                               | Filtro                                   | Inserta                    |
  | ------- | -------------------------------------- | ---------------------------------------- | -------------------------- |
  | `$`     | `GET /assets?q=`                       | —                                        | `$` + símbolo en mayúscula |
  | `#`     | `GET /communities?search=`             | sin `SYSTEM_ASSET` ni `PERSONAL_CHANNEL` | `#` + slug                 |
  | `@`     | `GET /search?type=user&q=` → `users[]` | —                                        | `@` + username             |

- Hasta 6 resultados, mapeados a `MentionOption { kind, handle, label, avatarUrl, colorKey }`.
- **Contrato:** el catálogo de activos responde `{ items }` sin `nextCursor`: su esquema acepta el cursor como opcional. El mock de `/assets` pasa a `implemented: true` (ya está en el backend) y se suma el de `/search`.

## 4. La lista

- Un panel debajo de la línea del cursor. La posición sale de un espejo del `textarea` (un `div` con los mismos estilos y el texto hasta el cursor): unas 30 líneas propias, sin librería (`libraries.md § Criterio`).
- El mismo estilo que la lista de comunidades: borde (sin el anillo de shadcn), fondo `popover`, radio 12 px, entrada con fundido y un leve desplazamiento (`animate-fade-in`, ≤ 150 ms).
- Cada opción: `UserAvatar` chico (persona: redondo; comunidad o activo: cuadrado redondeado, como en las tarjetas), el handle en negrita y el nombre en gris si dice algo más.
- A 360 px: ancho de la columna menos los márgenes; si no entra debajo, se abre arriba del cursor.

## 5. Teclado y accesibilidad

- Un `textarea` no admite `role="combobox"` ni `aria-expanded` (ARIA in HTML; axe lo marca). Queda como campo de texto con `aria-autocomplete="list"` y, mientras hay lista, `aria-controls` y `aria-activedescendant` hacia la opción marcada. La lista es un `listbox` con sus `option`, y cada opción se lee "$BTC Bitcoin" (un espacio entre las partes).
- ↑ ↓ mueven la marca, Enter y Tab eligen, Esc cierra la lista. Con la lista abierta esas teclas no siguen (`preventDefault` y `stopPropagation`): ni el formulario ni el Esc del editor o de la respuesta las ven. Las opciones no reciben foco: el teclado vive en el campo, y tocar una opción no le saca el foco.
- Una región `aria-live` anuncia "N sugerencias" al abrir y la mención elegida.

## 6. Insertar

- Reemplaza desde el símbolo hasta el cursor por la mención y un espacio y deja el cursor después.
- Escribe el valor como si se tipeara: el setter nativo de `value` y un evento `input`. Así lo ven igual `react-hook-form` (el editor) y un estado propio (los comentarios), sin que la molécula sepa cuál es.

## 7. Mensajes

`mentions.*` (cliente): etiqueta de la lista, "N sugerencias", sin coincidencias, error y "Mención agregada". Se suma a `CLIENT_NAMESPACES`.

## 8. Performance

- Medido al cerrar (2026-10-08): Home y detalle 233,6 KB, páginas de comunidad 235,1 KB (antes: 233,3 y 234,9).
- El costo en las páginas que no usan menciones viene del manifiesto de chunks diferidos de Turbopack, que carga toda página, y de la referencia a la acción. Diferir también la acción (`import()`) lo empeoró: sumó otra entrada al manifiesto (235,5 KB). Se descartó.
- Pasaba el tope de 235 por 0,1 KB: el PO lo subió a 240 (`seo.md`).

## 9. Propuesta al backend

- P-001 ampliada en `proposals.md`: que `POST /posts` (y `PATCH`) detecten las menciones del cuerpo y devuelvan `entities` (E3-06). Sin eso, la mención se publica como texto.

## 10. Tests

| Qué                                                                            | Dónde                                    |
| ------------------------------------------------------------------------------ | ---------------------------------------- |
| `activeMention` (inicio, después de espacio, en medio de una palabra, límites) | `lib/mentions/active-mention.test.ts`    |
| Búsqueda por símbolo, filtros, mapeo, fallas                                   | `lib/mentions-api.test.ts`               |
| Action: validación y errores                                                   | `actions/search-mentions.action.test.ts` |
| Lista: abrir, filtrar, teclado, Esc sin cerrar el editor, insertar             | `components/mention-textarea.test.tsx`   |
| E2E: `$`, `#` y `@` en desktop y mobile, 360 px, axe en claro y oscuro         | `e2e/post-create-detail.spec.ts`         |

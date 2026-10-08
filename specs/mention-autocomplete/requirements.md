# Autocompletar menciones — Requirements

> **Estado:** aprobado por el PO el 2026-10-08, con las preguntas resueltas: también en comentarios (Q1) y la lista aparece con la primera letra (Q2).
> **Cambio con el PO (2026-10-08, al probarlo):** las sugerencias tardaban en aparecer, y las menciones tienen que verse en azul mientras se escriben (MA-12, con un token nuevo `--mention`). Las tarjetas al pasar el mouse sobre una mención van en su propio spec.
> **Fuente:** pedido del PO (2026-10-07): "que aparezcan usuarios cuando pongo @, comunidades cuando pongo # o assets cuando pongo $". Las menciones están definidas en `docs/product/overview.md § Menciones`.

## Objetivo

Que escribir una mención sea rápido y exacto: al tipear `$`, `#` o `@` en el editor aparece una lista corta de lo que existe, y al elegir, la mención queda escrita bien (`$BTC`, `#defi`, `@maria`).

## User stories

- Como usuario, quiero que al escribir `$` me sugiera activos del catálogo, para no inventar un ticker que no existe.
- Como usuario, quiero que al escribir `#` me sugiera comunidades, y al escribir `@`, personas.
- Como usuario de teclado o lector de pantalla, quiero elegir una sugerencia sin el mouse.

## Criterios de aceptación

### Sugerencias

- [ ] **MA-01** En el **cuerpo** del editor de posts y en las cajas de **comentar y responder**, escribir `$`, `#` o `@` al principio o después de un espacio o salto de línea abre una lista de sugerencias junto al cursor.
- [ ] **MA-02** Lo que se escribe después del símbolo filtra la lista, con una pausa corta. Cada símbolo busca lo suyo:
  - `$`: activos del catálogo (símbolo y nombre).
  - `#`: comunidades que son grupos (no activos ni canales personales).
  - `@`: personas.
- [ ] **MA-03** Hasta 6 sugerencias, cada una con su avatar, el handle y el nombre cuando dice algo más que el handle. Sin resultados, la lista dice que no hay coincidencias; si la búsqueda falla, lo dice y no bloquea la escritura.
- [ ] **MA-04** **Elegir** reemplaza lo escrito desde el símbolo por la mención completa más un espacio (`$bt` → `$BTC `), y el cursor queda después.

### Interacción

- [ ] **MA-05** **Teclado:** ↑ y ↓ recorren, Enter o Tab eligen, Esc cierra la lista **sin cerrar el editor**. Con el mouse o el dedo, tocar una sugerencia la elige.
- [ ] **MA-06** La lista se cierra sola al escribir un espacio, al borrar el símbolo o al mover el cursor fuera de la mención. Escribir sin elegir deja el texto tal cual: elegir es una ayuda, no una obligación.
- [ ] **MA-07** **Accesibilidad:** el campo anuncia que tiene sugerencias (patrón combobox con `aria-activedescendant`), cada sugerencia es una opción y la elegida se anuncia. axe sin violaciones, en claro y oscuro.
- [ ] **MA-08** **Mobile first:** a 360 px la lista entra en pantalla, también con el teclado del teléfono abierto, y cada opción mide al menos 44 px.
- [ ] **MA-12** **Menciones en azul mientras se escribe:** en el cuerpo del editor y en las cajas de comentar y responder, cada mención (`$BTC`, `#defi`, `@maria`, también la que se está escribiendo) se ve en el color `--mention`, con contraste 4,5:1 en claro y oscuro. Un precio (`$100`) no es una mención. El cursor, la selección y el texto de ayuda siguen igual.
- [ ] **MA-13** **Rapidez:** la lista aparece enseguida: "Buscando…" mientras llega la respuesta, lo que una búsqueda más corta ya encontró filtrado en el momento, y una búsqueda ya hecha sin volver a pedirla.

### Calidad

- [ ] **MA-09** No suma JavaScript a la primera carga (`seo.md`, hoy al límite): la lógica y la lista se descargan la primera vez que se enfoca un campo con menciones.
- [ ] **MA-10** El navegador no llama a la API: las búsquedas son Server Actions (`api-integration.md`).
- [ ] **MA-11** Textos nuevos en en, es y pt.

## Fuera de alcance

- **Que la mención quede como link en el post publicado.** Lo decide el backend al publicar: hoy `POST /posts` devuelve `entities: []` (detección postergada, E3-06). Se le propone en `proposals.md` (P-001 ampliada). Mientras tanto la mención se publica como texto.
- El título del post (las menciones resueltas van en el cuerpo, `entities` con posiciones en `body`).
- Notificar a la persona mencionada (fase 3).

## Dependencias

- `GET /api/v1/assets?q=` (E14): ya está en el backend (`dev`), responde `{ items }` sin `nextCursor`.
- `GET /api/v1/communities?search=` (E02) y `GET /api/v1/search?type=user&q=` (E04): en el backend.
- Para el link en el post: la detección de menciones al publicar (E3-06), pedida al backend.

## Decisiones del PO (2026-10-08)

- **Q1:** también en las cajas de comentar y responder, cargado diferido al enfocarlas (MA-01, MA-09).
- **Q2:** la lista espera la primera letra después del símbolo: menos ruido.

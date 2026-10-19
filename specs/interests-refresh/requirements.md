# Columna izquierda, segunda vuelta — Requirements

> **Estado:** aprobado por el PO el 2026-10-08 ("dale, hagamos los 4"), sobre las cuatro sugerencias que se le pasaron, con la recomendación de mantener el `#` en los grupos.
> **Fuente:** pedido del PO (2026-10-08), con capturas de la columna actual y del prototipo: "en el prototipo los grupos tienen una breve descripción, lo mismo que en sugerencias" y "siento que las personas y grupos se ven mejor en el prototipo".
> **Cambio con el PO (2026-10-18):** el orden de las secciones es **Grupos, Activos y Personas** (antes Activos, Personas y Grupos), con "Crear grupo" debajo de los grupos como siempre y Sugeridas al pie.

## Objetivo

Que la columna "Tus intereses" se vea como el prototipo: más aire, personas y grupos más grandes, y debajo de cada grupo lo que se está hablando ahí, que da motivos para entrar.

## Hallazgo

En el prototipo, la línea debajo de cada grupo **no es la descripción**: es el título del post principal del grupo ("Groups mock with the main post title"). En las sugeridas, un tema del momento. Hoy mostramos la descripción, y con los datos reales casi ningún grupo la tiene (1 de 20).

## Criterios de aceptación

- [ ] **IR-01** **Grupos, qué se habla:** debajo de cada grupo, el título de su post principal (el más votado de los últimos 7 días, o el más reciente si no hubo), en 1 línea. Sin ese dato, su descripción; sin ninguno, la cantidad de miembros, como las sugeridas (pedido del PO al verlo con datos reales, 2026-10-08: el backend todavía no manda el post principal y casi ningún grupo tiene descripción). La página actual se marca con fondo gris, sin borde, como las personas.
- [ ] **IR-02** **Sugeridas, un texto corto:** debajo del nombre, el título del post principal en 1 línea; si no, la descripción; si no, la cantidad de miembros (lo de hoy).
- [ ] **IR-03** **Personas, del tamaño de las sugeridas:** avatar de 32 px (antes 28) y el `@usuario` en negrita a 13 px (ajustado por el PO al verlo, 2026-10-08: a 36 y 15 px la columna se desbordaba). Cuando exista el nombre visible (P-011) se muestra el nombre, con el `@usuario` debajo.
- [ ] **IR-04** **Precisión con color por tramo**, como en las tarjetas del feed (verde desde 70 %, ámbar desde 50 %, rojo debajo; los tokens `--accuracy-*`), en vez del chip gris.
- [ ] **IR-05** **Grupos, en la fila de las sugeridas:** avatar de 32 px (antes 20), el `#handle` en negrita a 13 px y la línea de abajo al lado del avatar, en 1 línea (ajustado por el PO, 2026-10-08). Se mantiene el `#handle` (como se menciona en toda la app), no el nombre visible.
- [ ] **IR-06** Sin JavaScript nuevo en la primera carga (`seo.md`, quedan 0,6 KB): la columna se arma en el servidor.
- [ ] **IR-07** Accesibilidad intacta: el nombre de cada link sigue siendo su contenido (handle, MOD, la línea de abajo), las áreas táctiles de 24 px o más, contraste en claro y oscuro (axe).

## Dependencias

- **IR-01 y IR-02 necesitan al backend:** el resumen de cada comunidad (`GET /communities`, `?mine=true`) tiene que traer su post principal. Propuesta **P-016** en `proposals.md`, mockeada mientras tanto. Con el backend real y sin ese campo, se ve la descripción (o nada), como hoy.
- **IR-03, el nombre visible:** P-011.

## Fuera de alcance

- La calificación del prototipo (AAA … D): después del MVP (backend, 2026-10-07).
- La cantidad de tesis por activo en los mosaicos: fase 2.
- El "+ Unirse" con borde del prototipo: el sistema usa píldoras grises.

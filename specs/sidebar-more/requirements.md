# "more" de la columna izquierda — Requirements

> **Estado:** implementado y cerrado el 2026-10-23. Aprobado por el PO el mismo día: "hay que habilitar los botones de more". Q1: **despliega en el lugar**, como Reddit. Q2: **solo aparece si hay algo que no entró**.
> Reemplaza el "Próximamente" (H-26) de los "more" de Grupos, Personas y Activos (`specs/sidebar-fill`).

## Criterios de aceptación

- [x] **SM-01** En Grupos, Personas y Activos, "more" aparece **solo si la sección tiene ítems que no entraron** (por el alto de la columna o por el máximo de cada lista). Si se ve todo, no hay "more" (Q2).
- [x] **SM-02** Tocarlo muestra **todos** los ítems de esa sección en la columna, que hace scroll si no entran (Q1). El texto pasa a "less", y tocarlo vuelve a mostrar los que entran. Cada sección se abre por separado.
- [x] **SM-03** Es un disclosure: `aria-expanded` y `aria-controls` apuntan a la lista. Su nombre empieza con lo que se ve ("more" o "less") y dice de qué sección es. Funciona con teclado, y el foco queda en el botón.
- [x] **SM-04** Lo desplegado se lee y se alcanza con Tab; lo plegado, no (como hoy, `specs/sidebar-fill` SF-06).
- [x] **SM-05** Textos en en, es y pt; sin animación nueva (la columna ya anima su contenido); a 360 px, en el panel lateral, funciona igual. Axe sin violaciones en claro y oscuro; presupuesto de JS dentro de 240 KB.

## Fuera de alcance

- Sugeridos (llena el alto que queda, `specs/sidebar-fill` SF-02).
- Recordar qué secciones quedaron desplegadas.

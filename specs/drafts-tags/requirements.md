# Borradores y marcas, como Reddit — Requirements

> **Estado:** aprobado por el PO el 2026-10-19: "deberíamos agregar la opción de borradores como tiene Reddit y añadir marcas, hacerlo mockup y dejarlo como un proposal al back". Q1: el borrador automático del navegador **convive** con los de la cuenta. Q2: **una** marca por post, de la lista de su comunidad. Q3: la marca se ve en la tarjeta, junto al título.
> **Backend:** el `Post` ya tiene `tag` (texto, opcional) y `POST /posts` lo acepta, pero no hay lista de marcas por comunidad ni borradores en el servidor. Se proponen (P-022, P-023) y se mockean.

## Borradores de la cuenta (P-022)

- [x] **DT-01** Junto a Publicar, **Guardar borrador** (píldora gris): guarda lo escrito en tu cuenta (comunidad, formato, título, cuerpo, link, imagen y su descripción, marca). Espera a que haya algo escrito. Al guardar, lo anuncia ("Borrador guardado") y sigue en la página.
- [x] **DT-02** Arriba a la derecha del formulario (al final de la fila de la comunidad), **Borradores** abre una ventana con los guardados (`N/20`), del más reciente al más viejo: el título (o "Sin título"), la comunidad y cuándo se guardó. Sin borradores, el estado vacío de Reddit ("Guarda borradores para publicarlos cuando quieras").
- [x] **DT-03** Tocar un borrador lo abre en el formulario (si hay algo escrito, pregunta antes de reemplazarlo). Guardar de nuevo **actualiza** ese borrador; publicarlo lo **borra** de la lista.
- [x] **DT-04** Cada borrador se puede **eliminar** desde la ventana, con confirmación.
- [x] **DT-05** Con 20 borradores, Guardar borrador dice que se llegó al límite y que hay que eliminar uno. Sin sesión no hay borradores (la página ya pide entrar).
- [x] **DT-06** (Q1) El borrador automático del navegador (`specs/submit-page` SU-12) sigue igual: protege lo que se escribe aunque no se guarde a mano.

## Marcas (P-023)

- [x] **DT-07** (Q2) Debajo del título, **Añadir marca** abre la lista de marcas de la comunidad elegida (por ejemplo "Análisis", "Noticia", "Pregunta"); se elige **una**, que queda como píldora con su ×. Opcional.
- [x] **DT-08** Sin comunidad, o si la comunidad no tiene marcas, el botón se ve deshabilitado y dice por qué. Cambiar de comunidad quita la marca si la nueva no la tiene.
- [x] **DT-09** Publicar manda la marca (`tag`).
- [x] **DT-10** (Q3) La tarjeta de un post con marca la muestra como una píldora gris chica antes del título, en el feed y en el detalle.

## Calidad

- [x] **DT-11** Mobile first a 360 px (la ventana de borradores a pantalla completa en el teléfono); axe sin violaciones en claro y oscuro; textos en en, es y pt; presupuesto de JS dentro de 240 KB (la ventana viaja con el editor, que ya se carga al primer uso: `design.md § 2`).
- [x] **DT-12** `proposals.md` con P-022 y P-023, y los mocks con su forma y sus errores (`DRAFT_LIMIT`, `INVALID_TAG`, `NOT_FOUND`, `USER_MISMATCH`).

## Fuera de alcance

- Que los moderadores editen las marcas de su comunidad (no hay moderación en el MVP).
- Filtrar el feed por marca.
- Programar la publicación de un borrador.

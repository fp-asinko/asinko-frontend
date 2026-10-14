# Ventana de compartir — Requirements

> **Estado:** aprobado por el PO el 2026-10-11, con Q1 a Q4 como se recomendaron.
> **Fuente:** pedido del PO (2026-10-11): "me sigue apareciendo el link copied, no abre el modal". Hoy Compartir en desktop copia el link y dice "Link copied" (`specs/comment-threads` CT-11, Q1 del 2026-10-08); en el teléfono abre el menú del sistema. El PO quiere una ventana. Cambio de alcance de CT-11.

## Objetivo

Que Compartir en desktop abra una ventana con las formas de compartir un post, en lugar de copiar sin avisar dónde.

## User stories

- Como usuario, quiero elegir dónde compartir un post (copiar el link, X, WhatsApp…), no solo copiarlo.
- Como usuario, quiero ver cómo se va a ver lo que comparto.

## Criterios de aceptación

- [x] **SM-01** En desktop, Compartir de un post abre una **ventana** "Compartir post" (Q1). En el teléfono sigue abriendo el menú de compartir del sistema, que ya tiene todas las apps.
- [x] **SM-02** La ventana muestra la **vista previa** del post: la imagen para compartir de `specs/share-preview` (Q3).
- [x] **SM-03** Opciones (Q2): **Copiar link** (dice "Link copiado" en el mismo botón y lo anuncia), **X**, **WhatsApp**, **Telegram** y **Email**. Cada red abre su página de compartir en otra pestaña, con el link y el título del post; no se carga ningún script de terceros.
- [x] **SM-04** El link es el de la página del post en el idioma actual, sin la query (como hoy).
- [x] **SM-05** Teclado y lectores: la ventana tiene nombre, el foco entra en "Copiar link", Esc la cierra y el foco vuelve a Compartir. Las opciones son links o botones con nombre.
- [x] **SM-06** A 360 px nada genera scroll horizontal (la ventana también se usa si un teléfono no tiene menú del sistema); axe sin violaciones en claro y oscuro.
- [x] **SM-07** La ventana se carga al primer uso (`next/dynamic`): el presupuesto de JS no sube.
- [x] **SM-08** Textos en en, es y pt.

## Fuera de alcance

- Compartir un **comentario**: sigue copiando su link (Q4).
- Embeber, "crosspost" a otra comunidad, contar cuántas veces se compartió.
- Instagram (no tiene página para compartir un link desde la web).

## Preguntas resueltas (2026-10-11)

- **Q1. ¿Ventana o menú desplegable?** ¿Una ventana centrada con la vista previa (**recomendado**, es lo que pediste y deja ver la tarjeta) o un menú chico debajo del botón, como Reddit (más rápido, sin vista previa)?
- **Q2. ¿Qué opciones?** ¿Copiar link, X, WhatsApp, Telegram y Email (**recomendado**: las que más se usan en finanzas y LATAM)? ¿Sumamos LinkedIn o Reddit?
- **Q3. ¿Vista previa?** ¿Mostrar la imagen para compartir arriba de las opciones (**recomendado**: el usuario ve qué va a mandar) o solo las opciones?
- **Q4. ¿Y los comentarios?** ¿Siguen copiando el link (**recomendado**: compartir un comentario es menos común y la ventana sería pesada para eso) o abren la misma ventana sin vista previa?

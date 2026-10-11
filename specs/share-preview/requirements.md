# Vista previa al compartir — Requirements

> **Estado:** aprobado por el PO el 2026-10-11, con Q1 a Q3 como se recomendaron.
> **Fuente:** pedido del PO el 2026-10-11, punto 2 de las mejoras: "Vista previa al compartir". Ya existe el botón Compartir (`specs/comment-threads` CT-11), pero un link pegado en WhatsApp, X o Slack muestra solo el título y el texto, sin imagen. `seo.md` pide `og:*` y `twitter:card` completos en toda ruta.

## Objetivo

Que un link de Asinko compartido en otra app se vea como una tarjeta con imagen: la marca, la comunidad y de qué se trata, para invitar a abrirlo.

## User stories

- Como usuario, quiero que el post que comparto se vea bien en WhatsApp o X, para que otros lo abran.
- Como Asinko, quiero que cada link compartido muestre la marca.

## Criterios de aceptación

- [x] **SP-01** El detalle de un post tiene su imagen para compartir (`og:image` y `twitter:image`), de 1200 × 630 px, armada en el servidor con: el logo de Asinko, la comunidad (su avatar y su handle), el título del post (hasta 3 líneas, con "…" si sigue), el autor y sus números (votos y comentarios) (Q2).
- [x] **SP-02** Tiene texto alternativo (`og:image:alt`): el título del post.
- [x] **SP-03** Sigue el sistema visual: fondo claro, tipografía Figtree y colores de los tokens del tema (Q3). El avatar de la comunidad usa su tono de identidad, como en la página.
- [x] **SP-04** Las demás páginas (Home, comunidad, activo, perfil, 404) tienen una imagen genérica de la marca: el logo y el lema (Q1).
- [x] **SP-05** En X se ve como tarjeta grande (`twitter:card` = `summary_large_image`).
- [x] **SP-06** Un post borrado o que no existe usa la imagen genérica, sin datos del post.
- [x] **SP-07** El título y el autor salen del contenido del usuario: se dibujan como texto, sin interpretar HTML ni Markdown, y no se piden imágenes a dominios que no sean los permitidos (`security.md`).
- [x] **SP-08** La imagen se genera en el servidor y no suma JavaScript a la página (`seo.md`, presupuesto de JS).
- [x] **SP-09** Textos (lema, "votos", "comentarios") en en, es y pt, según el idioma del link.

## Fuera de alcance

- Imágenes propias para comunidades, activos y perfiles (Q1): quedan con la genérica.
- Mostrar la imagen del post en la tarjeta (Q2).
- Medir cuántas veces se comparte.

## Preguntas resueltas (2026-10-11)

- **Q1. ¿Qué páginas?** ¿Una imagen propia para cada post y una genérica de la marca para todo lo demás (**recomendado**: lo que más se comparte son posts, y así ningún link queda sin imagen)? Alternativa: también imágenes propias para comunidades, activos y perfiles (más trabajo, se puede sumar después).
- **Q2. ¿Qué lleva la tarjeta del post?** ¿Logo, comunidad, título, autor, votos y comentarios, siempre con el mismo diseño (**recomendado**)? Alternativa: si el post tiene imagen, mostrarla al costado del título. Cuesta más y depende de que la imagen del usuario cargue bien en el servidor.
- **Q3. ¿Tema?** ¿Claro, como el tema por defecto de la app (**recomendado**), u oscuro, que resalta más en un chat?

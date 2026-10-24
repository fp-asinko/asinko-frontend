# Anuncios en los feeds y en el detalle — Requirements

> **Estado:** implementado y cerrado el 2026-10-24. Aprobado por el PO el mismo día: "hay que traer de nuevo los mocks de las publicidades", con seis piezas de ejemplo (AvaTrade, Pepperstone, eToro). Q1: en los **feeds y en el detalle** de un post. Q2: **la imagen manda**: se ve entera, con su texto. Q3: las verticales con **tope de alto**, centradas.
> **Contexto:** el backend decidió (respuesta del 2026-10-13, P-015) que los anuncios vienen **dentro del feed** como un ítem más, y que el front no decide dónde van. `specs/backend-answer-1013` sacó los que el front intercalaba. Este spec los vuelve a mostrar con esa regla: el mock los pone donde los pondría el backend.

## Criterios de aceptación

### En los feeds

- [x] **AD-01** Un anuncio llega dentro de la lista del feed como un ítem `kind: "AD"` (propuesta P-031) y se dibuja donde viene: en el Home (Para vos y Siguiendo), los grupos, los activos y el perfil, también en las páginas de "Cargar más". El front no lo mueve ni lo cuenta.
- [x] **AD-02** Su tarjeta: arriba, chico, el logo y "**Anunciante · Ad**"; la **imagen entera**, a su proporción, sin recortar su texto (Q2); si trae un texto propio, debajo; y "**Learn more**" con el dominio real del destino.
- [x] **AD-03** Una imagen alta no pasa de unos **540 px** de alto: se ve entera, centrada sobre el gris de fondo (Q3). Un banner o una cuadrada se ven a su tamaño. El lugar se reserva con su ancho y alto: nada salta al cargar.

### En el detalle

- [x] **AD-04** En el detalle de un post, los anuncios llegan con los comentarios, cada uno con el comentario después del cual va (propuesta P-031): uno **debajo del post**, antes de los comentarios, y los demás **entre los comentarios**, con la forma de un comentario (logo, "Anunciante · Ad", la pieza al ancho del comentario, hasta 320 px de alto, y "Learn more").
- [x] **AD-05** En la búsqueda de comentarios no hay anuncios.

### Para todos

- [x] **AD-06** El link abre en otra pestaña con `rel="sponsored noopener noreferrer"`, solo `http(s)`, con el dominio real a la vista (`security.md § 1`). Un anuncio con otro esquema no se muestra.
- [x] **AD-07** Un lector de pantalla oye que es un anuncio antes de su contenido. La imagen de una pieza lleva su texto alternativo (el texto que trae la pieza, del anunciante).
- [x] **AD-08** Si un anuncio viene mal formado, se descarta solo y el resto se ve igual (`api-integration.md § Listas`).
- [x] **AD-09** A 360 px sin scroll horizontal; axe sin violaciones en claro y oscuro; presupuesto de JS dentro de 240 KB (el anuncio no suma JavaScript).

## Fuera de alcance

- Medir impresiones y clics de anuncios, segmentar, ocultar o reportar un anuncio.
- Cargar anuncios desde Asinko (es del backend).
- Las piezas de ejemplo solo existen en los mocks (`public/mocks/ads/`); `API_MOCKS` nunca está activo en producción.

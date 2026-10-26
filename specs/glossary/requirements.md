# Glosario en el Home — Requirements

> **Estado:** aprobado por el PO e implementado el 2026-10-25. Pidió las tarjetas de glosario con una captura del prototipo y 15 términos en dos grupos (Trading y Macro and bonds), cada uno con título, texto y ejemplo.
>
> - **Q1:** la tarjeta lleva **solo esos datos**: la marca GLOSSARY, el grupo, el título, el texto y la caja del ejemplo. No lleva pronunciación, activos, motivo "trending", votos ni comentarios.
> - **Q2:** los términos salen **al azar**, como los anuncios.
> - **Q3:** se trabaja en una **rama nueva desde `develop`** y se mergea a `develop`, para verlo ahí como los anuncios.
>
> **Contexto:** el glosario es contenido de la plataforma (`docs/product/overview.md § Creados por la plataforma`). El backend no lo tiene: se mockea y se propone (P-032), como los anuncios (`specs/ads`).

## Criterios de aceptación

- [x] **GL-01** En el Home (Para vos y Siguiendo) aparece una tarjeta de glosario **cada 8 posts**. Los anuncios no cuentan para esos 8. Llega dentro de la lista del feed como un ítem `kind: "GLOSSARY"` (propuesta P-032) y se dibuja donde viene, también en las páginas de "Cargar más". El front no la mueve.
- [x] **GL-02** La tarjeta, siguiendo el prototipo con nuestro sistema:
  - en la fila del término, a la derecha, la marca **GLOSSARY** con su ícono, como POLL y THOUGHT (el grupo, "Trading" o "Macro and bonds", se sacó el 2026-10-26 a pedido del PO; sigue en los datos);
  - el término como título grande;
  - el texto;
  - el **ejemplo** en una caja gris con un borde gris tenue a la izquierda, con la etiqueta "EXAMPLE" y el texto en itálica.

  Sin votos, comentarios, compartir ni link: no tiene página.

- [x] **GL-03** Los 15 términos de ejemplo del PO, en inglés, como el resto de los datos de ejemplo. El mock elige uno al azar en cada lugar, sin repetir el anterior.
- [x] **GL-04** Un lector de pantalla oye que es un término del glosario y cuál es. El término es un heading.
- [x] **GL-05** Si un término viene mal formado, se descarta solo y el resto del feed se ve igual (`api-integration.md § Listas`).
- [x] **GL-06** Textos de la interfaz en en, es y pt. A 360 px sin scroll horizontal. Axe sin violaciones en claro y oscuro. Presupuesto de JS dentro de 240 KB: la tarjeta no suma JavaScript.
- [x] **GL-07** También con `API_MOCKS=missing` (desarrollo y `develop`, contra el backend real): los glosarios y los anuncios se suman al feed real, en los mismos lugares. Pedido del PO el 2026-10-25 ("no veo los glossary"): con el feed del backend no se veían.

## Fuera de alcance

- Una página del glosario o de cada término, y buscar términos.
- Glosario en grupos, activos, perfiles o el detalle de un post.
- Votar, comentar o compartir un término.
- Traducir los términos: es contenido, y llega como lo mande el backend.

# Imágenes enteras en las tarjetas — Requirements

> **Estado:** aprobado por el PO el 2026-11-10, con Q1 como se recomendó.
> **Fuente:** pedido del PO (2026-11-10), con capturas de Reddit de referencia: una imagen que no tiene la forma del recuadro se muestra entera, y los costados se llenan con la misma imagen desenfocada.

## Problema

La imagen de un post se dibuja en un recuadro fijo de 16:9 que la recorta para llenarlo (`object-cover`, `specs/post-image`). Una captura vertical pierde arriba y abajo (el texto de "$170,998" queda cortado) y un gráfico pierde los bordes, donde suelen estar los números.

## User stories

- Como lector, quiero ver la imagen entera, para leer el gráfico o la captura sin abrirla.
- Como autor, quiero que mi imagen se vea como la subí, sin que el sitio decida qué parte cortar.

## Criterios de aceptación

- [ ] **IF-01** La imagen de un post se muestra **entera**, sin recorte, en la tarjeta del feed y en el detalle.
- [ ] **IF-02** El espacio que sobra a los costados (imagen vertical) o arriba y abajo (imagen muy ancha) se llena con **la misma imagen, ampliada y desenfocada**, como Reddit. Nunca queda un fondo vacío.
- [ ] **IF-03** El recuadro mantiene su tamaño de hoy (16:9, borde y radio): la página no salta al cargar la imagen (CLS) y las tarjetas conservan su ritmo.
- [ ] **IF-04** Se descarga **una sola imagen**: el fondo desenfocado usa el mismo archivo que la imagen, sin otro pedido.
- [ ] **IF-05** El fondo es decorativo: un lector de pantalla lee una sola imagen, con el texto alternativo de hoy.
- [ ] **IF-06** Se ve bien en claro y oscuro, a 360 px y en desktop. Con la entrada en fundido de hoy (cards que cargan después), entran juntas la imagen y su fondo.
- [ ] **IF-07** El presupuesto de JS no crece (`seo.md`): es solo CSS y marcado del servidor.

## Fuera de alcance

- Recuadro con la proporción de cada imagen (el contrato no trae ancho ni alto; ver Q1).
- Abrir la imagen a pantalla completa.
- La vista previa del editor y el widget de imágenes de una comunidad, que ya muestran la imagen entera.

## Preguntas

- **Q1. Proporción del recuadro:** Reddit adapta el alto a cada imagen porque conoce sus medidas. Nosotros no las tenemos, así que el recuadro sigue en 16:9 (**recomendado**) y las imágenes verticales llevan barras a los costados. Para adaptar el alto, se le propondría al backend `imageWidth` e `imageHeight` en el post (otra spec).

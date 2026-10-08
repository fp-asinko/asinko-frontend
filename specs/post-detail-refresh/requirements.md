# Detalle de post, segunda vuelta — Requirements

> **Estado:** aprobado por el PO el 2026-10-08, con Q1 y Q2 como se recomendaron. La fórmula de Mejores (Q1) va en la propuesta P-014 para que el backend la revise.
> **Fuente:** pedido del PO (2026-10-08), con una captura de un post de Reddit: "no tenemos botón para volver, no tenemos opciones para ordenar los comentarios como hace Reddit o buscar comentarios, y también me gustaría ir implementando la lógica de que cada 10 comentarios se muestre un anuncio, con una estructura y estilo similar. El campo de agregar un comentario ('Únete a la conversación') es mucho más angosto, no es tan alto."

## Objetivo

Que el detalle de un post se use como el de Reddit: volver con un toque, una caja de comentario que no ocupa lugar hasta que se usa, ordenar y buscar comentarios, y el primer lugar para anuncios entre los comentarios.

## User stories

- Como usuario, quiero volver a donde estaba sin buscar el botón del navegador.
- Como usuario, quiero ver primero los mejores comentarios, o los más nuevos, o buscar uno.
- Como Asinko, quiero mostrar anuncios entre los comentarios sin que molesten más que un comentario.

## Criterios de aceptación

### Volver

- [ ] **PD-01** Arriba de la cabecera del post, a la izquierda, un botón redondo gris con una flecha (como Reddit), con nombre accesible "Volver". Lleva a la página anterior si se llegó desde el sitio, o al Home si se abrió el link directo. En mobile y desktop.

### La caja de comentario

- [ ] **PD-02** Cerrada, la caja es una píldora de una línea (unos 44 px de alto) con el texto "Únete a la conversación". Al tocarla o enfocarla se abre el campo de varias líneas con Cancelar y Comentar; si se sale sin escribir nada, vuelve a ser la píldora. Lo escrito no se pierde al salir del campo.

### Ordenar

- [ ] **PD-03** "Ordenar por: Mejores ▾" abre un menú con **Mejores** (por defecto), **Top**, **Nuevos** y **Antiguos**. Ordena los comentarios de primer nivel y las respuestas de cada uno.
- [ ] **PD-04** El orden queda en la URL (`?sort=new`): se comparte, sobrevive al recargar y vuelve con "atrás". Un valor desconocido es el orden por defecto.

### Buscar

- [ ] **PD-05** Un campo "Buscar comentarios" (píldora con lupa). Al enviar, en lugar del árbol se muestran los comentarios que coinciden (de cualquier nivel), cada uno con su autor y su fecha, y "N resultados para «texto»" con un botón para volver a todos.
- [ ] **PD-06** La búsqueda queda en la URL (`?q=`). Sin resultados, lo dice. Se busca desde 2 caracteres; el texto se valida (hasta 100 caracteres).

### Anuncios

- [ ] **PD-07** Después de cada 10 comentarios en el orden de lectura (contando respuestas: el anuncio puede quedar entre un comentario y sus respuestas), un anuncio con la forma de un comentario: logo, nombre del anunciante, "Anuncio", texto, un botón "Más información", el dominio del destino y, si tiene, una imagen. En mobile y desktop. No aparece en los resultados de búsqueda.
- [ ] **PD-08** Los anuncios son propios (de la casa): salen de un endpoint que se le propone al backend (mockeado hasta que exista). Sin redes de anuncios, scripts ni cookies de terceros.
- [ ] **PD-09** El link de un anuncio abre en otra pestaña, con `rel="sponsored noopener noreferrer"`, solo `http(s)` y el dominio real a la vista (`security.md § 1`). Si los anuncios no cargan, los comentarios se ven igual, sin huecos.
- [ ] **PD-10** Un lector de pantalla oye que es un anuncio antes que su contenido.
- [ ] **PD-15** **Dentro del post** (como Reddit): debajo de los votos y antes de la caja de comentario, un anuncio con la misma forma. Se suma a los de cada 10 comentarios, que siguen en los hilos largos; rotan sin repetir el de arriba.
- [ ] **PD-16** **En los feeds**: en todos (Home Para vos y Siguiendo, y las páginas de comunidad, activo y perfil), un anuncio después de cada 10 posts o encuestas, contando los de las páginas que se cargan después. Se ve como una tarjeta de post: logo y anunciante con "Anuncio", el texto, la imagen grande si tiene y "Más información" con el dominio. Si los anuncios fallan, el feed se ve igual.
- [ ] **PD-17** **Más aire en el detalle** (pedido del PO, 2026-10-08, con una captura de Reddit): el post de su página separa más que la tarjeta del feed: 14 px entre el encabezado y el título, 12 px hasta el cuerpo, 16 px entre párrafos y 24 px hasta los votos; los comentarios, 20 px entre el título, la caja, el orden y la lista. La tarjeta del feed no cambia.

### Calidad

- [ ] **PD-11** El navegador no llama a la API: orden, búsqueda y anuncios llegan del servidor (`api-integration.md`). El front no ordena ni filtra: lo hace el backend (propuesto y mockeado).
- [ ] **PD-12** A 360 px todo entra sin scroll horizontal; áreas táctiles de 44 px en el botón de volver, la caja y el orden. La búsqueda es más chica (40 px de alto, hasta 240 px de ancho, al lado del orden; pedido del PO, 2026-10-08).
- [ ] **PD-13** Textos nuevos en en, es y pt; axe sin violaciones en claro y oscuro.
- [ ] **PD-14** Primera carga dentro del presupuesto de JS (`seo.md`, 240 KB).

## Fuera de alcance

- Órdenes Controvertidos y P&R (necesitan votos a favor y en contra por separado, y respuestas del autor).
- Medir impresiones y clics de anuncios, segmentación, y una red de anuncios real.
- Menú "⋯" del anuncio (ocultar, reportar).
- Resaltar en el árbol el comentario que se abrió desde un resultado.

## Dependencias

- **Propuesta al backend P-014:** `GET /posts/:id/comments?sort=best|top|new|old&q=` (orden y búsqueda).
- **Propuesta al backend P-015:** `GET /api/v1/ads?placement=comments` (anuncios de la casa).
- `BackButton` hoy vive en `features/communities`: pasa a `components/` para que lo use el feed.

## Cambio de alcance con el PO (2026-10-08, al no ver anuncios)

Con una captura de Reddit: "en el detalle se tiene que mostrar dentro del post, como hace Reddit" y "en la Home se tienen que ver cada 10". Decisiones: el del post **se suma** a los de los comentarios; cada 10 en **todos los feeds**; en el feed, **como una tarjeta de post** (PD-15, PD-16).

## Decisiones del PO (2026-10-08)

- **Anuncios:** propios, mockeados (no una red de anuncios).
- **Órdenes:** Mejores, Top, Nuevos y Antiguos.
- **Backend:** orden y búsqueda se proponen al backend y se mockean; el front no calcula.
- **Frecuencia:** cada 10 comentarios contando las respuestas.

## Preguntas resueltas (2026-10-08)

- **Q1. Mejores** sin votos a favor y en contra por separado no puede ser el de Reddit (Wilson). Propuesta para el mock y la propuesta al backend: puntaje con decaimiento por antigüedad (`score / (horas + 2)^1,5`, como Hacker News). **Recomendado.** Alternativa: igual a Top hasta que el backend lo defina.
- **Q2. Anuncios de ejemplo:** los mocks necesitan anunciantes. Propuesta: anuncios de la casa de Asinko ("Publicá tu primera tesis", "Invitá a un amigo") y dos anunciantes de ejemplo inventados y marcados como tales. **Recomendado.**

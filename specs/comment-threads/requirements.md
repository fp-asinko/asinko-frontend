# Hilos de comentarios como Reddit — Requirements

> **Estado:** borrador para el PO (2026-10-08). Preguntas abiertas al final.
> **Fuente:** pedido del PO (2026-10-08): "en la sección de comentarios del post: primero fijate tamaño de imágenes y texto de Reddit; segundo agregar el botón de compartir como tiene Reddit; tercero agregar esa especie de cableado para abrir y cerrar comentarios y que estén unidos, copialo tal cual".
> **Medido** en un post de Reddit (r/AskReddit, 2026-10-08, 1280 px, sin sesión), con Playwright: tamaños, colores y geometría de las líneas en `design.md § 1`.

## Objetivo

Que los comentarios de un post se lean como los de Reddit: avatares y texto del mismo tamaño, cada respuesta unida a su comentario por una línea con curva, cada hilo se cierra y se abre desde la línea, y cada comentario se puede compartir.

## User stories

- Como usuario, quiero ver a quién responde cada comentario sin contar sangrías.
- Como usuario, quiero cerrar un hilo que no me interesa y seguir leyendo el resto.
- Como usuario, quiero mandarle a alguien un comentario puntual.

## Criterios de aceptación

### Tamaños (como Reddit)

- [ ] **CT-01** Avatar del comentario de 32 px (antes 20) desde `sm`, de 24 px en mobile, en una columna del mismo ancho. El autor en negrita y la fecha a 12 px, separados por "•", al lado del avatar y centrados con él.
- [ ] **CT-02** El cuerpo a 14 px con 20 px de interlineado (antes 13 px), alineado con el autor (8 px después de la columna del avatar).
- [ ] **CT-03** La fila de acciones de 32 px de alto: votos (flechas de 32 px con el número en el medio), Responder y Compartir como texto con ícono a 12 px en semibold, sin fondo hasta el hover. Entre un comentario y el siguiente, 4 px.

### El cableado

- [ ] **CT-04** Un comentario con respuestas tiene una **línea vertical** de 1 px, gris claro, que baja desde debajo de su avatar, por el centro de la columna del avatar.
- [ ] **CT-05** Cada respuesta se une a esa línea con un **codo**: baja por la línea y dobla con una curva (radio de 12 px) hasta el centro del avatar de la respuesta. La línea termina en el codo de la última respuesta: no sigue de largo.
- [ ] **CT-06** En la línea, a la altura de la fila de acciones, un botón **⊖** (16 px, sobre fondo blanco que tapa la línea) **cierra el hilo**: quedan el autor y la fecha, con **⊕** en lugar del avatar; se ocultan el cuerpo, las acciones y las respuestas. **⊕** lo vuelve a abrir. Toda la franja de la línea (32 px de ancho) también cierra el hilo al tocarla, y se oscurece al pasar el mouse.
- [ ] **CT-07** Un comentario sin respuestas también se puede cerrar con ⊖ (como Reddit).
- [ ] **CT-08** Las respuestas plegadas desde el nivel 4 (PC-14) se muestran como Reddit: **⊕ N respuestas más** sobre la línea, con su codo; al tocarlo se abren.
- [ ] **CT-09** Teclado y lectores de pantalla: ⊖ y ⊕ son botones con nombre ("Cerrar el comentario de @maria", "Abrir el comentario de @maria") y `aria-expanded`. Cerrar un hilo deja el foco en ⊕. La franja de la línea es solo para el mouse (el teclado usa ⊖).
- [ ] **CT-10** Lo que se está enviando (comentarios pendientes) y los anuncios entre comentarios cuelgan de la misma línea; el anuncio sin codo.

### Compartir

- [ ] **CT-11** "Compartir" en cada comentario (Q1): en un teléfono abre el menú de compartir del sistema; en desktop copia el link al comentario y el botón dice "Link copiado" por 2 segundos (anunciado a lectores de pantalla).
- [ ] **CT-12** El link es la página del post con el ancla del comentario (`/post/{id}/{slug}#comment-{id}`). Abrirlo lleva a ese comentario y lo resalta un momento. Si está dentro de un hilo plegado, se abre el hilo.

### Calidad

- [ ] **CT-13** A 360 px nada genera scroll horizontal, con 4 niveles de respuestas.
- [ ] **CT-14** Textos nuevos en en, es y pt; axe sin violaciones en claro y oscuro. La línea es decorativa (`aria-hidden`), sin requisito de contraste; ⊖ y ⊕ con 3:1.
- [ ] **CT-15** El árbol sigue siendo un Server Component (el Markdown no llega al navegador); el JS nuevo cabe en el presupuesto (`seo.md`, 240 KB).

## Fuera de alcance

- **Award** y el menú **⋯** del comentario de Reddit (Q2).
- Cargar más respuestas desde el servidor ("Ver más respuestas" de Reddit sin sesión): hoy llegan todas con el post.
- Recordar qué hilos cerró cada persona al recargar.

## Preguntas abiertas

- **Q1. Compartir:** ¿menú del sistema en el teléfono y copiar el link en desktop (**recomendado**, sin dependencias y sin pantalla nueva)? Alternativa: un menú como el de Reddit ("Copiar link", "Embeber"), que suma un desplegable.
- **Q2. Award y ⋯:** ¿los dejamos afuera (**recomendado**: Award es de la fase 4, economía, y ⋯ no tiene acciones todavía) o los mostramos como "Próximamente"?
- **Q3. Mobile:** Reddit usa 24 px en pantallas chicas para que entren los niveles. ¿24 px hasta `sm` (640 px) y 32 px desde ahí (**recomendado**)? Alternativa: 32 px siempre.
- **Q4. Compartir el post:** el "Compartir" del post hoy es "Próximamente". ¿Lo hacemos funcionar igual en este spec (**recomendado**, es el mismo botón)? Alternativa: dejarlo para después.

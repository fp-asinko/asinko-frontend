# El perfil como vidriera, como LinkedIn — Requirements

> **Estado:** aprobado por el PO el 2026-10-19: "vayamos las primeras 4" (completá tu perfil, acerca de, destacados, abierto a). Q1: **la bio se agranda** a "Acerca de" (un solo texto). Q2: se destacan **posts y tesis**. Q3: se destaca **desde cada post o tesis** (menú "⋯"). Q4: "Abierto a" son **opciones de una lista**.
> **Fuente:** pedido del PO (2026-10-19), con capturas de un perfil de LinkedIn ("Sugerencias para ti", "Acerca de", "Destacado", "Tengo interés en…") y del perfil de hoy.
> **Revierte** parte del fuera de alcance de `specs/profile-presentation` (las "sugerencias" de LinkedIn), por pedido del PO.
> **Backend:** la bio llega hasta 160 caracteres y no hay destacados ni "Abierto a". Se proponen (P-024 a P-026) y se mockean.

## Objetivo

Que tu perfil se sienta tuyo y se arme rápido: te dice qué te falta, cuenta tu historia, pone lo mejor al frente y dice para qué estás disponible.

## User stories

- Como usuario, quiero ver qué le falta a mi perfil y completarlo con un toque, para que se vea completo.
- Como usuario, quiero contar mi estrategia en más de 160 caracteres, para que se entienda cómo invierto.
- Como usuario, quiero fijar mis mejores posts y tesis arriba, para que quien me visita vea lo mejor primero.
- Como usuario, quiero decir para qué estoy disponible (preguntas, mentorías…), para que me contacten por eso.
- Como visitante, quiero ver eso de un vistazo, para decidir si sigo a alguien.

## Criterios de aceptación

### Completa tu perfil (solo para ti)

- [x] **PS-01** En tu perfil, entre la presentación y las pestañas, una tarjeta **"Completa tu perfil"** con el ojo y "Solo para ti", como LinkedIn: cuántos pasos llevas ("3 de 8") con una barra, y las **dos** próximas sugerencias como tarjetas, cada una con su texto y su botón.
- [x] **PS-02** Los 8 pasos, en este orden: foto, titular, acerca de, ubicación, links, abierto a, banner y destacados. Los de los campos abren "Editar perfil" en esa sección; el de destacados explica cómo (el "⋯" de un post o una tesis) y lleva a la pestaña Posts.
- [x] **PS-03** Con todo completo, la tarjeta no aparece. **Ocultar** la cierra en ese navegador; en el perfil de otra persona nunca aparece.
- [x] **PS-13** (pedido del PO, 2026-10-19) Al **ocultarla**, en su lugar queda una línea: "Ocultaste «Completa tu perfil»" con **Deshacer**, que la vuelve a mostrar. El foco va a Deshacer y vuelve a la ✕ al deshacer. La línea se va al salir de la página.
- [x] **PS-14** Oculta, la ventana **Editar perfil** ofrece al final **Mostrar «Completa tu perfil»**. Al tocarlo, lo dice ("Vas a volver a verla en tu perfil") y el perfil la muestra de nuevo.

### Acerca de (Q1)

- [x] **PS-04** La bio pasa a llamarse **Acerca de** y llega a **2000** caracteres (contador en "Editar perfil", como hoy). Se muestra en texto plano con sus saltos de línea, recortada a **3 líneas** con **Ver más**, que funciona sin JavaScript y con teclado.

### Destacados (Q2, Q3)

- [x] **PS-05** Debajo de la presentación, una sección **Destacados** con hasta **3** posts o tesis, del último destacado al primero. Cada uno es una tarjeta chica: si es post o tesis, el título (o el claim), la comunidad y, en una tesis, su estado (con ✓ / ✗ o su nombre, como hoy). Un post lleva a su página; una tesis, a la pestaña Tesis. En el teléfono las tarjetas se deslizan de costado; desde `md`, en tres columnas.
- [x] **PS-06** Sin destacados, la sección no aparece para nadie (en tu perfil, el paso de PS-02 te lo ofrece).
- [x] **PS-07** En **tu** perfil, cada post y cada tesis (en sus pestañas y en Destacados) tiene un menú **"⋯"** con **Destacar en el perfil** o **Quitar de destacados**. Con 3 destacados, "Destacar" dice que hay que quitar uno primero. El cambio se ve al instante y se anuncia.
- [x] **PS-08** Solo se destaca contenido propio y no borrado; si un destacado se borra, deja de mostrarse.

### Abierto a (Q4)

- [x] **PS-09** En "Editar perfil", una sección **Abierto a** con opciones de una lista, varias a la vez: **Preguntas**, **Colaboraciones**, **Mentoría**, **AMAs** y **Análisis por encargo**.
- [x] **PS-10** En el perfil, si eligió alguna, una tarjeta **Abierto a** debajo de la presentación con una píldora gris por opción, traducidas. En tu perfil, con un lápiz que abre "Editar perfil" en esa sección.

### Calidad

- [x] **PS-11** Mobile first a 360 px; axe sin violaciones en claro y oscuro; textos en en, es y pt; la primera carga del perfil dentro de 240 KB de JS (`seo.md`: queda ~1,7 KB; el menú "⋯" se carga al primer uso).
- [x] **PS-12** `proposals.md` con P-024 a P-026 y los mocks con su forma y sus errores.

## Fuera de alcance

- Reordenar los destacados a mano, o destacar links e imágenes externas (LinkedIn lo permite).
- Markdown y menciones en "Acerca de": necesitan que el backend resuelva las menciones de la bio (`entities`). Por ahora, texto plano como el titular (`specs/profile-presentation` PP-11).
- El menú "⋯" en el feed o en el detalle del post: solo en tu perfil.
- Análisis de visitas, "Seguido por…", perfiles similares y verificación (las ideas 6 a 9 del 2026-10-19).
- Filtrar personas por "Abierto a".

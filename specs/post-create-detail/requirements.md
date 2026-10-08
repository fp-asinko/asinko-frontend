# Crear post y detalle de post — Requirements

> **Estado:** aprobado por el PO el 2026-10-07.
> **Fuente:** [`docs/references/ASINKO-requirements.pdf`](../../docs/references/ASINKO-requirements.pdf), sección "Creación y detalle de posts" (págs. 5 y 6), y el pedido del PO: "me gusta la idea que esté arriba, pero cuando el usuario empieza a scrollear pierde un shortcut cercano".
> **Decisiones con el PO (2026-10-07):**
>
> - "+ Crear" fijo en la barra superior.
> - Un solo editor: modal en desktop y pantalla completa en mobile.
> - Texto y Link; Imagen cuando se defina la subida.
> - Una spec con el detalle y crear.
>
> **Cambio con el PO (2026-10-07, al ver el modal):** el modal se ve antiestético. Como X, el editor vive **en la caja de arriba**, que se expande en el lugar, minimalista y con animación. En mobile, pantalla completa. La comunidad se elige con un chip que abre una lista corta animada.

## Referencias: cómo lo resuelven otras apps

| App               | Acceso a crear                                                                                                                 | Editor                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Reddit            | "+ Create" fijo en la barra superior (desktop); "+" en la barra inferior (mobile); caja "Create post" arriba de cada subreddit | Página aparte (`/submit`): comunidad, pestañas Text / Images / Link / Poll |
| X                 | Caja arriba del timeline; botón "Post" fijo en la columna izquierda (desktop); botón flotante (mobile)                         | Modal (desktop), pantalla completa (mobile)                                |
| Instagram         | "+" en la barra inferior (mobile) y "Create" en la barra lateral (desktop)                                                     | Modal paso a paso                                                          |
| Threads, LinkedIn | Caja arriba del feed y un ícono de crear en la navegación                                                                      | Modal                                                                      |

**Conclusión:** la caja de arriba sirve para descubrir que se puede publicar, pero siempre hay **un acceso fijo que no se pierde al scrollear**, y **todos los accesos abren el mismo editor**. En Asinko, mobile ya tiene "Crear" en la barra inferior (hoy Próximamente). El acceso fijo falta en desktop.

## Objetivo

Que una persona con cuenta publique un post (texto o link) desde cualquier parte del sitio, sin perder dónde estaba, y llegue al post publicado. Que cualquiera pueda abrir un post y ver la conversación completa, comentar y votar.

## User stories

- Como usuario, quiero un botón para publicar siempre a mano, aunque haya bajado en el feed.
- Como usuario, quiero que, si estoy en un grupo o un activo, el post vaya ahí sin tener que elegirlo.
- Como lector, quiero abrir un post y leer todos sus comentarios, con las respuestas anidadas.
- Como usuario, quiero comentar, responder a un comentario y votar comentarios.

## Criterios de aceptación

### Acceso a crear

- [ ] **PC-01** **Desktop:** un botón **"+ Crear"** fijo en la barra superior, junto a las notificaciones, en todas las páginas. Sube hasta la caja de arriba y la abre; en una página sin caja (el detalle de un post, el perfil de otra persona) lleva al Home con la caja abierta.
- [ ] **PC-02** **Mobile:** el "Crear" de la barra inferior deja de ser Próximamente y abre el editor a pantalla completa.
- [ ] **PC-03** **La caja de arriba** (Home y páginas de grupo, activo y tu perfil) **es** el editor: en desktop se expande en el lugar; en mobile abre la pantalla completa. Sus atajos Post / Tesis / Live: Post abre el editor; Tesis y Live siguen como Próximamente (fuera de esta etapa).
- [ ] **PC-04** **Sin sesión**, cualquier acceso abre el modal de cuenta con el texto de publicar (acción `post`, ya existente).

### Editor

- [ ] **PC-05** **Un solo editor:** la caja expandida en desktop, pantalla completa en mobile. Se cierra con Cancelar o Esc (y la flecha atrás en mobile). Si tiene texto escrito, pide confirmar antes de descartarlo.
- [ ] **PC-06** **Comunidad:**
  - En la página de un grupo o un activo viene elegida esa comunidad; en tu perfil, tu canal personal.
  - En el resto, se elige con un buscador de comunidades: las tuyas primero y tu canal personal como "Tu perfil".
  - Se puede cambiar siempre.
- [ ] **PC-07** **Tipo:** pestañas **Texto** y **Link**.
  - **Imagen** se ve como Próximamente hasta que se defina la subida (ver Dependencias).
  - Encuesta y Tesis no están en esta etapa.
- [ ] **PC-08** **Campos:**
  - **Título** obligatorio, hasta 300 caracteres, con contador cerca del límite.
  - **Cuerpo** obligatorio, en Markdown (texto plano con la sintaxis de siempre; sin barra de formato en esta etapa).
  - **URL** obligatoria solo en Link, y solo `http(s)`.
  - La etiqueta (`tag`) no se pide: se dejó de mostrar en las tarjetas (`feed-cards` § 14).
- [ ] **PC-09** **Validación** en el cliente para ayudar (campos vacíos, largo, URL) y la que cuenta en el servidor (`422`). Los errores se muestran junto a cada campo, traducidos.
- [ ] **PC-10** **Publicar:**
  - El botón queda deshabilitado mientras falte algo o mientras se envía (sin doble envío, `security.md § 7`).
  - Al publicar, se navega al **detalle del post nuevo**.
  - Si falla, el texto no se pierde y se explica por qué. Por ejemplo, `403 PERSONAL_CHANNEL_OWNER_ONLY`: "Solo podés publicar en tu propio perfil".
- [ ] **PC-11** **Seguridad:** el `userId` sale de la sesión en la Server Action, nunca del formulario (`api-integration.md`). El cuerpo se muestra después con el Markdown seguro de siempre.

### Detalle de post

- [ ] **PC-12** **Ruta propia** por post, como Reddit: `/post/{id}/{slug}`, con el slug sacado del título (decidido por el PO). Es pública si la comunidad es pública, con metadata (título y extracto) y canonical por idioma. Un post que no existe da 404.
- [ ] **PC-13** **El post completo:** cabecera (grupo y autor), título, cuerpo entero (sin "Ver más"), link o imagen, votos y compartir. El mismo estilo de las tarjetas.
- [ ] **PC-14** **Comentarios:** el árbol completo con las respuestas anidadas (`GET /posts/{id}/comments`), sin paginar en esta etapa. Las respuestas profundas se pueden colapsar.
- [ ] **PC-15** **Comentar y responder:**
  - Una caja para comentar el post, y "Responder" en cada comentario (`parentCommentId`).
  - Sin sesión, el modal de cuenta.
  - El comentario nuevo aparece al instante en su lugar.
- [ ] **PC-16** **Votar comentarios** (`PUT/DELETE /comments/{id}/vote`) con el mismo control de votos de los posts, reducido.
- [ ] **PC-17** **Desde el feed:** el título de cada tarjeta y "Ver todos los comentarios" llevan al detalle.

### Calidad

- [ ] **PC-18** Mobile first: a 360 px sin scroll horizontal, editor usable con el teclado del teléfono abierto. Teclado y lector de pantalla: el foco entra al editor al abrirlo y vuelve al botón al cerrarlo. axe sin violaciones, en claro y oscuro.
- [ ] **PC-19** El editor se carga diferido (`next/dynamic`) al primer uso: el JS de primera carga sigue dentro del presupuesto (`seo.md`).
- [ ] **PC-20** Textos nuevos en en, es y pt.

## Fuera de alcance

- Imagen, hasta definir la subida. Encuestas y tesis. Editar o borrar posts y comentarios (PDF).
- Borradores guardados, programar posts, menciones con autocompletado (`$ # @`, P-001).
- Notificaciones y búsqueda.

## Dependencias

- **Sesión:** se publica con el Dev login (cuenta de prueba) o con mocks. El login real es otra spec; el PDF dice que el alta y el login ya existen en `asinko-app`.
- **Backend** (ya en `dev`): `POST /posts` (publicar en cualquier comunidad salvo el canal personal de otro), `GET /posts/{id}`, comentarios y votos de comentarios.
- **Imagen:** la URL tiene que ser del bucket `post-images` de Supabase Storage, pero no está definido quién sube el archivo. Se pregunta al backend (posible P-013) antes de sumar Imagen.

## Preguntas resueltas (2026-10-07)

- [x] **Ruta del detalle:** `/post/{id}/{slug}`, como Reddit.
- [x] **Subida de imágenes:** se le pregunta al backend como **P-013** en `proposals.md`. Imagen queda como Próximamente hasta entonces.

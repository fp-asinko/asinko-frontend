# Página de crear post — Requirements

> **Estado:** aprobado por el PO el 2026-10-15. Q1: la caja del Home también lleva a la página, **con un backup del editor de hoy** (rama `backup/compose-modal-inline`, en `e98edea`). Q2: `/submit` traducida con `?community=`. Q3: la tarjeta con banner, la información de la comunidad o del activo y sus reglas. Q4: el borrador local en este spec; la vista previa y la barra de formato, en specs aparte.
> **Fuente:** pedido del PO (2026-10-15), con una captura de la página "Create post" de Reddit: "mejorar el create post de comunidades, activos, etc. (hoy estilo modal) a una página distinta, como hace Reddit, página única donde te deja cambiar de comunidades, activos; es importante que a la derecha aparezca la comunidad como hace Reddit".
> **Hoy** (`specs/post-create-detail`, `specs/post-image`): el editor se abre en tres lugares. En la caja del Home se despliega ahí mismo; con "Crear" (barra superior, barra inferior, encabezado de una comunidad) se abre como ventana en desktop y a pantalla completa en el teléfono. La comunidad de la página viene elegida (`ComposeScope`).

## Objetivo

Publicar en una página propia, como Reddit: la comunidad elegida arriba (y se puede cambiar), el formulario al centro y, a la derecha, la tarjeta de esa comunidad para saber dónde y con qué reglas se publica.

## User stories

- Como usuario, quiero una página tranquila para escribir un post largo, sin una ventana encima del feed.
- Como usuario, quiero ver a qué comunidad publico, su descripción y sus reglas mientras escribo.
- Como usuario, quiero cambiar de comunidad o de activo sin perder lo que escribí.

## Criterios de aceptación

### La página

- [x] **SU-01** Una página propia para crear un post, con su URL (Q2): `/en/submit`, `/es/publicar`, `/pt/publicar`, con la comunidad en la URL (`?community=defi`). Se puede recargar y compartir; "atrás" vuelve a donde estabas.
- [x] **SU-02** (Q1) Todos los "Crear" llevan a la página: barra superior, barra inferior, encabezado de un grupo, activo o perfil propio, y el estado vacío del feed. Desde una comunidad, llega con ella elegida. _Cambio del PO (2026-10-21): sin sesión, el "Crear" de la barra superior y el de la inferior no aparecen (los botones de cuenta ya dicen cómo entrar)._
- [x] **SU-03** Arriba, el **selector de comunidad** (el de hoy: tus comunidades, tu perfil y la búsqueda, con grupos y activos). Cambiarla actualiza la URL y la tarjeta de la derecha, sin perder lo escrito.
- [x] **SU-04** El formulario es el de hoy: formatos Texto, Link e Imagen (con su descripción), título con contador, cuerpo con menciones y emojis, y Publicar. Publicar lleva al post nuevo, como hoy.
- [x] **SU-05** Lo escrito no se pierde al salir: queda como borrador local (SU-12). Cancelar con algo escrito pregunta antes de descartar (el aviso de hoy, que borra el borrador). Cerrar o recargar la pestaña no avisa: el borrador ya lo guardó (cambio de la implementación, 2026-10-15).
- [x] **SU-06** Sin sesión, la página muestra el aviso para entrar en lugar del formulario (hoy: el modal de cuenta).

### La comunidad a la derecha

- [x] **SU-07** (Q3) En desktop (desde `lg`), la columna derecha muestra la **tarjeta de la comunidad elegida**, como Reddit: su banner (o el degradé de su color), avatar, handle, nombre, descripción, miembros y fecha de creación (de un grupo), o el nombre del activo; y debajo sus **reglas**. Sin comunidad elegida, una tarjeta con consejos para publicar.
- [x] **SU-08** En tablet y teléfono, donde no hay columna derecha, las reglas de la comunidad se ven en un desplegable debajo del selector.

### Borrador (Q4)

- [x] **SU-12** Lo que se escribe se guarda en el navegador mientras se escribe (la comunidad, el formato, el título, el cuerpo y el link). La imagen no: una subida sin publicar queda huérfana en el backend y su URL puede vencer, así que al recuperar se vuelve a elegir (cambio de la implementación, 2026-10-15). Al volver a la página con un borrador, un aviso ofrece **Recuperar** o **Descartar**. Publicar o descartar lo borra. Sin sesión no se guarda nada.

### Calidad

- [x] **SU-09** Mobile first: a 360 px, la página entra sin scroll horizontal, con Publicar al alcance. Teclado: el foco entra en el título; axe sin violaciones en claro y oscuro.
- [x] **SU-10** Textos en en, es y pt; metadata de la página (título "Crear post", `noindex`).
- [x] **SU-11** El editor se carga solo en esta página: deja de viajar en la primera carga del resto (el presupuesto de JS debería bajar en el Home y en las páginas de comunidad).

## Fuera de alcance

- Borradores guardados en el servidor ("Save Draft" / "Drafts" de Reddit): el backend no tiene borradores.
- Etiquetas ("Add tags" de Reddit): el `tag` del post existe en el contrato, pero no hay lista de etiquetas por comunidad.
- Barra de formato del cuerpo (negrita, listas, citas): hoy se escribe Markdown a mano.
- Crear tesis o encuestas (fase 2).

## Mejoras propuestas (Q4: el borrador entra; las otras, en specs aparte)

- **Borrador local:** lo escrito se guarda en el navegador mientras escribís y se ofrece al volver a la página (reemplaza al "Save Draft" de Reddit sin backend).
- **Vista previa:** una pestaña "Vista previa" que muestra el post como va a quedar en el feed (la misma tarjeta), Markdown y menciones incluidos.
- **Barra de formato** del cuerpo, como Reddit: negrita, itálica, link, lista, cita y código, que escriben el Markdown por vos.

## Preguntas resueltas (2026-10-15)

- **Q1. ¿Qué pasa con la caja "¿Qué estás pensando?" del Home?** ¿Lleva también a la página, como en Reddit (**recomendado**: un solo lugar para publicar, y el editor deja de cargarse en el Home, que baja el JavaScript), o sigue abriendo el editor ahí mismo?
- **Q2. ¿URL?** ¿`/submit` traducida (`/es/publicar`, `/pt/publicar`) con `?community=` (**recomendado**: una página para todo, y cambiar de comunidad es cambiar la query), o colgada de cada comunidad (`/hub/defi/submit`, como Reddit)?
- **Q3. ¿Qué lleva la tarjeta de la derecha?** ¿La tarjeta de la comunidad y sus reglas (**recomendado**: es lo que importa al publicar) o solo la tarjeta, como en tu captura?
- **Q4. ¿Sumamos alguna mejora?** Recomiendo el **borrador local** (chico y evita perder lo escrito) en este spec; la vista previa y la barra de formato, en specs aparte.

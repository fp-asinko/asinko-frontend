# Thoughts y posts sin cuerpo — Requirements

> **Estado:** aprobado por el PO el 2026-10-25, con una captura del prototipo para la tarjeta del thought. Q1: un thought abre **su propia página**. Q2: el ícono de comillas de la caja de publicar **se habilita** y lleva a crear un thought. Q3: un thought largo se corta con **"Ver más"**.
> **Fuente:** lo que implementó el backend el 2026-10-23 (`asinko-app` dev, `9924924`, "thoughts y posts sin cuerpo"), verificado en su código:
>
> - **Post sin cuerpo:** un post TEXT, LINK o IMAGE puede no tener cuerpo (solo título, o título e imagen). Llega con `body: ""`. El título sigue siendo obligatorio.
> - **Thought:** `POST /posts` con `type: "THOUGHT"` y solo `body` (obligatorio, sin límite de caracteres): sin título, imagen ni link. Se guarda con `title: ""`. Se publica en una comunidad, como cualquier post.
> - En los feeds, la búsqueda, el perfil y los destacados llega como `kind: "THOUGHT"`, con el mismo contenido que un post (`type: "THOUGHT"`). `?kind=THOUGHT` lo filtra; `?kind=POST` no lo incluye.
> - Se vota, se comenta y se edita con los mismos endpoints de `/posts/{id}`. Su cuerpo no se puede vaciar.
>
> Se trabajó local y se subió a `develop` el 2026-10-26, a pedido del PO.

## Criterios de aceptación

### Posts sin cuerpo

- [x] **TH-01** Al crear un post (Text, Link o Image), el cuerpo es **opcional**: se puede publicar con solo el título, o con título e imagen. El título sigue siendo obligatorio.
- [x] **TH-02** Un post con `body: ""` se ve con su título (y su imagen o link, si tiene), sus votos y sus comentarios, sin un párrafo vacío ni "Ver más". En su página igual. Su descripción para compartir sale del título.

### Crear un thought

- [x] **TH-03** La página de crear post suma la pestaña **Thought**: sin título, sin link ni imagen, con un solo campo para el texto, obligatorio. Se elige la comunidad como en los demás formatos; las relacionadas y la marca, igual. El campo es el del prototipo (captura del PO, 2026-10-25): su propia caja, comillas grandes, el texto en itálica, y abajo, tras una línea, "Frases breves y memorables" y los caracteres que quedan, de **250**. El límite es nuestro: el backend no tiene (`design.md § 4`).
- [x] **TH-04** El ícono de comillas de la caja de publicar deja de ser "Próximamente" y lleva a crear post con la pestaña Thought elegida (Q2), como el link y la imagen.
- [x] **TH-05** Al publicar, se llega a la página del thought.

### Verlo

- [x] **TH-06** En los feeds (Home, grupos, activos, perfil, destacados y búsqueda) un thought se ve con su propia tarjeta, siguiendo el prototipo con nuestro sistema: la cabecera de siempre (grupo y autor), la marca **THOUGHT** con su ícono a la derecha (como POLL), y el texto como una **cita**: comillas grandes, más grande e itálica. Abajo, votos, comentarios (con la caja para comentar) y compartir, como un post.
- [x] **TH-07** Un thought largo se corta a unas 6 líneas con "Ver más" (Q3). Sus menciones `$ # @` y su Markdown se ven como en un post.
- [x] **TH-08** Tocarlo abre **su página** (Q1): la cita grande arriba en lugar del título (es el `<h1>`), con votos, comentarios y compartir. Su link y su descripción para compartir salen del texto.
- [x] **TH-09** El filtro "Nuevos" del Home incluye los thoughts; "Encuestas" no.

### Calidad

- [x] **TH-10** Textos en en, es y pt. A 360 px sin scroll horizontal. Axe sin violaciones en claro y oscuro. Presupuesto de JS dentro de 240 KB. Un lector de pantalla oye que es un thought y su texto.
- [x] **TH-11** Los mocks crean y devuelven thoughts y posts sin cuerpo como el backend. `pnpm api:smoke` valida `kind: "THOUGHT"` contra `dev`.

## Fuera de alcance

- Editar un thought (el front todavía no edita posts).
- Un filtro "Thoughts" en el Home.
- Los "128 upvotes" arriba de la tarjeta del prototipo: los votos ya se ven en la fila de abajo.

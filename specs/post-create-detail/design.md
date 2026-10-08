# Crear post y detalle de post — Design

> **Estado:** aprobado por el PO el 2026-10-07.

## 1. Rutas

- **Detalle:** `/post/{id}/{slug}`, como Reddit (`/r/…/comments/{id}/{slug}`). El slug sale del título y solo es para leer y para SEO: manda el `id`.
  - `src/app/[locale]/post/[id]/[[...slug]]/page.tsx`.
  - Sin slug, o con uno que no coincide, redirige 308 al canónico (`/post/{id}/{slug-correcto}`).
  - Fuera de `(main)` y sin `loading.tsx`, como las páginas de comunidad: 308 y 404 reales (`i18n.md § 404`). Los comentarios se transmiten con su propio `Suspense`.
- **`postPath(id, title)`** en `src/lib/posts/paths.ts`: arma el slug (minúsculas, sin acentos, guiones, hasta 60 caracteres) y lo usan el feed, el editor y la página.

## 2. Arquitectura del editor

```
layout (servidor)
└── ComposerRoot (features/composer, cliente)    ← registra openCompose y carga el editor diferido
    ├── SiteHeader → "+ Crear"        (organismo) ─┐
    ├── BottomNav  → "Crear"          (organismo)  ├─ useCompose() de components/organisms/compose
    ├── ComposerPlaceholder (feed) → ComposeSlot   │  la caja: el lugar donde se expande
    └── ComposeScope (páginas de comunidad) ───────┘  fija la comunidad de la página
```

- **`components/organisms/compose/`:** contexto sin negocio. Expone `openCompose(defaults?)` y `setScope(community | null)`, y `ComposeSlot`: la caja de arriba se registra como el lugar del editor y, abierta, le cede su espacio. Sin provider (tests aislados), no hace nada.
- **`features/composer/`:** implementa el provider (`ComposerRoot`):
  - Pide cuenta con `requireAccount('post')`.
  - Carga el editor con `next/dynamic` con la primera intención de abrirlo (PC-19): pasar el mouse, enfocar o tocar un acceso empieza la descarga, así al terminar el clic suele estar.
  - La caja nunca queda vacía: oculta su texto recién cuando el editor ya está dibujado adentro, en el mismo cuadro (`useLayoutEffect`). Si la descarga tarda, se ve el texto hasta que llega.
  - **Desktop, la caja:** tocarla dibuja el editor dentro (portal al `ComposeSlot`), con un fundido escalonado (`specs/home-motion`). Al cerrarse se pliega: el alto baja hasta el de la caja cerrada (43 px) mientras se desvanece, en 150 ms, y recién ahí vuelve el texto, con un fundido; la caja le devuelve el foco.
  - **Desktop, "+ Crear"** (`view: 'modal'`), o una página sin caja: una ventana cerca de arriba, como la de X (una × y el título solo para lectores de pantalla), con el mismo editor. No mueve la página.
  - **La barra superior y el foco:** el `scroll-padding-top` de `html` (WCAG 2.4.11) hacía que enfocar un botón de la barra `sticky` moviera la página 360 px para "mostrarlo". Sus controles lo cancelan con un `scroll-margin-top` negativo (`globals.css`, `[data-site-header]`).
  - **Mobile:** un `Dialog` a pantalla completa que sube desde abajo, como X: "← Cancelar" y el título arriba, Publicar abajo. Es la única forma en mobile, también desde la caja.
- **`ComposeScope`:** un componente de cliente sin markup que las páginas de grupo, activo y tu perfil ponen con su comunidad. Así "+ Crear" sabe qué comunidad precargar (PC-06).

## 3. El editor

- **Formulario** con `react-hook-form` y `@hookform/resolvers` (`libraries.md`). Los componentes de shadcn se agregan con el CLI (Base UI): `field`, `input`, `textarea`, `tabs` y `combobox`.
- **Esquema** `createPostSchema` (zod), el mismo en el cliente y en la Server Action:
  - `communityId` (uuid), `type` (`TEXT` | `LINK`);
  - `title` (1 a 300 caracteres, recortado), `body` (no vacío);
  - `url` (`http(s)`, solo si es `LINK`).
  - Los mensajes de error son claves de traducción (`i18n.md`).
- **Comunidad:** un chip ("#defi ▾" o "Elige una comunidad ▾") que abre debajo una lista corta (`Combobox` de Base UI con el buscador adentro), con fundido y un leve desplazamiento al abrir.
  - Al abrir muestra tus comunidades (`GET /communities?mine=true`) con "Tu perfil" primero. Tu canal se pide aparte por su slug (`GET /communities/{username}`): `?mine=true` también trae los canales de la gente que seguís, donde no se puede publicar, y esos se filtran.
  - Al escribir busca (`GET /communities?search=`), con una pausa de 250 ms.
  - Las dos búsquedas son Server Actions (el navegador no llama a la API).
- **Tipo:** `Tabs`: Texto, Link e Imagen. Imagen es Próximamente (P-013).
  - El panel de Link solo agrega la URL. Título y cuerpo quedan fuera de los paneles, montados en todas las pestañas: un campo que se vuelve a montar al cambiar de pestaña puede perder lo que se acaba de escribir (lo encontró el e2e).
- **Cuerpo:** `textarea` que crece con el texto, con la ayuda "Admite Markdown".
- **Errores:** como X, nada se marca mientras se escribe. Publicar dice qué falta (con un campo vacío el esquema falla) y desde ahí los errores siguen lo que se escribe (`reValidateMode: onChange`). Validar al salir de un campo además movía la fila de formatos bajo el puntero.
- **Descartar** (PC-05): con algo escrito, Cancelar o Esc abren una confirmación ("¿Descartar el post?", `AlertDialog` de shadcn). El Esc que maneja la caja no sigue hasta el documento: la confirmación se abre en ese mismo evento y se cerraba con él.
  - Si hay algo escrito se le pregunta al formulario en el momento de cerrar (`getValues`), no a un estado que el editor avisa en un efecto: ese aviso podía llegar después de un Esc rápido.
- **Publicar:** `createPost` (Server Action). Valida, toma el `userId` de la sesión y llama a `POST /posts`.
  - Si sale bien, devuelve el `id` y el `title`: el cliente cierra el editor y navega a `postPath`.
  - Si falla, devuelve las claves por campo (`422`) o una general (`403 PERSONAL_CHANNEL_OWNER_ONLY`, `401`). El formulario no se borra.

## 4. Detalle

- **Datos:** `GET /posts/{id}` (post) y `GET /posts/{id}/comments` (árbol completo), en paralelo; los comentarios en `Suspense`.
- **Post:** reusa la cabecera (`CardByline`), `PostMarkdown` (cuerpo completo) y `VoteControl` de las tarjetas. Las piezas se extraen de `PostCard` sin cambiar cómo se ven en el feed.
  - El título es un `h1`.
  - Sin "Ver más".
  - Los comentarios se muestran desplegados.
- **Árbol** (`CommentTree`, servidor):
  - Cada nivel con una línea a la izquierda, como Reddit.
  - Desde el nivel 4, las respuestas se pliegan en "Ver N respuestas" (`Collapsible`).
  - Cada comentario: autor (link al perfil), tiempo, cuerpo en Markdown seguro, votos y "Responder".
- **Comentar:**
  - Una caja arriba del árbol y "Responder" en cada comentario, que abre una caja debajo.
  - `createComment` (Server Action) con `parentCommentId`.
  - El comentario nuevo aparece al instante como texto plano, al final de su nivel (el backend los ordena del más viejo al más nuevo).
  - La action llama a `refresh()` de `next/cache` (Next 16): la respuesta trae la página nueva y el comentario del servidor, con Markdown, reemplaza al optimista en el mismo render.
  - Sin sesión, el modal de cuenta.
- **Votos de comentarios:** `CommentVote` (cliente), la versión chica de `VoteControl`, con `voteComment` (`PUT/DELETE /comments/{id}/vote`).
- **SEO:**
  - El título del post.
  - La descripción: las primeras 160 letras del cuerpo, sin Markdown.
  - Canonical en la URL con slug, `hreflang`.
  - Un post borrado se muestra como borrado y lleva `noindex`.

## 5. Accesos

- **"+ Crear" en `SiteHeader`:** visible desde `md`, píldora gris con `PlusIcon`, antes de las notificaciones. Abre la ventana, con el alcance de la página.
- **"Crear" en `BottomNav`:** deja de ser `ComingSoon` y abre el editor a pantalla completa.
- **`ComposerPlaceholder`:** como la de X, cerrada se ve como la primera línea del editor abierto.
  - El avatar y el texto ("What are you thinking?") sin caja, del tamaño del título que se va a escribir.
  - Abajo, pasando el avatar: íconos de Link (abre el editor en Link), Imagen, Tesis y Live (Próximamente), y "Publicar" a la derecha en la píldora gris (abre el editor en Texto).
  - La caja es el editor: tocarla la expande (desktop) o abre la pantalla completa (mobile).
  - En las páginas de comunidad se muestra con el texto "Publicar en #defi" (como el prototipo).

## 6. Contrato y mocks

- `createPostResponseSchema` (el `Post`), `createCommentResponseSchema` (el `Comment`) y el voto de comentario (`{ score, viewerVote }`).
- **Mocks:**
  - `POST /posts`: valida como el backend (422, 403 del canal ajeno) y devuelve un post con un id nuevo.
  - `POST /posts/:id/comments` y `PUT/DELETE /comments/:id/vote`.
  - Los votos no guardan estado.
  - Los posts y comentarios creados sí quedan en memoria del proceso (`GET /posts/:id` y sus comentarios los encuentran), para que el e2e pueda publicar y ver el resultado.

## 7. Mensajes

- `composer.*` (cliente): título, campos, ayudas, errores, descartar y publicar.
- `postDetail.*` (servidor): comentarios, "Ver N respuestas", vacío y borrado.
- `comments.*` (cliente): "Responder", caja de comentario, errores.
- `nav.create`: ya existe; suma su versión para la barra superior.

## 8. Performance

- **El editor**, con `react-hook-form`, el combobox y las pestañas, va diferido: se descarga al primer toque.
- **En la primera carga** solo suman el contexto `compose`, el botón de la barra y la lógica de abrir, menos de 1 KB.
- **Medido al cerrar la spec**, en KB gzip (build de producción, mismo método que `e2e/performance.spec.ts`; la página de detalle se sumó a ese test):

  |                          | Home  | Comunidad, activo y perfil | Detalle |
  | ------------------------ | ----- | -------------------------- | ------- |
  | Antes de la spec         | 230,7 | 232,1                      | —       |
  | Con el detalle (parte 1) | 232,4 | 233,9                      | —       |
  | Con crear (parte 2)      | 233,0 | 234,6                      | 233,0   |
  | Con la caja como X       | 233,3 | 234,9                      | 233,3   |
  - La parte 2 suma 0,6 KB, como se estimó. El editor, el combobox, las pestañas y `react-hook-form` no llegan a la primera carga.
  - La parte 1 suma 1,7 KB: "Ver todos los comentarios" pasó al cliente (link o Próximamente, en `CommentsToggle`) y el control de votos ahora vota también comentarios.
  - La caja como X sumó el lugar del editor (`ComposeSlot`) y la lógica de desktop o mobile. Para entrar se recortó: un solo import diferido para las dos vistas, y "Ver todos los comentarios" se arma en el servidor (`SeeAllComments`) y llega al cliente como nodo.
  - **En las páginas de comunidad queda 0,1 KB.** Lo próximo que sume JS ahí necesita recortar antes o una decisión del PO.

## 9. Tests

| Qué                                                                                                                               | Dónde                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `postPath` y el slug (acentos, largo, vacío)                                                                                      | `lib/posts/paths.test.ts`                                                                    |
| Esquema del post (largos, URL solo en Link, `http(s)`)                                                                            | `create-post.schema.test.ts`                                                                 |
| Actions: validación, sesión, `userId` de la sesión, errores del backend                                                           | `create-post.action.test.ts`, `create-comment.action.test.ts`, `vote-comment.action.test.ts` |
| Editor: comunidad precargada, pestañas, Imagen Próximamente, contador, errores por campo, descartar, publicar                     | `post-editor.test.tsx`                                                                       |
| Contexto `compose` y los tres accesos; sin sesión, el modal                                                                       | `compose.test.tsx`, `site-header.test.tsx`, `bottom-nav.test.tsx`                            |
| Árbol, plegado desde el nivel 4, responder, votar                                                                                 | `comment-tree.test.tsx`, `comment-composer.test.tsx`                                         |
| E2E: publicar desde el Home y desde un grupo → detalle; slug y 308; 404; comentar y responder; votar; sin sesión; 360 px; axe; JS | `e2e/post-create-detail.spec.ts`                                                             |

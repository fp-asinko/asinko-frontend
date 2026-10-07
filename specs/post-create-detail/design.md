# Crear post y detalle de post — Design

> **Estado:** en revisión (2026-10-07).

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
    ├── ComposerPlaceholder (feed)                 │
    └── ComposeScope (páginas de comunidad) ───────┘  fija la comunidad de la página
```

- **`components/organisms/compose/`:** contexto sin negocio. Expone `openCompose(defaults?)` y `setScope(community | null)`. Sin provider (tests aislados), no hace nada.
- **`features/composer/`:** implementa el provider (`ComposerRoot`):
  - Pide cuenta con `requireAccount('post')`.
  - Carga el editor con `next/dynamic` la primera vez (PC-19).
  - Lo monta en un `Dialog` desde `md` y en un `Sheet` de pantalla completa en mobile.
- **`ComposeScope`:** un componente de cliente sin markup que las páginas de grupo, activo y tu perfil ponen con su comunidad. Así "+ Crear" sabe qué comunidad precargar (PC-06).

## 3. El editor

- **Formulario** con `react-hook-form` y `@hookform/resolvers` (`libraries.md`). Los componentes de shadcn se agregan con el CLI (Base UI): `field`, `input`, `textarea`, `tabs` y `combobox`.
- **Esquema** `createPostSchema` (zod), el mismo en el cliente y en la Server Action:
  - `communityId` (uuid), `type` (`TEXT` | `LINK`);
  - `title` (1 a 300 caracteres, recortado), `body` (no vacío);
  - `url` (`http(s)`, solo si es `LINK`).
  - Los mensajes de error son claves de traducción (`i18n.md`).
- **Comunidad:** un `Combobox`.
  - Al abrir muestra tus comunidades (`GET /communities?mine=true`) con "Tu perfil" primero.
  - Al escribir busca (`GET /communities?search=`), con una pausa de 250 ms.
  - Las dos búsquedas son Server Actions (el navegador no llama a la API).
- **Tipo:** `Tabs`: Texto, Link e Imagen. Imagen es Próximamente (P-013).
- **Cuerpo:** `textarea` que crece con el texto, con la ayuda "Admite Markdown".
- **Descartar** (PC-05): con algo escrito, Esc, × o afuera abren una confirmación ("¿Descartar el post?").
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
  - El comentario nuevo aparece al instante como texto plano y `router.refresh()` lo reemplaza por el de servidor, con Markdown.
  - Sin sesión, el modal de cuenta.
- **Votos de comentarios:** `CommentVote` (cliente), la versión chica de `VoteControl`, con `voteComment` (`PUT/DELETE /comments/{id}/vote`).
- **SEO:**
  - El título del post.
  - La descripción: las primeras 160 letras del cuerpo, sin Markdown.
  - Canonical en la URL con slug, `hreflang`.
  - Un post borrado se muestra como borrado y lleva `noindex`.

## 5. Accesos

- **"+ Crear" en `SiteHeader`:** visible desde `md`, píldora gris con `PlusIcon`, antes de las notificaciones. Abre el editor con el alcance de la página.
- **"Crear" en `BottomNav`:** deja de ser `ComingSoon` y abre el editor.
- **`ComposerPlaceholder`:**
  - La caja abre el editor.
  - "Post" lo abre en Texto.
  - Tesis y Live siguen como Próximamente.
  - En las páginas de comunidad se muestra con el texto "Publicar en #defi" (como el prototipo).

## 6. Contrato y mocks

- `createPostResponseSchema` (el `Post`), `createCommentResponseSchema` (el `Comment`) y el voto de comentario (`{ score, viewerVote }`).
- **Mocks:**
  - `POST /posts`: valida como el backend (422, 403 del canal ajeno) y devuelve un post con un id nuevo.
  - `POST /posts/:id/comments` y `PUT/DELETE /comments/:id/vote`.
  - No guardan estado, como los votos.
  - Sí guardan el último post creado en memoria del proceso (`GET /posts/:id` lo encuentra), para que el e2e pueda publicar y ver el detalle.

## 7. Mensajes

- `composer.*` (cliente): título, campos, ayudas, errores, descartar y publicar.
- `postDetail.*` (servidor): comentarios, "Ver N respuestas", vacío y borrado.
- `comments.*` (cliente): "Responder", caja de comentario, errores.
- `nav.create`: ya existe; suma su versión para la barra superior.

## 8. Performance

- **El editor**, con `react-hook-form`, el combobox y las pestañas, va diferido: se descarga al primer toque.
- **En la primera carga** solo suman el contexto `compose`, el botón de la barra y la lógica de abrir, menos de 1 KB.
- **Hoy estamos en 230,6 / 235 KB.** La página de detalle se suma a `e2e/performance.spec.ts`.

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
